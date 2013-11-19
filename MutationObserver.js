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
        var map = arrayProto.map;
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
        }
        MutationRecord.prototype = {
            target: null,
            type: null,
            addedNodes: [],
            removedNodes: [],
            attributeName: null,
            oldValue: null
        };

        var getChildren = function($e) {
            return map.call($e.childNodes, function(e) {return e});
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
                                type: 'attributes',
                                attributeName: prop,
                                oldValue: old[prop]
                            }));
                        }
                        delete old[prop];
                    });
                    each(old, function(val, prop) {
                        changed.push(new MutationRecord({
                            target: element,
                            type: 'attributes',
                            attributeName: prop,
                            oldValue: old[prop]
                        }));
                    });
                    return changed;
                };
            },

            attributeFilter: noop,
            attributeOldValue: noop,

            childList: function(element) {
                var $old = getChildren(element);
                return function() {
                    var changed = [];
                    var old = $old;
                    var kids = getChildren(element);
                    $old = kids;

                    kids.forEach(function($e) {
                        var index = old.indexOf($e);
                        if (index !== -1) {
                            old.splice(index, 1);
                        } else {
                            changed.push(new MutationRecord({
                                target: element,
                                type: 'childList',
                                addedNodes: [$e]
                            }));
                        }
                    });
                    //rest are clearly removed
                    old.forEach(function($e) {
                        changed.push(new MutationRecord({
                            target: element,
                            type: 'childList',
                            removedNodes: [$e]
                        }));
                    });
                    return changed;
                };
            }
        };

        window.MutationObserver = function(listener) {
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