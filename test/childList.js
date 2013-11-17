define([], function() {
    return function() {//tests
        QUnit.asyncTest("childList", function() {
            expect(4);

            var $test = new Element("div", {
                'class': "test",
                'id': "ya",
                styles: {
                    display: 'inline'
                } 
            });
            var n = 10;
            var called = 0;
            var observer = new MutationObserver(function(items, observer) {
                console.log(arguments);
                if(called === 0) {
                    equal(items.length, n, 'childList notices added items');
                    $test.empty();
                    n.times(function(i) {
                        new Element("span", {
                            value: i
                        }).inject($test);
                    });
                } else if(called === 1) {
                    ok(observer instanceof MutationObserver, 'childList works twice');
                    equal(items.length, n*2, 'childList matches removed nodes');
                }
                called += 1;
            });

            observer.observe($test, {
                childList: true
            });

            n.times(function(i) {
                new Element("span", {
                    value: i
                }).inject($test);
            });

            setTimeout(function() {
                ok(called === 2, "Got called " + called + " in 100 ms. Expected 2 calls.");
                QUnit.start();
            }, 100);
        });
    }
});