define([], function() {
    var $ = window.jQuery;
    var arrayProto = Array.prototype;
    var slice = arrayProto.slice;

    //mutation helper helpers
    var similar = function(set1, set2) {
        return utils.every(set1, function(node) {
            return utils.containsNode(set2, node);
        }) && utils.every(set2, function(node) {
            return utils.containsNode(set1, node);
        });
    };

    var counter = 0;
    var getId = function($ele) {
        var id = $ele.nodeType === 3 ? $ele.nodeValue ://text node id is the text content
                                        $ele.id || $ele.getAttribute("mut-id") || ++counter;
        return id;
    }

    var getChildren = function(ele) {
        var arr = [];
        var kids = ele.childNodes;
        for (var i = 0, len = kids.length; i < len; i++) {
            arr[i] = kids[i];
        }
        return arr;
    }

    var utils = {
        each: function(col, fn) {
            return arrayProto.forEach.call(col, fn);
        },
        any: function(col, fn) {
            return arrayProto.any.call(col, fn);
        },
        every: function(col, fn) {
            return arrayProto.every.call(col, fn);
        },
        reduce: function(col, fn, memo) {
            return arrayProto.reduce.call(col, fn, memo);
        },

        getRandom: function(col) {
            return col[Math.floor(col.length * Math.random())];
        },

        $randomChild: function(ele, textNodes) {
            var prop = textNodes ? "childNodes" : "children";
            if(ele instanceof $) ele = utils.getRandom(ele);
            return $(utils.getRandom(ele[prop]));
        },

        $children: function(ele) {
            if(ele instanceof $) {
                return ele.map(function() {return getChildren(this);}).get();
            }
            return getChildren(ele);
        },

        $makeArray: function($a) {
            return $a.map(function(node) {return $(node).get(0);});
        },

        sameNode: function(node1, node2) {//from ./MutationObserver.js
            return node1 && node2 && (node1 === node2 || getId(node1) === getId(node2));
        },

        //mutation helpers
        containsNode: function(col, node) {
            for (var i = 0; i < col.length; i++) {
                if(utils.sameNode(node, col[i])/* || node.isEqualNode(col[i])*/) return true;
            }
            return false;
        },

        reduceNodes: function(mutations, property) {
            return utils.reduce(mutations, function(memo, cur) {
                return memo.concat(slice.call(cur[property]));
            }, []);
        },

        reduceTypes: function(mutations) {
            return mutations.reduce(function(memo, mut) {
                if(memo[mut.type]) memo[mut.type] += 1;
                else memo[mut.type] = 1;
                return memo;
            }, {});
        },

        expectedMutations: function(mutations, expected) {
            var changes = {
                addedNodes: utils.reduceNodes(mutations,"addedNodes"),
                removedNodes: utils.reduceNodes(mutations, "removedNodes")
            };
            return similar(changes.addedNodes, expected.addedNodes) && similar(changes.removedNodes, expected.removedNodes);
        },

        countMutations: function(items) {
            var changed = {
                added: 0,
                removed: 0
            };
            items.forEach(function(record) {
                changed.added   += record.addedNodes.length;
                changed.removed += record.removedNodes.length;
            });
            return changed;
        },

        asyncAutocomplete: function(delay) {
            var deferred = $.Deferred();
            deferred.done(function() {
                QUnit.start();
            });
            setTimeout(function() {
                deferred.resolve();
            }, delay || 250);
            return deferred;
        }


    };

    return utils;
});