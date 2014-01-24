/*!
 * Shim for MutationObserver interface
 * Author: Graeme Yeates (github.com/megawac)
 * Repository: https://github.com/megawac/MutationObserver.js
 * License: WTFPL V2, 2004 (wtfpl.net).
 * Though credit and staring the repo will make me feel pretty, you can modify and redistribute as you please.
 * See https://github.com/WebKit/webkit/blob/master/Source/WebCore/dom/MutationObserver.cpp for current webkit source c++ implementation
 */
window.MutationObserver = (function(window, undefined) {
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
        var reduce = Array.prototype.reduce;

        /**
         * @param {Object} obj
         * @param {(string|number)} prop
         * @return {boolean}
         */
        var has = function(obj, prop) {
            return obj[prop] !== undefined; //will be nicely inlined by gcc
        };

        /**
         * Simple MutationRecord pseudoclass. No longer exposing as its not fully compliant
         * @param {Object} data
         * @return {MutationRecord}
         */
        var MutationRecord = function(data) {
            /** @typedef {MutationRecord} */
            var settings = {//technically these should be on proto so hasOwnProperty will return false for non explicitly props
                type: null,
                target: null,
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


        /**
         * Utility
         * Cones a element into a custom data structure designed for comparision. https://gist.github.com/megawac/8201012
         * 
         * @param {Node} $target
         * @param {!Object} config : A custom mutation config
         * @return {!Object} : Cloned data structure
         */
        var clone = function($target, config) {
            var copy = function($target, top) {
                var isText = $target.nodeType === 3;
                var elestruct = {
                    /** @type {Node} */
                    node: $target
                };

                if(config.attr && !isText && (top || config.descendents)) {
                    /**
                     * clone live attribute list to an object structure {name: val}
                     * @type {Object.<string, string>}
                     */
                    elestruct.attr = reduce.call($target.attributes, function(memo, attr) {
                        if (!config.afilter || config.afilter[attr.name]) {
                            memo[attr.name] = attr.value;
                        }
                        return memo;
                    }, {});
                }

                if(config.charData && isText) {
                    elestruct.charData = $target.nodeValue;
                }

                if( ((config.kids || config.charData) && (top || config.descendents)) || (config.attr && config.descendents) ) {
                    /** @type {Array.<!Object>} : Array of custom clone */
                    elestruct.kids = map.call($target.childNodes, function(node) {
                        return copy(node, false);
                    });
                }
                return elestruct;
            };
            return copy($target, true);
        };

        /* attributes + attributeFilter helpers */

        /**
         * fast helper to check to see if attributes object of an element has changed
         * doesnt handle the textnode case
         *
         * @param {Array.<MutationRecord>} mutations
         * @param {Node} $target
         * @param {Object.<string, string>} $oldstate : Custom attribute clone data structure from clone
         * @param {Object} filter
         */
        var findAttributeMutations = function(mutations, $target, $oldstate, filter) {
            var checked = {};
            var attributes = $target.attributes;
            var attr;
            var name;
            var i = attributes.length;
            while (i--) {
                attr = attributes[i];
                name = attr.name;
                if (!filter || has(filter, name)) {
                    if (attr.value !== $oldstate[name]) {
                        //The pushing is redundant but gzips very nicely
                        mutations.push(MutationRecord({
                            type: "attributes",
                            target: $target,
                            attributeName: name,
                            oldValue: $oldstate[name],
                            attributeNamespace: attr.namespaceURI //in ie<8 it incorrectly will return undefined... is it worth handling it and making it null?
                        }));
                    }
                    checked[name] = true;
                }
            }
            for (name in $oldstate) {
                if (!(checked[name])) {
                    mutations.push(MutationRecord({
                        target: $target,
                        type: "attributes",
                        attributeName: name,
                        oldValue: $oldstate[name]
                    }));
                }
            }
        };

        /*subtree and childlist helpers*/

        //using a non id (eg outerHTML or nodeValue) is extremely naive and will run into issues with nodes that may appear the same like <li></li>
        var counter = 1; //don't use 0 as id (falsy)
        //id property
        var expando = "mo_id";
        /**
         * Attempt to uniquely id an element for hashing. We could optimize this for legacy browsers but it hopefully wont be called enough to be a concern
         *
         * @param {Node} $ele
         * @return {(string|number)}
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
         * @param {Node} set
         * @param {!Object} $node : A custom cloned node
         * @param {number} idx : index to start the loop
         * @return {number}
         */
        var indexOfCustomNode = function(set, $node, idx) {
            for (/*idx = ~~idx*/; idx < set.length; idx++) {//start idx is always given for this function
                if (set[idx].node === $node) return idx;
            }
            return -1;
        };

        /**
         * searchSubtree: array of mutations so far, element, element clone, bool
         * synchronous dfs comparision of two nodes
         * This function is applied to any observed element with childList or subtree specified
         * Sorry this is kind of confusing as shit, tried to comment it a bit...
         * codereview.stackexchange.com/questions/38351 discussion of an earlier version of this func
         *
         * @param {Array} mutations
         * @param {Node} $target
         * @param {!Object} $oldstate : A custom cloned node from clone()
         * @param {!Object} config : A custom mutation config
         */
        var searchSubtree = function(mutations, $target, $oldstate, config) {
            /*
             * Helper to identify node rearrangment and stuff... 
             * There is no gaurentee that the same node will be identified for both added and removed nodes
             * if the positions have been shuffled.
             */
            var resolveConflicts = function(conflicts, node, $kids, $oldkids) {
                var size = conflicts.length - 1;
                var counter = -~(size / 2); //prevents same conflict being resolved twice consider when two nodes switch places. only one should be given a mutation event (note -~ is math.ceil shorthand)
                var $cur;
                var oldstruct;
                var conflict;
                while((conflict = conflicts.pop())) {
                    $cur = $kids[conflict.i];
                    oldstruct = $oldkids[conflict.j];

                    //attempt to determine if there was node rearrangement... won't gaurentee all matches
                    //also handles case where added/removed nodes cause nodes to be identified as conflicts
                    if (config.kids && counter && Math.abs(conflict.i - conflict.j) >= size) {
                        mutations.push(MutationRecord({
                            type: "childList",
                            target: node,
                            addedNodes: [$cur],
                            removedNodes: [$cur]
                        }));
                        counter--; //found conflict
                    }

                    //Alright we found the resorted nodes now check for other types of mutations
                    if (config.attr && oldstruct.attr) findAttributeMutations(mutations, $cur, oldstruct.attr, config.afilter);
                    if (config.charData && $cur.nodeType === 3 && $cur.nodeValue !== oldstruct.charData) {
                        mutations.push(MutationRecord({
                            type: "characterData",
                            target: $cur,
                            oldValue: oldstruct.charData
                        }));
                    }
                    //now look @ subtree
                    if (config.descendents) findMut($cur, oldstruct);
                }
            };

            /**
             * Main worker. Finds and adds mutations if there are any
             * @param {Node} node
             * @param {!Object} old : A cloned data structure using internal clone
             */
            var findMut = function(node, old) {
                var $kids = node.childNodes;
                var $oldkids = old.kids;
                var klen = $kids.length;
                var olen = $oldkids.length;
                // if (!olen && !klen) return; //both empty; clearly no changes

                //we delay the intialization of these for marginal performance in the expected case (actually quite signficant on large subtrees when these would be otherwise unused)
                //map of checked element of ids to prevent registering the same conflict twice
                var map;
                //array of potential conflicts (ie nodes that may have been re arranged)
                var conflicts;
                var id; //element id from getId helper
                var idx; //index of a moved or inserted element

                var oldstruct;
                //current and old nodes
                var $cur;
                var $old;
                
                //iterate over both old and current child nodes at the same time
                var i = 0, j = 0;
                //while there is still anything left in $kids or $oldkids (same as i < $kids.length || j < $oldkids.length;)
                while( i < klen || j < olen ) {
                    //current and old nodes at the indexs
                    $cur = $kids[i];
                    oldstruct = $oldkids[j];
                    $old = oldstruct && oldstruct.node;

                    if ($cur === $old) { //expected case - optimized for this case
                        //check attributes as specified by config
                        if (config.attr && oldstruct.attr) /* oldstruct.attr instead of textnode check */findAttributeMutations(mutations, $cur, oldstruct.attr, config.afilter);
                        //check character data if set
                        if (config.charData && $cur.nodeType === 3 && $cur.nodeValue !== oldstruct.charData) {
                            mutations.push(MutationRecord({
                                type: "characterData",
                                target: $cur,
                                oldValue: oldstruct.charData
                            }));
                        }

                        //resolve conflicts
                        if (conflicts) resolveConflicts(conflicts, node, $kids, $oldkids);

                        //recurse on next level of children. Avoids the recursive call when $cur.firstChild is null and kids.length is 0
                        if (config.descendents && ($cur.firstChild || oldstruct.kids.length)) findMut($cur, oldstruct);

                        i++;
                        j++;
                    } else { //(uncommon case) lookahead until they are the same again or the end of children
                        if(!map) {//delayed initalization
                            map = {};
                            conflicts = [];
                        }
                        if ($cur) {
                            //check id is in the location map otherwise do a indexOf search
                            if (!has(map, (id = getId($cur)))) { //to prevent double checking
                                //custom indexOf using comparitor checking oldkids[i].node === $cur
                                if ((idx = indexOfCustomNode($oldkids, $cur, j)) === -1) {
                                    if(config.kids) {
                                        mutations.push(MutationRecord({
                                            type: "childList",
                                            target: node,
                                            addedNodes: [$cur]//$cur is a new node
                                        }));
                                    }
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
                                    if(config.kids) {
                                        mutations.push(MutationRecord({
                                            type: "childList",
                                            target: old.node,
                                            removedNodes: [$old]
                                        }));
                                    }
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
                    }//end uncommon case
                }//end loop

                //resolve any remaining conflicts
                if (conflicts) resolveConflicts(conflicts, node, $kids, $oldkids);
            };
            findMut($target, $oldstate);
        };

        /**
         * Creates a func to find all the mutations
         *
         * @param {Node} $target
         * @param {!Object} config : A custom mutation config
         */
        var createMutationSearcher = function($target, config) {
            /** type {Elestuct} */
            var $oldstate = clone($target, config); //create the cloned datastructure

            /**
             * consumes array of mutations we can push to
             *
             * @param {Array.<MutationRecord>} mutations
             */
            return function(mutations) {
                var olen = mutations.length;

                //Alright we check base level changes in attributes... easy
                if (config.attr && $oldstate.attr) {
                    findAttributeMutations(mutations, $target, $oldstate.attr, config.afilter);
                }

                //check childlist or subtree for mutations
                if (config.kids || config.descendents) {
                    searchSubtree(mutations, $target, $oldstate, config);
                }


                //reclone data structure if theres changes
                if (mutations.length !== olen) {
                    /** type {Elestuct} */
                    $oldstate = clone($target, config);
                }
            };
        };

        /**
         * @param {function(Array.<MutationRecord>, MutationObserver)} listener
         * @constructor
         */
        MutationObserver = function(listener) {
            var self = this;
            /**
             * @type {Array.<function(Array.<MutationRecord>)>}
             * @private
             */
            self._watched = [];
            /** 
             * Recursive timeout function to check all observed items for mutations
             * @private
             */
            self._checker = function() {
                var mutations = self.takeRecords();

                if (mutations.length) { //fire away
                    listener.call(self, mutations, self); //call is not spec but consistent with other implementations
                }
                /** @private */
                self._timeout = setTimeout(self._checker, MutationObserver._period);
            };
        };

        /** 
         * Period to check for mutations (~32 times/sec)
         * @type {number}
         * @expose
         */
        MutationObserver._period = 30 /*ms+runtime*/ ;

        /**
         * see http://dom.spec.whatwg.org/#dom-mutationobserver-observe
         * not going to throw here but going to follow the current spec config sets
         * @param {Node} $target
         * @param {Object} config : MutationObserverInit configuration dictionary
         * @expose
         * @return undefined
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
             * @type {!Object} : A custom mutation config
             */
            var settings = {
                attr: !! (config.attributes || config.attributeFilter || config.attributeOldValue),

                //some browsers are strict in their implementation that config.subtree and childList must be set together. We don't care - spec doesn't specify
                kids: !! config.childList,
                descendents: !! config.subtree,
                charData: !! (config.characterData || config.characterDataOldValue)
            };
            if (config.attributeFilter) {
                /**
                 * converts to a {key: true} dict for faster lookup
                 * @type {Object.<String,Boolean>}
                 */
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
         * @return {Array.<MutationRecord>}
         */
        MutationObserver.prototype.takeRecords = function() {
            var mutations = [];
            var watched = this._watched;

            for (var i = 0; i < watched.length; i++) {
                watched[i].fn(mutations);
            }

            return mutations;
        };

        /**
         * @expose
         * @return undefined
         */
        MutationObserver.prototype.disconnect = function() {
            this._watched.length = 0; //clear the stuff being observed
            clearTimeout(this._timeout); //ready for garbage collection
            /** @private */
            this._timeout = null;
        };
    }
    return MutationObserver;
})(window);