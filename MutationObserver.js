/*
Straight up polyfill of mutationobserver for mootools
will lazy patch in the necessary polyfills 
See http://dev.opera.com/articles/view/mutation-observers-tutorial/ for usage

The fallback for MutationRecord will return an `Elements` collection in place of NodeList

Goals: keep this async and batch changes (gotta use setInterval)
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
        var each = function (object, fn, bind){
            for (var key in object){
                if (has.call(object, key)) fn.call(bind, object[key], key, object);
            }
        };

        var MutationRecord = window.MutationRecord = function(data) {
            each(data, function(v,k) {
                this[k] = v;
            }, this);
        };
        MutationRecord.prototype = {
            target: null,
            type: null,
            addedNodes: [],
            removedNodes: [],
            attributeName: null,
            oldValue: null
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
                if(sameNode(node, set[i])) return i + from;
            }
            return -1;
        };

        //set the ids for all of an elements children
        var $id_kids = function(ele) {
            if(ele.nodeType !== 3) {
                foreach.call(ele.children, function(node) {//only iterate elements not text nodes
                    getId(node);
                    $id_kids(node);
                });
            }
            
        };

        //findChildMutations: array of mutations so far, element, element clone, bool => array of mutations
        var findChildMutations = function(target, oldstate, deep) {
            var mutations = [];
            var add = function(node) {
                mutations.push(new MutationRecord({
                    type: "childList",
                    target: node.parentElement,
                    addedNodes: [node]
                }));
                if(deep) $id_kids(node);
            };
            var rem = function(node) {
                mutations.push(new MutationRecord({
                    type: "childList",
                    target: target,
                    removedNodes: [node]
                }));
                if(deep) $id_kids(node);
            };

            var findMut = function(node, oldnode) {
                var kids = node.childNodes;
                var oldkids = oldnode.childNodes;
                var klen = kids.length;
                var olen = oldkids.length;
                
                //id to i and j - optimization and nec search hash
                var id;
                var map = {};

                //array of potention conflict hashes
                var conflicts = [];
                var tot_conf;
                var resolver = function(conflict) {
                    var node = kids[conflict.i];
                    var old = oldkids[conflict.j];
                    if(Math.abs(conflict.i - conflicts.j) >= tot_conf) {
                        if(conflict.o) {
                            rem(node);
                        } else {
                            add(node);
                        }
                    } else {
                        if(deep) findMut(node, old);
                    }
                };

                //iterate over both old and current child nodes at the same time
                for(var i = 0, j = 0, k, l; i < klen || j < olen; ) {
                    if(sameNode(kids[i], oldkids[j])) {
                        if(deep) {//recurse
                            findMut(kids[i], oldkids[j]);
                        }

                        //resolve conflicts
                        tot_conf = conflicts.length-2;//so propogater will be found
                        conflicts.forEach(resolver);
                        conflicts = [];

                        i++;
                        j++;
                    } else {//lookahead until they are the same again or the end of children
                        if(i < klen) {
                            id = getId(kids[i]);
                            if((k = map[id] ? map[id].j : findIndex(oldkids, kids[i], j)) === -1) {
                                add(kids[i]);
                                i++;
                                continue;
                            } else {
                                conflicts.push(map[id] = {i:i,j:k});//bit dirty
                                i++;
                            }
                        }

                        if(j < olen) {
                            id = getId(oldkids[j]);
                            if((l = map[id] ? map[id].i : findIndex(kids, oldkids[j], i)) === -1) {
                                rem(oldkids[j]);
                                j++;
                                continue;
                            } else {
                                conflicts.push(map[id] = {
                                    i: l,
                                    j: j,
                                    o: true//old marker
                                });
                                j++;
                            }
                        }
                    }
                }
            };
            findMut(target, oldstate);
            return mutations;
        };

        var noop = function() {};

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
                findChildMutations(element, element, deep);//set ids on element
                var $old = element.cloneNode(true);
                return function() {
                    var changed = findChildMutations(element, $old, deep);
                    $old = element.cloneNode(true);
                    return changed;
                };
            }
        };

        var MutationObserver = window.MutationObserver = function(listener) {
            this._listener = listener;
            this._intervals = [];
            this._watched = [];
        };

        MutationObserver.prototype = {
            options: {
                period: 25 //recheck interval
            },

            observe: function(target, config) {
                var self = this;

                if(config.attributeFilter && config.attributes) {
                    config.attributes = config.attributeFilter;
                }
                if(config.subtree && config.childList) {
                    config.childList = {deep:true};
                }

                each(config, function(use, type) {
                    if (use) {
                        var patch = patches[type].call(self, target, use);
                        if(patch) self._watched.push(patch);
                    }
                });

                this._intervals.push(setInterval(this._watch.bind(this), this.options.period));
            },

            _watch: function() {
                var changed = [];

                this._watched.forEach(function(watcher) {
                    var data = watcher();//expected array
                    if(data) push.apply(changed, data);
                });

                if (changed.length > 0) { //fire away
                    this._listener(changed, this);
                }
            },

            disconnect: function() {
                this._intervals.forEach(function(t) {clearInterval(t);});//ie throws a fit if u dont wrap clear
            }
        };
    }
})(window);