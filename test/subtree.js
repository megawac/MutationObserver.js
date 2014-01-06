define(["utils"], function(utils) {
    return function() {//tests        

        QUnit.asyncTest("subtree", 8, function() {
            var deferred = utils.asyncAutocomplete(300);

            var $test = $("<div><span></span></div>");
            var $teste = $test.find("span");

            var changes = {
                addedNodes: [],
                removedNodes: []
            };

            var n = 10;
            var called = 0;
            var $tar;
            var observer = new MutationObserver(function(items, observer) {
                if(called === 0) {
                    ok(utils.expectedMutations(items, changes), "childList + subtree notices all nested added items");
                    ok(items.every(function(item) { return item.target === $teste[0]; }), "subtree is called with correct target");
                    ok(items.every(function(item) { return item.type === "childList"; }), "subtree is called with type='childList'");

                    var added = [];
                    for (var i = 0; i < n; i++) {
                        added.push("<span>" + i + "</span>");
                    }
                    changes.addedNodes = added = utils.$makeArray(added);
                    $teste.append(added);
                } else if(called === 1) {
                    ok(observer instanceof MutationObserver, "subtree works twice");
                    ok(utils.expectedMutations(items, changes), "subtree matches added nodes");
                    $tar = utils.$randomChild($teste);
                    changes = {
                        removedNodes: utils.$children($tar),
                        addedNodes: $("<p><strong>stuff</strong>3</p>").appendTo($tar.empty()).get()
                    };
                } else if(called === 2) {
                    ok(utils.expectedMutations(items, changes), "matches appended children");
                    $tar = utils.$randomChild($teste);
                    changes = {
                        removedNodes: utils.$children($tar),
                        addedNodes: utils.$children($tar.text("test"))
                    };
                } else if(called === 3) {
                    ok(utils.expectedMutations(items, changes), "Works with setting the text of a nested element");
                    equal(items.filter(function(item){return item.removedNodes.length > 0;})[0].target, $tar.get(0), "Removed subtree elements are called with expected target");
                }
                called += 1;
            });

            observer.observe($test.get(0), {
                childList: true,
                subtree: true
            });

            var added = [];
            for (var i = 0; i < n; i++) {
                added.push("<span>" + i + "</span>");
            }
            changes.addedNodes = added = utils.$makeArray(added);
            $teste.append(added);

            deferred.done(function() {
                observer.disconnect();
            });
        });
    };
});