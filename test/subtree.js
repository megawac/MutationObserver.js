define(["utils"], function(utils) {
    return function() {//tests        

        QUnit.asyncTest("subtree", 13, function() {
            var deferred = utils.asyncAutocomplete(300);

            var $test = $("<div><span></span></div>");
            var $teste = $test.find("span");

            var changes = {
                addedNodes: [],
                removedNodes: []
            };

            var n = 10;
            var $tar;
            var items;


            var observer = new MutationObserver(function(items, observer) {
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
            $teste.append(added).addClass("dont create mutation");

            items = observer.takeRecords();
            ok(items.every(function(item) {return item.type === "childList"; }), "Can observe only childList on the subtree");
            ok(utils.expectedMutations(items, changes), "childList + subtree notices all nested added items");
            ok(items.every(function(item) { return item.target === $teste[0]; }), "subtree is called with correct target");
            ok(items.every(function(item) { return item.type === "childList"; }), "subtree is called with type='childList'");

            added = [];
            for (var i = 0; i < n; i++) {
                added.push("<span>" + i + "</span>");
            }
            changes.addedNodes = added = utils.$makeArray(added);
            $teste.append(added);

            items = observer.takeRecords();
            ok(utils.expectedMutations(items, changes), "subtree matches added nodes");
            
            $tar = utils.$randomChild($teste);
            changes = {
                removedNodes: utils.$children($tar),
                addedNodes: $("<p><strong>stuff</strong>3</p>").appendTo($tar.empty()).get()
            };

            items = observer.takeRecords();
            ok(utils.expectedMutations(items, changes), "matches appended children");

            $tar = utils.$randomChild($teste);
            changes = {
                removedNodes: utils.$children($tar),
                addedNodes: utils.$children($tar.text("test"))
            };

            items = observer.takeRecords();
            ok(utils.expectedMutations(items, changes), "Works with setting the text of a nested element");
            equal(items.filter(function(item){return item.removedNodes.length > 0;})[0].target, $tar.get(0), "Removed subtree elements are called with expected target");

            // observing attribuets on subtree tests
            var $test2 = $("<div><span class='name'>3</span><span class='name'>2</span><span class='name'>1</span></div>");
            var teste2 = $test2.get(0);
            var $tar2 = utils.$randomChild($test2);
            var observer2 = new MutationObserver(function(items, observer) {
                ok(items.every(function(item) {return item.type === "attributes"; }), "Can observe only attributes on the subtree");

                equal(items.length, 1, "Can observe attributes of subtree");
                equal(items[0].target, $tar2.get(0), "Called with the correct target on the subtree");
                equal(items[0].attributeName, "class", "Called with the correct attribute name in the subtree");
            });
            observer2.observe(teste2, {
                attributes: true,
                subtree: true
            });
            $tar2.get(0).className += "attribute subtree test";
            $tar2.append("<span class='a'>text</span>");

            // ie8 and 9 will throw for comment nodes if you're not careful #8
            var observer3 = new MutationObserver(function(/*items, observer*/) {});
            var $test3 = $("<div><span class='name'>3</span><span class='name'>2</span><span class='name'>1</span></div>");
            $test3.prepend(document.createComment("don't break on comments"));
            observer3.observe($test3.get(0), {
                "attributes" : true,
                "attributeFilter" : [ "height", "style" ],
                "childList" : true,
                "subtree" : true
            });
            ok(observer3.takeRecords(), [], "doesnt break on comments");


            deferred.done(function() {
                observer.disconnect();
                observer2.disconnect();
                observer3.disconnect();
            });
        });
    };
});