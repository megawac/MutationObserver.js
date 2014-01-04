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
    window.MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if (!window.MutationObserver) {
        var arrayProto = Array.prototype;
        var push = arrayProto.push;
        var indexOf = arrayProto.indexOf;
        var map = arrayProto.map;
        var has = Object.hasOwnProperty;
        var noop = function() {};
        var each = function (object, fn, bind){
            for (var key in object){
                if (has.call(object, key)) fn.call(bind, object[key], key, object);
            }
        };

        var getAttributes = function($e, filter) { //store dynamic attributes in a object
            var attrs = {};
            var attributes = $e.attributes;
            for (var i = attributes.length - 1; i >= 0; i--) {
                if(!filter || filter[attributes[i].name]) {
                    attrs[attributes[i].name] = attributes[i].value;
                }
            }
            return attrs;
        };

        /*subtree and childlist helpers*/

        //using a non id (eg outerHTML or nodeValue) is extremely naive and will run into issues with nodes that may appear the same like <li></li>
        var counter = 0;
        var getId = function($ele) {
            return $ele.id || ($ele._id = $ele._id || counter++);
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
                mutations.push(new MutationRecord({
                    type: "childList",
                    target: node.parentElement,
                    addedNodes: [node]
                }));
            };
            var rem = function(node, tar) {//have to pass tar because node.parentElement will be null when removed
                mutations.push(new MutationRecord({
                    type: "childList",
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
                var id;
                var map = {};

                //array of potention conflict hashes
                var conflicts = [];

                //offsets since last resolve. Can also solve the problem with a continue but we exect this method to be faster as i and j should eventually correlate
                //var offset_add = 0;//nodes added since last resolve //we dont have to check added as these are handled before remove
                var offset_rem = 0;//nodes removed since last resolve
                /*
                * There is no gaurentee that the same node will be returned for both added and removed nodes
                * if the position has been shuffled
                */
                var resolver = function() {
                    var counter = 0;//prevents same conflict being resolved twice
                    var conflict;
                    for (var i = 0, l = conflicts.length-1; i <= l; i++) {
                        conflict = conflicts[i];
                        //attempt to determine if there was node rearrangement... won't gaurentee all matches
                        //also handles case where added/removed nodes cause nodes to be identified as conflicts
                        if(counter < l && Math.abs(conflict.i - (conflict.j + offset_rem)) >= l) {
                            add($kids[conflict.i]);//rearrangment ie removed then readded
                            rem($kids[conflict.i], old.node);
                            counter++;
                        } else if(deep) {//conflicts resolved - check deep
                            findMut($kids[conflict.i], $oldkids[conflict.j]);
                        }
                    }
                    offset_rem = conflicts.length = 0;//clear conflicts
                };

                var $cur, $old;//current and old nodes

                //iterate over both old and current child nodes at the same time
                for(var i = 0, j = 0, idx; i < klen || j < olen; ) {
                    //current and old nodes at the indexs
                    $cur = $kids[i];
                    $old = $oldkids[j] && $oldkids[j].node;

                    if($cur === $old) {//simple expected case - needs to be as fast as possible
                        if(deep) {//recurse
                            findMut($kids[i], $oldkids[j]);
                        }

                        //resolve conflicts
                        if(conflicts.length) resolver();

                        i++;
                        j++;
                    } else {//lookahead until they are the same again or the end of children
                        if($cur) {
                            id = getId($cur);
                            //check id is in the location map otherwise do a indexOf search
                            if(!has.call(map, id)) {//not already found
                                if((idx = indexOf.call($oldkids, $cur, j)) === -1) {
                                    add($cur);
                                } else {
                                    map[id] = true;
                                    conflicts.push({//bit dirty
                                        i: i,
                                        j: idx
                                    });
                                }
                            }
                            i++;
                            //continue;
                        }

                        if($old) {
                            id = getId($old);
                            if(!has.call(map, id)) {
                                if((idx = indexOf.call($kids, $old, i)) === -1) {
                                    rem($old, old.node);
                                    offset_rem++;
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
                if(conflicts.length) resolver();
            };
            findMut(target, oldstate);
            return mutations;
        };

        //patches return a function which return an array of mutations. If nothing is returned its return discarded at runtime
        var patches = {
            attributes: function(element, filter) {
                if(filter && filter.reduce) {
                    filter = filter.reduce(function(a, b) {a[b] = true; return a;}, {});
                } else {
                    filter = null;
                }
                var $old = getAttributes(element, filter);
                return function() {
                    var changed = [];
                    var old = $old;
                    var attr = getAttributes(element, filter);
                    $old = attr;

                    each(attr, function(val, prop) {
                        if (old[prop] !== val) {
                            changed.push(new MutationRecord({
                                target: element,
                                type: "attributes",
                                attributeName: prop,
                                oldValue: old[prop]
                            }));
                        }
                        delete old[prop];
                    });
                    each(old, function(val, prop) {
                        changed.push(new MutationRecord({
                            target: element,
                            type: "attributes",
                            attributeName: prop,
                            oldValue: old[prop]
                        }));
                    });
                    return changed;
                };
            },

            attributeFilter: noop,
            attributeOldValue: noop,
            subtree: noop,

            childList: function(element, deep) {
                deep = !!(deep && deep.deep);//observe will give an object
                var $old = clone(element, deep);
                return function() {
                    var changed = findChildMutations(element, $old, deep);
                    if(changed.length > 0) $old = clone(element, deep);//reclone if there've been changes
                    return changed;
                };
            }
        };

        /* public api code */
        var MutationRecord = window.MutationRecord = function(data) {
            each(data, function(v,k) {
                this[k] = v;
            }, this);
        };

        var MutationObserver = window.MutationObserver = function(listener) {
            var self = this;
            //http://dom.spec.whatwg.org/#queuing-a-mutation-record
            var check = function() {
                var mutations = self.takeRecords();

                if (mutations.length > 0) { //fire away
                    listener(mutations, self);
                }
            };

            self._watched = [];
            self._interval = setInterval(check, self.options.period);
        };

        MutationRecord.prototype = {
            target: null,
            type: null,
            addedNodes: [],
            removedNodes: [],
            attributeName: null,
            oldValue: null
        };

        MutationObserver.prototype = {
            options: {
                period: 25 //recheck interval
            },

            observe: function(target, config) {
                var self = this;

                //see http://dom.spec.whatwg.org/#dom-mutationobserver-observe
                //not going to throw here but going to follow the spec config sets
                if(config.attributeFilter || config.attributeOldValue) {
                    config.attributes = config.attributeFilter || true;
                }
                if(config.subtree && config.childList) {
                    config.childList = {deep:true};
                }

                each(config, function(use, type) {
                    if (use) {
                        var patch = patches[type].call(self, target, use);
                        if(patch) self._watched.push(patch);//patch will be a function or falsy if we shouldnt watch
                    }
                });
            },

            //finds mutations since last check and empties the "record queue" i.e. mutations will only be found once
            takeRecords: function() {
                var mutations = [];

                this._watched.forEach(function(watcher) {
                    push.apply(mutations, watcher());//faster than concat when b is small. We expect no mutations most of the time
                });

                return mutations;
            },

            disconnect: function() {
                clearInterval(this._interval);
            }
        };
    }
})(window);