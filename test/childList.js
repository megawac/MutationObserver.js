define(["utils"], function(utils) {
    return function() {//tests
        QUnit.asyncTest("childList", 17, function() {
            var deferred = utils.asyncAutocomplete();

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
            var $old,changed,added,i, $text, $tar, items,

            childNodes = teste.childNodes;

            var observer = new MutationObserver(function(items, observer) {
                if(console && console.error) console.error(items);
                throw "Should not be called: may be hanging textNode value (via .nodeValue = xxx) should not add a mutation";
            });
            observer.observe(teste, {
                childList: true
            });


            //test 1
            added = [];
            for (i = 0; i < n; i++) {
                added.push("<span>" + i + "</span>");
            }
            changes.addedNodes = added = utils.$makeArray(added);
            $test.append(added);

            items = observer.takeRecords();

            ok(utils.expectedMutations(items, changes), "childList notices all added items");
            ok(items.every(function(item) { return item.target === teste; }), "childList is called with correct target");
            ok(items.every(function(item) { return item.type === "childList"; }), "childList is called with type='childList'");


            //test 2
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

            items = observer.takeRecords();
            ok(utils.expectedMutations(items, changes), "childList matches removed nodes");

            //test 3
            $tar = $(childNodes[childNodes.length - 1]).prependTo($test).get(0);
            //change positions around and cause fuck all
            changes =  {
                addedNodes: [$tar],
                removedNodes: [$tar]
            };
            
            items = observer.takeRecords();
            ok(utils.expectedMutations(items, changes), "Notices simplest element order rearrangment");


            //test 4
            //more complicated node re arrangment - should just notice the correct number of these changes
            $(childNodes[0]).appendTo($test); //front to back

            items = observer.takeRecords();
            utils.expectMutations(items, {added: 1, removed: 1}, "Notices appending first element to back of observed element");


            //test 5
            $(childNodes[4]).insertAfter(childNodes[2]);
            $(childNodes[7]).insertAfter(childNodes[8]);

            items = observer.takeRecords();
            utils.expectMutations(items, {added: 2, removed: 2}, "Reasonably handles confusing internal node rearrangment");


            //test 6
            $tar = $(childNodes[4]).insertAfter(childNodes[1]).get(0);
            changes = {
                addedNodes: [$tar],
                removedNodes: [$tar, $(childNodes[3]).remove().get(0)]
            };

            items = observer.takeRecords();
            ok(utils.expectedMutations(items, changes), "Works when removing an element close to a simple node rearrangment");


            //test 7
            $old = utils.$children($test);
            $test.html("<div>hi</div><span>test</span><a href=\"test.com\"></a>");
            changes = {
                addedNodes: utils.$children($test),
                removedNodes: $old
            };

            items = observer.takeRecords();
            ok(utils.expectedMutations(items, changes), "works with setting html explicitly with elements");
            

            //test 8
            $test.text("some test text");
            items = observer.takeRecords();
            changed = utils.countMutations(items);
            ok(changed.removed === 3 && changed.added === 1, "works with setting text");
            

            //test 9
            $test.html("<span>you work</span> yet?");
            items = observer.takeRecords();
            changed = utils.countMutations(items);
            ok(changed.removed === 1 && changed.added === 2, "works with mixing setting html and text");
            $text = $test.get(0).childNodes[1];
            $text.nodeValue = "test";

            //test 10 from polymer/mutationobservers
            var div = document.createElement("div");
            observer.observe(div, {
              childList: true
            }, "Correct length");
            var a = document.createElement("a");
            var b = document.createElement("b");
            div.appendChild(a);
            div.appendChild(b);

            var records = observer.takeRecords();
            equal(records.length, 2);

            utils.expectRecord(records[0], {
              type: "childList",
              target: div,
              addedNodes: [a]
            }, "Expect next sibling");

            utils.expectRecord(records[1], {
              type: "childList",
              target: div,
              addedNodes: [b],
              previousSibling: a
            }, "Expect previous sibling");
            observer.disconnect();


            //tricky insertbefore case
            div = document.createElement("div");
            a = document.createElement("a");
            b = document.createElement("b");
            var c = document.createElement("i");
            div.appendChild(a);

            observer.observe(div, {
                childList: true
            });

            div.insertBefore(b, a);
            div.insertBefore(c, a);

            records = observer.takeRecords();
            equal(records.length, 2);

            utils.expectRecord(records[0], {
                type: "childList",
                target: div,
                addedNodes: [b]
                // nextSibling: a - impossible for script to tell it will be c when the scripts ready to check
            }, "Expect a next sibling");

            utils.expectRecord(records[1], {
                type: "childList",
                target: div,
                addedNodes: [c],
                nextSibling: a,
                previousSibling: b
            }, "Expect a previous and next sib");


            deferred.done(function() {
                observer.disconnect();
            });
        });
    };
});