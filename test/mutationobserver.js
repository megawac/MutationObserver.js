define([], function() {
    return function() {//tests
        QUnit.asyncTest("Core", function() {
            expect(4);

            var $test = new Element("div", {
                'class': "test",
                'id': "ya",
                styles: {
                    display: 'inline'
                }
            });

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

            observer1.observe($test, {
                attributes: true,
                childList: true
            });

            observer2.observe($test, {
                attributes: true,
                childList: true
            });


            $test.erase("id");
            $test.set("data-test", Number.random(1, 9999));
            $test.setStyle("display", "table");

            $test.adopt(new Element("a", {href: "github.com"}));

            setTimeout(function() {
                QUnit.start();
            }, 100);
        });
    }
});