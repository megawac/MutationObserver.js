define([], function() {
    return function() {//tests
        QUnit.asyncTest("attributes", 3, function() {
            expect(3);

            var $test = new Element("div", {
                'class': "test",
                'id': "ya",
                styles: {
                    display: 'inline'
                } 
            });
            var called = 0;
            var observer = new MutationObserver(function(items, observer) {
                console.log(arguments);
                equal(items.length, 3, 'noticed attribute all changes');
                ok(observer instanceof MutationObserver, 'attributes called with MutationObserver as second arg');
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
    }
});