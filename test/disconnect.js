define([], function() {
    return function() {//tests
        QUnit.asyncTest("disconnect", 2, function() {
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
                if(called === 0) {
                    ok(observer instanceof MutationObserver, 'called once');
                    observer.disconnect();
                } else {
                    ok(false, "called after disconnect!")
                }
                $test.set("data-test", Number.random(1, 9999));
                new Element("span").inject($test);
                called += 1;
            });

            observer.observe($test, {
                attributes: true,
                childList: true
            });

            $test.erase("id");
            $test.set("data-test", Number.random(1, 9999));
            $test.setStyle("display", "table");

            setTimeout(function() {
                ok(called === 1, "Got called " + called + " in 100 ms. Expected 1 calls.");
                QUnit.start();
            }, 100);
        });
    }
});