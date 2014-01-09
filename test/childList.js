define(["utils"], function(utils) {
    return function() {//tests
        QUnit.asyncTest("childList", 12, function() {
            var deferred = utils.asyncAutocomplete(500);

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
            var $old,changed,added,i, $text, $tar,

            childNodes = teste.childNodes;

            var observer = new MutationObserver(function(items, observer) {
                switch(called) {
                    case 0:
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
                        break;
                    case 1:
                        ok(observer instanceof MutationObserver, "childList works twice");
                        ok(utils.expectedMutations(items, changes), "childList matches removed nodes");

                        $tar = $(childNodes[childNodes.length - 1]).prependTo($test).get(0);
                        //change positions around and cause fuck all
                        changes =  {
                            addedNodes: [$tar],
                            removedNodes: [$tar]
                        };
                        break;
                    case 2:
                        ok(utils.expectedMutations(items, changes), "Notices simplest element order rearrangment");

                        //more complicated node re arrangment - should just notice the correct number of these changes
                        $(childNodes[0]).appendTo($test); //front to back

                        items = observer.takeRecords();
                        deepEqual(utils.countMutations(items), {added: 1, removed: 1}, "Notices appending first element to back of observed element");

                        $(childNodes[4]).insertAfter(childNodes[2]);
                        $(childNodes[7]).insertAfter(childNodes[8]);

                        items = observer.takeRecords();
                        deepEqual(utils.countMutations(items), {added: 2, removed: 2}, "Reasonably handles confusing internal node rearrangment");

                        $tar = $(childNodes[4]).insertAfter(childNodes[1]).get(0);
                        changes = {
                            addedNodes: [$tar],
                            removedNodes: [$tar, $(childNodes[3]).remove().get(0)]
                        };

                        items = observer.takeRecords();
                        ok(utils.expectedMutations(items, changes), "Works when removing an element close to a simple node rearrangment");

                        $old = utils.$children($test);
                        $test.html("<div>hi</div><span>test</span><a href=\"test.com\"></a>");
                        changes = {
                            addedNodes: utils.$children($test),
                            removedNodes: $old
                        };
                        break;
                    case 3:
                        ok(utils.expectedMutations(items, changes), "works with setting html explicitly with elements");
                        $test.text("some test text");
                        break;
                    case 4:
                        changed = utils.countMutations(items);
                        ok(changed.removed === 3 && changed.added === 1, "works with setting text");
                        $test.html("<span>you work</span> yet?");
                        break;
                    case 5:
                        changed = utils.countMutations(items);
                        ok(changed.removed === 1 && changed.added === 2, "works with mixing setting html and text");
                        $text = $test.get(0).childNodes[1];
                        $text.nodeValue = "test";
                        break;
                    case 6://shouldnt be called
                        throw "Changing textNode value (via .nodeValue = xxx) should not add a mutation";
                    default:
                        throw "Unexpected call! Already called " + called;
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

            deferred.done(function() {
                observer.disconnect();
            });
        });
    };
});