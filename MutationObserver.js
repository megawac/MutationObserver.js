/*!
* Shim for MutationObserver interface
* Author: Graeme Yeates (github.com/megawac)
* Repository: https://github.com/megawac/MutationObserver.js
* License: WTFPL V2, 2004 (wtfpl.net).
* Feel free to exclude the header and redistribute as you please.
* See https://github.com/WebKit/webkit/blob/master/Source/WebCore/dom/MutationObserver.cpp for current webkit source c++ implementation
*/
(function(window) {
    "use strict";
    /*
    prefix bugs:
        -https://bugs.webkit.org/show_bug.cgi?id=85161
        -https://bugzilla.mozilla.org/show_bug.cgi?id=749920
    */
    var MutationObserver = window.MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if (!MutationObserver) {
        var arrayProto = Array.prototype;
        var push = arrayProto.push;
        var indexOf = arrayProto.indexOf;
        var map = arrayProto.map;
        // var reduce = arrayProto.reduce;

        // var has = Object.hasOwnProperty;
        var has = function(obj, prop) { //instead of has.call(obj, prop)
            return typeof obj[prop] !== "undefined";
        };
        var forIn = function (obj, fn/*, bind*/) {//currently not using bind
            // if(bind) fn = fn.bind(bind);//hoist optimization
            for (var prop in obj){
                //minor optimization to allow for mark deletions instead of direct deletetions
                if (typeof obj[prop] !== "undefined") fn(obj[prop], prop, obj);
            }
        };
        //indexOf for collection using a comparitor
        var findIndex = function(set, comparitor, from) {
            for(var i = ~~from, l=set.length; i<l; i++) {
                if(comparitor(set[i])) return i;
            }
            return -1;
        };

        //MutationObserver property names (mainly for minimization)
        var _childList = "childList";
        var _attributes = "attributes";
        
        //id property
        var expando = "mo_id";

        /* public api code */
        var MutationRecord = window.MutationRecord = function(data) {
            var settings = {
                target: null,
                type: null,
                addedNodes: [],
                removedNodes: [],
                attributeName: null,
                oldValue: null
            };
            forIn(data, function(v,k) {
                settings[k] = v;
            });
            return settings;
        };

        /* attributes + attributeFilter helpers */

        var getAttributes = function($e, filter) { //store dynamic attributes in a object
            var attrs = {};
            var attributes = $e.attributes;
            var attr;
            for (var i = 0, l = attributes.length; i < l; i++) {
                attr = attributes[i];
                if(!filter || has(filter, attr.name)) {
                    attrs[attr.name] = attr.value;
                }
            }
            return attrs;
            //Alternative slower code:
            /*return reduce.call($e.attributes, function(memo, attr) {
                if(!filter || has(filter, attr.name)) {
                    memo[attr.name] = attr.value;
                }
                return memo;
            }, {});*/
        };


        /*subtree and childlist helpers*/
        //discussion: http://codereview.stackexchange.com/questions/38351

        //using a non id (eg outerHTML or nodeValue) is extremely naive and will run into issues with nodes that may appear the same like <li></li>
        var counter = 1;//don't use 0 as id (falsy)
        var getId = function($ele) {
            return $ele.id || ($ele[expando] = $ele[expando] || ++counter);
        };

        //clone an html node into a custom datastructure
        // see https://gist.github.com/megawac/8201012
        var clone = function (par, deep) {
            var copy = function(par, top) {
                return {
                    node: par,
                    kids: top || deep ? map.call(par.childNodes, function(node) {
                        return copy(node);
                    }) : null
                };
            };
            return copy(par, true);
        };

        //findChildMutations: array of mutations so far, element, element clone, bool => array of mutations
        // dfs comparision search of two nodes
        // this has to be as quick as possible
        var findChildMutations = function(target, oldstate, deep) {
            var mutations = [];
            var add = function(node) {
                mutations.push(MutationRecord({
                    type: _childList,
                    target: node.parentElement,
                    addedNodes: [node]
                }));
            };
            var rem = function(node, tar) {//have to pass tar because node.parentElement will be null when removed
                mutations.push(MutationRecord({
                    type: _childList,
                    target: tar,
                    removedNodes: [node]
                }));
            };

            var findMut = function(node, old) {
                var $kids = node.childNodes;
                var $oldkids = old.kids;
                var klen = $kids.length;
                var olen = $oldkids.length;

                if(!olen && !klen) return;//both empty; clearly no changes

                //id to i and j search hash to prevent double checking an element
                var map = {};
                var id;
                var idx;//index of a moved or inserted element

                //array of potention conflict hashes
                var conflicts = [];

                /*
                * There is no gaurentee that the same node will be returned for both added and removed nodes
                * if the positions have been shuffled.
                */
                var resolveConflicts = function() {
                    var size = conflicts.length - 1;
                    var counter = -~ (size / 2);//prevents same conflict being resolved twice consider when two nodes switch places. only one should be given a mutation event (note -~ is math.ceil shorthand)
                    conflicts.forEach(function(conflict) {
                        //attempt to determine if there was node rearrangement... won't gaurentee all matches
                        //also handles case where added/removed nodes cause nodes to be identified as conflicts
                        if(counter && Math.abs(conflict.i - conflict.j) >= size) {
                            add($kids[conflict.i]);//rearrangment ie removed then readded
                            rem($kids[conflict.i], old.node);
                            counter--;//found conflict
                        } else if(deep) {//conflicts resolved - check deep
                            findMut($kids[conflict.i], $oldkids[conflict.j]);
                        }
                    });
                    conflicts = [];//clear conflicts
                };

                //current and old nodes
                var $cur;
                var $old;

                //iterate over both old and current child nodes at the same time
                for(var i = 0, j = 0; i < klen || j < olen; ) {
                    //current and old nodes at the indexs
                    $cur = $kids[i];
                    $old = j < olen && $oldkids[j].node;

                    if($cur === $old) {//simple expected case - needs to be as fast as possible
                        //recurse on next level of children
                        if(deep) findMut($cur, $oldkids[j]);

                        //resolve conflicts
                        if(conflicts.length) resolveConflicts();

                        i++;
                        j++;
                    } else {//(uncommon case) lookahead until they are the same again or the end of children
                        if($cur) {
                            id = getId($cur);
                            //check id is in the location map otherwise do a indexOf search
                            if(!has(map, id)) {//not already found
                                /* jshint loopfunc:true */
                                if((idx = findIndex($oldkids, function($el) { return $el.node === $cur; }, j)) === -1) { //custom indexOf using comparitor
                                    add($cur);//$cur is a new node
                                } else {
                                    map[id] = true;//mark id as found
                                    conflicts.push({//add conflict
                                        i: i,
                                        j: idx
                                    });
                                }
                            }
                            i++;
                        }

                        if($old) {
                            id = getId($old);
                            if(!has(map, id)) {
                                if((idx = indexOf.call($kids, $old, i)) === -1) {//dont need to use a special indexof but need to i-1 due to o-b-1 from previous part
                                    rem($old, old.node);
                                } else if(idx === 0) {//special case: if idx=0 i and j are congurent so we can continue without conflict
                                    continue;
                                } else {
                                    map[id] = true;
                                    conflicts.push({
                                        i: idx,
                                        j: j
                                    });
                                }
                            }
                            j++;
                        }
                    }
                }
                if(conflicts.length) resolveConflicts();
            };
            findMut(target, oldstate);
            return mutations;
        };

        //patches return a function which return an array of mutations. If nothing is returned its return discarded at runtime
        //these functions are called many times a second - should optimize for no mutations
        var patches = {
            attributes: function(element, filter) {
                if(filter && filter.reduce) {
                    filter = filter.reduce(function(a, b) {a[b] = true; return a;}, {});//convert array to hash for faster lookup
                } else {
                    filter = null;
                }
                var $old = getAttributes(element, filter);
                return function() {
                    var changed = [];
                    var $attr = getAttributes(element, filter);

                    //simple object diff on two objects with all plain vals
                    forIn($attr, function(val, prop) {
                        if ($old[prop] !== val) {
                            changed.push(MutationRecord({
                                target: element,
                                type: _attributes,
                                attributeName: prop,
                                oldValue: $old[prop]
                            }));
                        }
                        delete $old[prop];
                    });
                    forIn($old, function(val, prop) {//clearly rest are mutations
                        changed.push(MutationRecord({
                            target: element,
                            type: _attributes,
                            attributeName: prop,
                            oldValue: val
                        }));
                    });

                    $old = $attr;

                    return changed;
                };
            },

            childList: function(element, deep) {
                deep = deep === patches;//observe will give the patches if we should watch subtree
                var $old = clone(element, deep);
                return function() {
                    var changed = findChildMutations(element, $old, deep);
                    if(changed.length) $old = clone(element, deep);//reclone if there've been changes
                    return changed;
                };
            }

            // attributeFilter: noop,
            // attributeOldValue: noop,
            // characterData: noop,
            // characterDataOldValue: noop,
            // subtree: noop,
        };

        MutationObserver = window.MutationObserver = function(listener) {
            var self = this;
            self._watched = [];
            self._checker = function() {
                //do a check if _watched is empty?
                var mutations = self.takeRecords();

                if (mutations.length) { //fire away
                    listener.call(self, mutations, self);//call is not spec but consistent with other implementations
                }
            };
        };

        MutationObserver._period = 40;//Period to check for mutations (25 times/sec)

        MutationObserver.prototype = {
            observe: function(target, config) {
                var self = this;
                var patch;

                //see http://dom.spec.whatwg.org/#dom-mutationobserver-observe
                //not going to throw here but going to follow the spec config sets
                if(config.attributeFilter || config.attributeOldValue) {
                    config[_attributes] = config.attributeFilter || true;
                }
                //some browsers are strict in their implementation that config.subtree and childList must be set together. We don't care - spec doesn't specify
                if(config.subtree/*&& has(config, _childList)*/) {
                    config[_childList] = patches;
                }

                forIn(config, function(use, type) {
                    if (use && has(patches, type)) {
                        patch = patches[type].call(self, target, use);
                        if(patch) self._watched.push(patch);//patch will be a function or falsy if we shouldnt watch
                    }
                });
                
                if(!self._interval) {
                    this._interval = setInterval(this._checker, MutationObserver._period);
                }
            },

            //finds mutations since last check and empties the "record queue" i.e. mutations will only be found once
            takeRecords: function() {
                var mutations = [];
                var watched = this._watched;
                var res;

                for(var i = 0, l = watched.length; i < l; i++) {
                    res = watched[i]();
                    if(res.length) push.apply(mutations, res);//expect no mutations most of the time
                }

                return mutations;
            },

            disconnect: function() {
                this._watched = [];//just clear the stuff being observed
                clearInterval(this._interval);//ready for garbage collection
                this._interval = null;
            }
        };
    }
})(window);