define([], function() {
    return function() {//tests
        QUnit.asyncTest("Core", function() {
            expect(4);

            var $test = $("<div>", {
                'class': "test",
                'id': "ya",
                css: {
                    display: 'inline'
                }
            });
            var teste = $test[0];

            /*var tobserver;
            try { //implementation dependent (fails on chrome passes on ff)
            	tobserver = MutationObserver(function() {

            	});
            } catch(o_O) {
            }
            ok(tobserver instanceof MutationObserver, "Can be instantiated without new keyword :o");
			*/
            var itemargs = [];
            var observer1 = new MutationObserver(function(items, observer) {
                ok(items.length === 4, "observer1 was called correctly");
                ok(observer instanceof MutationObserver, "Change event called with observer as second argument");
                itemargs = items;
            });

            var observer2 = new MutationObserver(function(items, observer) {
                ok(items.length === 4, "observer2 was called correctly on the same watched element");
                deepEqual(items, itemargs, "Both observers called with the same changes");
            }); 

            observer1.observe(teste, {
                attributes: true,
                childList: true
            });

            observer2.observe(teste, {
                attributes: true,
                childList: true
            });


            teste.removeAttribute("id");
            teste.setAttribute("data-test", Math.random() * 9999);
            teste.style.display = "table";

            $("<a>", {href: "github.com", value: "github"}).appendTo(teste);

            setTimeout(function() {
                QUnit.start();
            }, 100);
        });
    }
});