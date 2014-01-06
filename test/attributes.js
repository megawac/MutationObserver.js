define(["utils"], function(utils) {
    return function() {//tests
        QUnit.asyncTest("attributes and attributeFilter", 7, function() {
            var deferred = utils.asyncAutocomplete();

            var $test = $("<div>", {
                "class": "test",
                "id": "ya",
                css: {
                    display: "inline"
                }
            });
            var teste = $test.get(0);

            var observer = new MutationObserver(function(items, observer) {
                equal(items.length, 3, "noticed attribute all changes");

                ok(items.every(function(item) { return item.target === teste; }), "Called with the correct target");
                ok( items.every(function(item) { return item.type === "attributes"; }), "Called with correct type");

                ok( items.some(function(item) {return item.attributeName === "id" && item.oldValue === "ya"; }), "Called with attribute names and old value");
            });
            observer.observe(teste, {
                attributes: true,
                attributeOldValue: true
            });

            var observer2 = new MutationObserver(function(items, observer) {
                equal(items.length, 2, "noticed correct number of attribute changes");

                ok( items.some(function(item) {return item.attributeName === "id"; }), "Attribute filter is called with attribute names and old value when appropriate");
                ok( !items.some(function(item) {return item.attributeName === "data-test";}), "Filtered attributes are do not produce a mutation");
            });
            observer2.observe(teste, {
                attributes: true,
                attributeFilter: ["id", "style"]
            });

            //spec but throws on chrome 28
            /*try {
                var observer3 = new MutationObserver(function(items, observer) {
                    equal(observer, observer3, "Watches attributes if attributeFilter defined and attributes omitted");
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

            deferred.done(function() {
                observer.disconnect();
                observer2.disconnect();
            });
        });
    };
});