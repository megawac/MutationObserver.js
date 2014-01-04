define(["utils"], function(utils) {
    return function() {//tests
        QUnit.asyncTest("childList", 8, function() {
            var deferred = utils.asyncAutocomplete(300);

            var $test = $("<div>", {
                "class": "test",
                "id": "ya",
                css: {
                    display: "inline"
                }
            });
            var teste = $test[0];

            var changes = {
                addedNodes: [],
                removedNodes: []
            };

            var n = 10;
            var called = 0;
            var $old,changed,added,i, $text;
            var observer = new MutationObserver(function(items, observer) {
                if(called === 0) {
                    ok(utils.expectedMutations(items, changes), "childList notices all added items");
                    ok(items.every(function(item) { return item.target === teste; }), "childList is called with correct target");
                    ok(items.every(function(item) { return item.type === "childList"; }), "childList is called with type='childList'");

                    $old = utils.$children($test);
                    added = [];
                    for (i = 0; i < n; i++) {
                        added.push("<span>" + i + "</span>");
                    }
                    added = utils.$makeArray(added);
                    $test.empty().append(added);
                    changes = {
                        addedNodes: utils.$children($test),
                        removedNodes: $old
                    };
                } else if(called === 1) {
                    ok(observer instanceof MutationObserver, "childList works twice");
                    ok(utils.expectedMutations(items, changes), "childList matches removed nodes");
                    $old = utils.$children($test);
                    $test.html("<div>hi</div><span>test</span><a href=\"test.com\"></a>");
                    changes = {
                        addedNodes: utils.$children($test),
                        removedNodes: $old
                    };
                } else if(called === 2) {
                    ok(utils.expectedMutations(items, changes), "works with setting html explicitly with elements");
                    $test.text("some test text");
                } else if(called === 3) {
                    changed = utils.countMutations(items);
                    ok(changed.removed === 3 && changed.added === 1, "works with setting text");
                    $test.html("<span>you work</span> yet?");
                } else if (called === 4) {
                    changed = utils.countMutations(items);
                    ok(changed.removed === 1 && changed.added === 2, "works with mixing setting html and text");
                    $text = $test.get(0).childNodes[1];
                    $text.nodeValue = "test";
                } else if(called === 5) {
                    ok(false, "Changing textNode value does not add a mutation");
                }
                called += 1;
            });

            observer.observe(teste, {
                childList: true
            });

            added = [];
            for (i = 0; i < n; i++) {
                added.push("<span>" + i + "</span>");
            }
            changes.addedNodes = added = utils.$makeArray(added);
            $test.append(added);
        });
    };
});