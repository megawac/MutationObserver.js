/*!
* MutationObserver-Shim v0.1.0 (http://github.com/megawac/MutationObserver.js)
* Authors: Graeme Yeates (yeatesgraeme@gmail.com) 
* Use, redistribute and modify as desired. Released under WTFPL v2 2004.
*/
!function(window) {
    "use strict";
    var MutationObserver = window.MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if (!MutationObserver) {
        var arrayProto = Array.prototype, push = arrayProto.push, indexOf = arrayProto.indexOf, map = arrayProto.map, has = function(obj, prop) {
            return "undefined" != typeof obj[prop];
        }, forIn = function(obj, fn) {
            for (var prop in obj) "undefined" != typeof obj[prop] && fn(obj[prop], prop, obj);
        }, findIndex = function(set, comparitor, from) {
            for (var i = ~~from, l = set.length; l > i; i++) if (comparitor(set[i])) return i;
            return -1;
        }, _childList = "childList", _attributes = "attributes", expando = "mo_id", MutationRecord = window.MutationRecord = function(data) {
            var settings = {
                target: null,
                type: null,
                addedNodes: [],
                removedNodes: [],
                attributeName: null,
                oldValue: null
            };
            return forIn(data, function(v, k) {
                settings[k] = v;
            }), settings;
        }, getAttributes = function($e, filter) {
            for (var attr, attrs = {}, attributes = $e.attributes, i = 0, l = attributes.length; l > i; i++) attr = attributes[i], 
            (!filter || has(filter, attr.name)) && (attrs[attr.name] = attr.value);
            return attrs;
        }, counter = 1, getId = function($ele) {
            return $ele.id || ($ele[expando] = $ele[expando] || ++counter);
        }, clone = function(par, deep) {
            var copy = function(par, top) {
                return {
                    node: par,
                    kids: top || deep ? map.call(par.childNodes, function(node) {
                        return copy(node);
                    }) : null
                };
            };
            return copy(par, !0);
        }, findChildMutations = function(target, oldstate, deep) {
            var mutations = [], add = function(node) {
                mutations.push(MutationRecord({
                    type: _childList,
                    target: node.parentElement,
                    addedNodes: [ node ]
                }));
            }, rem = function(node, tar) {
                mutations.push(MutationRecord({
                    type: _childList,
                    target: tar,
                    removedNodes: [ node ]
                }));
            }, findMut = function(node, old) {
                var $kids = node.childNodes, $oldkids = old.kids, klen = $kids.length, olen = $oldkids.length;
                if (olen || klen) {
                    for (var id, idx, $cur, $old, map = {}, conflicts = [], resolveConflicts = function() {
                        var size = conflicts.length - 1, counter = -~(size / 2);
                        conflicts.forEach(function(conflict) {
                            counter && Math.abs(conflict.i - conflict.j) >= size ? (add($kids[conflict.i]), 
                            rem($kids[conflict.i], old.node), counter--) : deep && findMut($kids[conflict.i], $oldkids[conflict.j]);
                        }), conflicts = [];
                    }, i = 0, j = 0; klen > i || olen > j; ) if ($cur = $kids[i], $old = olen > j && $oldkids[j].node, 
                    $cur === $old) deep && findMut($cur, $oldkids[j]), conflicts.length && resolveConflicts(), 
                    i++, j++; else if ($cur && (id = getId($cur), has(map, id) || (-1 === (idx = findIndex($oldkids, function($el) {
                        return $el.node === $cur;
                    }, j)) ? add($cur) : (map[id] = !0, conflicts.push({
                        i: i,
                        j: idx
                    }))), i++), $old) {
                        if (id = getId($old), !has(map, id)) if (-1 === (idx = indexOf.call($kids, $old, i))) rem($old, old.node); else {
                            if (0 === idx) continue;
                            map[id] = !0, conflicts.push({
                                i: idx,
                                j: j
                            });
                        }
                        j++;
                    }
                    conflicts.length && resolveConflicts();
                }
            };
            return findMut(target, oldstate), mutations;
        }, patches = {
            attributes: function(element, filter) {
                filter = filter && filter.reduce ? filter.reduce(function(a, b) {
                    return a[b] = !0, a;
                }, {}) : null;
                var $old = getAttributes(element, filter);
                return function() {
                    var changed = [], $attr = getAttributes(element, filter);
                    return forIn($attr, function(val, prop) {
                        $old[prop] !== val && changed.push(MutationRecord({
                            target: element,
                            type: _attributes,
                            attributeName: prop,
                            oldValue: $old[prop]
                        })), delete $old[prop];
                    }), forIn($old, function(val, prop) {
                        changed.push(MutationRecord({
                            target: element,
                            type: _attributes,
                            attributeName: prop,
                            oldValue: val
                        }));
                    }), $old = $attr, changed;
                };
            },
            childList: function(element, deep) {
                deep = deep === patches;
                var $old = clone(element, deep);
                return function() {
                    var changed = findChildMutations(element, $old, deep);
                    return changed.length && ($old = clone(element, deep)), changed;
                };
            }
        };
        MutationObserver = window.MutationObserver = function(listener) {
            var self = this;
            self._watched = [], self._checker = function() {
                var mutations = self.takeRecords();
                mutations.length && listener.call(self, mutations, self);
            };
        }, MutationObserver._period = 40, MutationObserver.prototype = {
            observe: function(target, config) {
                var patch, self = this;
                (config.attributeFilter || config.attributeOldValue) && (config[_attributes] = config.attributeFilter || !0), 
                config.subtree && (config[_childList] = patches), forIn(config, function(use, type) {
                    use && has(patches, type) && (patch = patches[type].call(self, target, use), patch && self._watched.push(patch));
                }), self._interval || (this._interval = setInterval(this._checker, MutationObserver._period));
            },
            takeRecords: function() {
                for (var res, mutations = [], watched = this._watched, i = 0, l = watched.length; l > i; i++) res = watched[i](), 
                res.length && push.apply(mutations, res);
                return mutations;
            },
            disconnect: function() {
                this._watched = [], clearInterval(this._interval), this._interval = null;
            }
        };
    }
}(window);