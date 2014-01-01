define(["utils"], function(utils) {
    return function() {//tests
        QUnit.asyncTest("attributes and attributeFilter", 2, function() {
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
            });
            observer.observe(teste, {
                attributes: true
            });

            var observer2 = new MutationObserver(function(items, observer) {
                equal(items.length, 2, "noticed correct number of attribute changes");
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
        });
    };
});