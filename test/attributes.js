define([], function() {
    return function() {//tests
        QUnit.asyncTest("attributes", function() {
            expect(2);

            var $test = new Element("div", {
                'class': "test",
                'id': "ya",
                styles: {
                    display: 'inline'
                } 
            });
            var called = 0;
            var observer = new MutationObserver(function(items, observer) {
                equal(items.length, 3, 'noticed attribute all changes');
                called += 1;
            });

            observer.observe($test, {
                attributes: true
            });

            $test.erase("id");
            $test.set("data-test", 5231);
            $test.setStyle("display", "table");

            setTimeout(function() {
                ok(called === 1, "Got called " + called + " in 100 ms. Expected 1 calls.");
                QUnit.start();
            }, 100);
        });

        QUnit.asyncTest("attributeFilter", function() {
            expect(2);

            var $test = new Element("div", {
                'class': "test",
                'id': "ya",
                styles: {
                    display: 'inline'
                } 
            });
            var called = 0;
            var observer = new MutationObserver(function(items, observer) {
                equal(items.length, 2, 'noticed correct number of attribute changes');
                called += 1;
            });

            observer.observe($test, {
                attributes: true,
                attributeFilter: ["id", "style"]
            });

            $test.erase("id");
            $test.set("data-test", 5231);
            $test.setStyle("display", "table");

            setTimeout(function() {
                ok(called === 1, "Got called " + called + " in 100 ms. Expected 1 calls.");
                QUnit.start();
            }, 100);
        });
    }
});