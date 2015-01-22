define(["utils"], function(utils) {
    return function() {//tests
        QUnit.asyncTest("attributes and attributeFilter", 14, function() {
            var deferred = utils.asyncAutocomplete(500);

            var $test = $("<div>", {
                "class": "test",
                "id": "ya",
                css: {
                    display: "inline"
                }
            }).append("<span></span><p>stuff</p>");

            var teste = $test.get(0);

            var observer = new MutationObserver(function(items) {
                equal(items.length, 3, "noticed attribute all changes");

                ok(items.every(function(item) { return item.target === teste; }), "Called with the correct target");
                ok( items.every(function(item) { return item.type === "attributes"; }), "Called with correct type");

                ok( items.some(function(item) {return item.attributeName === "id" && item.oldValue === "ya"; }), "Called with attribute names and old value");
                ok( items.every(function(item) { return item.attributeNamespace !== void 0; }), "Called with attribute namespace"); //ie8 has a bug where it will be set to undefined.
            });
            observer.observe(teste, {
                attributes: true,
                attributeOldValue: true
            });

            var observer2 = new MutationObserver(function(items) {
                equal(items.length, 2, "noticed correct number of attribute changes");

                ok( items.some(function(item) {return item.attributeName === "id"; }), "Attribute filter is called with attribute names and old value when appropriate");
                ok( !items.some(function(item) {return item.attributeName === "data-test";}), "Filtered attributes are do not produce a mutation");

                //fails on ie7 because ie7 has messed up attributes for style
                ok( items.some(function(item) {return item.attributeName === "style";} ), "Registers style: fails on ie7 because ie7 has messed up attributes for style");
            

                ok( !items.some(function(item) {return item.target !== teste;}), "Should not observe attributes on subtree unless subtree is specified, i.e. setting childList does not make subtree be observed");
            });
            observer2.observe(teste, {
                attributes: true,
                attributeFilter: ["id", "style"],
                childList: true
            });

            //spec but throws on chrome 28
            /*try {
                var observer3 = new MutationObserver(function(items) {
                    equal(observer3, "Watches attributes if attributeFilter defined and attributes omitted");
                });
                observer3.observe(teste, {
                    attributeFilter: ["id", "style"]
                });
            } catch(o_o) {

            }*/

            //setting with jquery can cause multiple steps
            teste.removeAttribute("id");
            teste.setAttribute("data-test", 5231);
            teste.style.display = "table";
            $test.find("p").addClass("dont call");

            // observing attribuets on subtree tests
            var $test2 = $("<div><span class='name'>3</span><span class='name'>2</span><span class='name'>1</span></div>");
            var teste2 = $test2.get(0);
            var $tar = utils.$randomChild($test2);
            var observer3 = new MutationObserver(function(items) {
                equal(items.length, 1, "Can observe attributes of subtree");
                equal(items[0].target, $tar.get(0), "Called with the correct target on the subtree");
                equal(items[0].attributeName, "class", "Called with the correct attribute name in the subtree");
            });
            observer3.observe(teste2, {
                attributes: true,
                subtree: true
            });
            $tar.get(0).className += "attribute subtree test";

            teste2 = $("<input type='checkbox' checked />").get(0);
            var observer4 = new MutationObserver($.noop);
            observer4.observe(teste2, {
                attributes: true,
                attributeOldValue: true
            });
            teste2.checked = false;
            var records = observer4.takeRecords();
            deepEqual(records, [], "Should not match element properties (checked)");

            deferred.done(function() {
                observer.disconnect();
                observer2.disconnect();
                observer3.disconnect();
                observer4.disconnect();
            });
        });
    };
});