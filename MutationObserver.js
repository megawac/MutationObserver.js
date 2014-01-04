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
        var foreach = arrayProto.forEach;
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

        //Assigns a unique id to each node to be watched in order to be able to compare cloned nodes
        //TODO find a cleaner way eg some hash represnetnation
        var counter = 0;
        var getId = function($ele) {
            var id = $ele.nodeType === 3 ? $ele.nodeValue ://text node id is the text content
                                            $ele.id || $ele.getAttribute("mut-id") || ++counter;
            if(id === counter) {
                $ele.setAttribute("mut-id", id);
            }
            return id;
        };

        var sameNode = function(node1, node2) {
            return node1 && node2 && getId(node1) === getId(node2);
        };

        var findIndex = function(set, node, from) {
            from = ~~from;
            for(var i = from,l=set.length; i<l; i++) {
                if(sameNode(node, set[i])) return i;
            }
            return -1;
        };

        //set the ids for all of an elements children
        var $id_kids = function(ele, deep) {
            if(ele.nodeType !== 3) {//textNode
                foreach.call(ele.children, function(node) {//only iterate elements not text nodes
                    getId(node);
                    if(deep) $id_kids(node, deep);
                });
            }
            // return ele;
        };

        //findChildMutations: array of mutations so far, element, element clone, bool => array of mutations
        // dfs comparision search of two nodes
        // perf and function tests: http://jsbin.com/uhoVibU/4
        var findChildMutations = function(target, oldstate, deep) {
            var mutations = [];
            var add = function(node) {
                mutations.push(new MutationRecord({
                    type: "childList",
                    target: node.parentElement,
                    addedNodes: [node]
                }));
                if(deep) $id_kids(node, deep);//ensure children of added ele have ids
            };
            var rem = function(node) {
                mutations.push(new MutationRecord({
                    type: "childList",
                    target: deep ? node.parentElement : target,//so target will appear correct on childList - more complicated on subtree
                    removedNodes: [node]
                }));
            };

            var findMut = function(node, oldnode) {
                var $kids = node.childNodes;
                var $oldkids = oldnode.childNodes;
                var klen = $kids.length;
                var olen = $oldkids.length;
                
                //id to i and j search hash to prevent double checking an element
                var id;
                var map = {};

                //array of potention conflict hashes
                var conflicts = [];

                //offsets
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
                            rem($kids[conflict.i]);
                            counter++;
                        } else if(deep) {//conflicts resolved - check deep
                            findMut($kids[conflict.i], $oldkids[conflict.j]);
                        }
                    }
                    offset_rem = conflicts.length = 0;
                };

                //iterate over both old and current child nodes at the same time
                for(var i = 0, j = 0, p; i < klen || j < olen; ) {
                    if(sameNode($kids[i], $oldkids[j])) {//simple expected case
                        if(deep) {//recurse
                            findMut($kids[i], $oldkids[j]);
                        }

                        //resolve conflicts
                        resolver();

                        i++;
                        j++;
                    } else {//lookahead until they are the same again or the end of children
                        if(i < klen) {
                            id = getId($kids[i]);
                            //check id is in the location map otherwise do a indexOf search
                            if(!has.call(map, id)) {//not already found
                                if((p = findIndex($oldkids, $kids[i], j)) === -1) {
                                    add($kids[i]);
                                } else {
                                    conflicts.push(map[id] = {//bit dirty
                                        i: i,
                                        j: p
                                    });
                                }
                            }
                            i++;
                        }

                        if(j < olen) {
                            id = getId($oldkids[j]);
                            if(!has.call(map, id)) {
                                if((p = findIndex($kids, $oldkids[j], i)) === -1) {
                                    rem($oldkids[j]);
                                    offset_rem++;
                                } else {
                                    conflicts.push(map[id] = {
                                        i: p,
                                        j: j
                                    });
                                }
                            }
                            j++;
                        }
                    }
                }
                resolver();
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
                $id_kids(element, deep);//set ids on element children
                var $old = element.cloneNode(true);
                return function() {
                    var changed = findChildMutations(element, $old, deep);
                    if(changed.length > 0) $old = element.cloneNode(true);
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