define([], function() {
    return function() {//tests
        QUnit.asyncTest("attributes", function() {
            expect(2);

            var $test = $("<div>", {
                'class': "test",
                'id': "ya",
                css: {
                    display: 'inline'
                }
            });
            var teste = $test[0];
            var called = 0;
            var observer = new MutationObserver(function(items, observer) {
                equal(items.length, 3, 'noticed attribute all changes');
                called += 1;
            });

            observer.observe(teste, {
                attributes: true
            });

            //setting with jquery can cause multiple steps
            teste.removeAttribute("id");
            teste.setAttribute("data-test", 5231);
            teste.style.display = "table";

            setTimeout(function() {
                ok(called === 1, "Got called " + called + " in 100 ms. Expected 1 calls.");
                QUnit.start();
            }, 100);
        });

        QUnit.asyncTest("attributeFilter", function() {
            expect(2);

            var $test = $("<div>", {
                'class': "test",
                'id': "ya",
                css: {
                    display: 'inline'
                }
            });
            var teste = $test[0];

            var called = 0;
            var observer = new MutationObserver(function(items, observer) {
                equal(items.length, 2, 'noticed correct number of attribute changes');
                called += 1;
            });

            observer.observe(teste, {
                attributes: true,
                attributeFilter: ["id", "style"]
            });

            teste.removeAttribute("id");
            teste.setAttribute("data-test", 5231);
            teste.style.display = "table";

            setTimeout(function() {
                ok(called === 1, "Got called " + called + " in 100 ms. Expected 1 calls.");
                QUnit.start();
            }, 100);
        });
    }
});