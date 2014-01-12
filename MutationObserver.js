/*!
 * Shim for MutationObserver interface
 * Author: Graeme Yeates (github.com/megawac)
 * Repository: https://github.com/megawac/MutationObserver.js
 * License: WTFPL V2, 2004 (wtfpl.net).
 * Though credit and staring the repo will make me feel pretty, you can modify and redistribute as you please.
 * See https://github.com/WebKit/webkit/blob/master/Source/WebCore/dom/MutationObserver.cpp for current webkit source c++ implementation
 */
window.MutationObserver = (function(window) {
    "use strict";
    /*
    prefix bugs:
        -https://bugs.webkit.org/show_bug.cgi?id=85161
        -https://bugzilla.mozilla.org/show_bug.cgi?id=749920
    */
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if (!MutationObserver) {
        var indexOf = Array.prototype.indexOf;
        var map = Array.prototype.map;
        // var reduce = Array.prototype.reduce;

        /**
         * @param {Object} obj
         * @param {string} prop
         * @returns {boolean}
         */
        var has = function(obj, prop) {
            return typeof obj[prop] !== "undefined";
        };

        /**
         * Simple MutationRecord pseudoclass. No longer exposing as its not fully compliant
         * @param {Object}
         * @constructor
         */
        var MutationRecord = function(data) {
            var settings = {
                target: null,
                type: null,
                addedNodes: [],
                removedNodes: [],
                attributeName: null,
                attributeNamespace: null,
                oldValue: null
            };
            for (var prop in data) {
                if (has(settings, prop)) settings[prop] = data[prop];
            }
            return settings;
        };

        /* attributes + attributeFilter helpers */

        /**
         * clone live attribute list to an object structure {name: val}
         *
         * @param {Element} $e
         * @param {Object} filter
         * @returns {Object.<string, string>}
         */
        var cloneAttributes = function($e, filter) {
            var attrs = {};
            var attributes = $e.attributes;
            var attr;
            for (var i = 0, l = attributes.length; i < l; i++) { //using native reduce was ~30% slower
                attr = attributes[i];
                if (!filter || filter[attr.name]) {
                    attrs[attr.name] = attr.value;
                }
            }
            return attrs;
        };


        /**
         * fast helper to check to see if attributes object of an element has changed
         * doesnt handle the textnode case
         *
         * @param {Array.<MutationRecord>}
         * @param {Element} $ele
         * @param {Object.<string, string>} old
         * @param {Object} filter
         */
        var findAttributeMutations = function(mutations, $ele, old, filter) {
            var checked = {};
            var attributes = $ele.attributes;
            var attr;
            var name;
            for (var i = 0, l = attributes.length; i < l; i++) {
                attr = attributes[i];
                name = attr.name;
                if (!filter || filter[name]) {
                    if (attr.value !== old[name]) {
                        //The pushing is redundant but gzips very nicely
                        mutations.push(MutationRecord({
                            target: $ele,
                            type: "attributes",
                            attributeName: name,
                            oldValue: old[name],
                            attributeNamespace: attr.namespaceURI //in ie<8 it incorrectly will return undefined... is it worth handling it and making it null?
                        }));
                    }
                    checked[name] = true;
                }
            }
            for (name in old) {
                if (!(checked[name])) {
                    mutations.push(MutationRecord({
                        target: $ele,
                        type: "attributes",
                        attributeName: name,
                        oldValue: old[name]
                    }));
                }
            }
        };

        /*subtree and childlist helpers*/
        //discussion: http://codereview.stackexchange.com/questions/38351

        /**
         * clone an html node into a custom datastructure
         * see https://gist.github.com/megawac/8201012
         *
         * @param {Element} par
         * @param {MOConfig} config
         * @return {Elestruct}
         */
        var clone = function(par, config) {
            var copy = function(par, top) {
                return {
                    /** @type {Element} */
                    node: par,
                    /** @type {Array.<Elestruct>} */
                    kids: config.kids && (top || config.descendents) ? map.call(par.childNodes, function(node) {
                        return copy(node);
                    }) : null,
                    /** @type {Object.<string, string>} */
                    attr: config.attr && (top || config.descendents) && par.nodeType !== 3 ? cloneAttributes(par, config.afilter) : null
                };
            };
            return copy(par, true);
        };

        //using a non id (eg outerHTML or nodeValue) is extremely naive and will run into issues with nodes that may appear the same like <li></li>
        var counter = 1; //don't use 0 as id (falsy)
        //id property
        var expando = "mo_id";
        /**
         * Attempt to uniquely id an element for hashing. We could optimize this for legacy browsers but it hopefully wont be called enough to be a concern
         *
         * @param {Element} $ele
         * @returns {(number|string)}
         */
        var getId = function($ele) {
            try {
                return $ele.id || ($ele[expando] = $ele[expando] || counter++);
            } catch (o_O) { //ie <8 will throw if you set an unknown property on a text node
                try {
                    return $ele.nodeValue; //naive
                } catch (shitie) { //when text node is removed: https://gist.github.com/megawac/8355978 :(
                    return counter++;
                }
            }
        };

        /**
         * indexOf an element in a collection of custom nodes
         *
         * @param {Element} set
         * @param {Elestruct} $node
         * @param {number} from
         * @returns {number}
         */
        var indexOfCustomNode = function(set, $node, from) {
            for (var i = ~~from, l = set.length; i < l; i++) {
                if (set[i].node === $node) return i;
            }
            return -1;
        };

        /**
         * findChildMutations: array of mutations so far, element, element clone, bool => array of mutations
         * synchronous dfs comparision of two nodes
         *
         * @param {Array} mutations
         * @param {Element} target
         * @param {Elestruct} oldstate
         * @param {MOConfig} config
         */
        var findChildMutations = function(mutations, target, oldstate, config) {
            var add = function(node) {
                mutations.push(MutationRecord({
                    type: "childList",
                    target: node.parentNode, //support for ff<9
                    addedNodes: [node]
                }));
            };
            var rem = function(node, tar) { //have to pass tar because node.parentElement will be null when removed
                mutations.push(MutationRecord({
                    type: "childList",
                    target: tar,
                    removedNodes: [node]
                }));
            };

            /**
             * @param {Element} node
             * @param {Elestruct} old
             */
            var findMut = function(node, old) {
                var $kids = node.childNodes;
                var $oldkids = old.kids;
                var klen = $kids.length;
                var olen = $oldkids.length;

                if (!olen && !klen) return; //both empty; clearly no changes

                //id to i and j search hash to prevent double checking an element
                var map = {};
                var id;
                var idx; //index of a moved or inserted element

                //array of potention conflict hashes
                var conflicts = [];

                /*
                 * There is no gaurentee that the same node will be returned for both added and removed nodes
                 * if the positions have been shuffled.
                 */
                var resolveConflicts = function() {
                    var size = conflicts.length - 1;
                    var counter = -~(size / 2); //prevents same conflict being resolved twice consider when two nodes switch places. only one should be given a mutation event (note -~ is math.ceil shorthand)
                    conflicts.forEach(function(conflict) {
                        //attempt to determine if there was node rearrangement... won't gaurentee all matches
                        //also handles case where added/removed nodes cause nodes to be identified as conflicts
                        if (counter && Math.abs(conflict.i - conflict.j) >= size) {
                            add($kids[conflict.i]); //rearrangment ie removed then readded
                            rem($kids[conflict.i], old.node);
                            counter--; //found conflict
                        } else { //conflicts resolved - check subtree and attributes
                            if (config.descendents) findMut($kids[conflict.i], $oldkids[conflict.j]);
                            if (config.attr && $oldkids[conflict.j].attr) findAttributeMutations(mutations, $kids[conflict.i], $oldkids[conflict.j].attr, config.afilter);
                        }
                    });
                    conflicts = []; //clear conflicts
                };

                //current and old nodes
                var $cur;
                var $old;

                //iterate over both old and current child nodes at the same time
                for (var i = 0, j = 0; i < klen || j < olen;) {
                    //current and old nodes at the indexs
                    $cur = $kids[i];
                    $old = j < olen && $oldkids[j].node;

                    if ($cur === $old) { //simple expected case - needs to be as fast as possible
                        //recurse on next level of children
                        if (config.descendents) findMut($cur, $oldkids[j]);
                        if (config.attr && $oldkids[j].attr) findAttributeMutations(mutations, $cur, $oldkids[j].attr, config.afilter);

                        //resolve conflicts
                        if (conflicts.length) resolveConflicts();

                        i++;
                        j++;
                    } else { //(uncommon case) lookahead until they are the same again or the end of children
                        if ($cur) {
                            //check id is in the location map otherwise do a indexOf search
                            if (!has(map, (id = getId($cur)))) { //not already found
                                /* jshint loopfunc:true */
                                if ((idx = indexOfCustomNode($oldkids, $cur, j)) === -1) { //custom indexOf using comparitor
                                    add($cur); //$cur is a new node
                                } else {
                                    map[id] = true; //mark id as found
                                    conflicts.push({ //add conflict
                                        i: i,
                                        j: idx
                                    });
                                }
                            }
                            i++;
                        }

                        if ($old) {
                            if (!has(map, (id = getId($old)))) {
                                if ((idx = indexOf.call($kids, $old, i)) === -1) { //dont need to use a special indexof
                                    rem($old, old.node);
                                } else if (idx === 0) { //special case: if idx=0 i and j are congurent so we can continue without conflict
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
                if (conflicts.length) resolveConflicts();
            };
            findMut(target, oldstate);
        };

        /**
         * Creates a func to find all the mutations
         *
         * @param {Element} $target
         * @param {MOConfig} config
         */
        var createMutationSearcher = function($target, config) {
            /** type {Elestuct} */
            var $old = clone($target, config); //create the cloned datastructure

            /**
             * consumes array of mutations we can push to
             *
             * @param {Array.<MutationRecord>} mutations
             */
            return function(mutations) {
                var olen = mutations.length;

                //Alright we check base level changes in attributes... easy
                if (config.attr && $old.attr) {
                    findAttributeMutations(mutations, $target, $old.attr, config.afilter);
                }

                //check childlist + subtree?
                if (config.kids) {
                    findChildMutations(mutations, $target, $old, config);
                }


                //reclone data structure if theres changes
                if (mutations.length !== olen) {
                    /** type {Elestuct} */
                    $old = clone($target, config);
                }

                // Hallelujah done on to next observed item?
            };
        };

        /**
         * @param {function(Array.<MutationRecords>, MutationObserver)} listener
         * @constructor
         */
        MutationObserver = function(listener) {
            var self = this;
            /**
             * @type {Array.<function(Array.<MutationRecords>)>}
             * @private
             */
            self._watched = [];
            /** 
             * Recursive function to check all observed items for mutations
             * @type {function()}
             * @private
             */
            self._checker = function() {
                var mutations = self.takeRecords();

                if (mutations.length) { //fire away
                    listener.call(self, mutations, self); //call is not spec but consistent with other implementations
                }
                /** 
                 * @type {number?}
                 * @private
                 */
                self._timeout = window.setTimeout(self._checker, MutationObserver._period);
            };
        };

        /** 
         * Period to check for mutations (~32 times/sec)
         * @type {number}
         * @expose
         */
        MutationObserver._period = 30 /*+runtime*/ ;

        /**
         * see http://dom.spec.whatwg.org/#dom-mutationobserver-observe
         * not going to throw here but going to follow the current spec config sets
         * @param {element} $target
         * @param {Object} config
         * @expose
         */
        MutationObserver.prototype.observe = function($target, config) {
            var watched = this._watched;
            for (var i = 0; i < watched.length; i++) {
                if (watched[i].tar === $target) {
                    watched.splice(i, 1);
                    break;
                }
            }

            /** 
             * Using slightly different names so closure can go ham
             * @type {MOConfig}
             */
            var settings = {
                attr: !! (config.attributes || config.attributeFilter || config.attributeOldValue),

                //some browsers are strict in their implementation that config.subtree and childList must be set together. We don't care - spec doesn't specify
                kids: !! (config.childList || config.subtree),
                descendents: !! config.subtree
            };
            if (config.attributeFilter) {
                //converts to a {key: true} dict for faster lookup
                settings.afilter = config.attributeFilter.reduce(function(a, b) {
                    a[b] = true;
                    return a;
                }, {});
            }

            watched.push({
                tar: $target,
                fn: createMutationSearcher($target, settings)
            });

            //reconnect if not connected
            if (!this._timeout) {
                this._checker();
            }
        };

        /**
         * Finds mutations since last check and empties the "record queue" i.e. mutations will only be found once
         * @expose
         * @returns {Array.<MutationRecords>}
         */
        MutationObserver.prototype.takeRecords = function() {
            /** @type {Array.<MutationRecords>} */
            var mutations = [];
            var watched = this._watched;

            for (var i = 0, l = watched.length; i < l; i++) {
                watched[i].fn(mutations);
            }

            return mutations;
        };

        /**
         * @expose
         */
        MutationObserver.prototype.disconnect = function() {
            this._watched.length = 0; //clear the stuff being observed
            window.clearTimeout(this._timeout); //ready for garbage collection
            /**
             * @type {number?}
             * @private
             */
            this._timeout = null;
        };
    }
    return MutationObserver;
})(window);