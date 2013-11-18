define([], function() {
    return function() {//tests
        QUnit.asyncTest("observe", function() {
            expect(3);

            var $test = new Element("div", {
                'class': "test",
                'id': "ya",
                styles: {
                    display: 'inline'
                }
            });
            var $test2 = new Element(new Element("span", {
                'class':"test2"
            }));
            var called = 0;
            var expected_calls = {
                0: {
                    test1: 3,
                    test2: 1
                },
                1: {
                    test2: 2
                }
            };
            var observer = new MutationObserver(function(items, observer) {
                var calls = items.reduce(function(obj, item) {
                    if(item.target === $test) {
                        if(obj.test1) obj.test1 += 1;
                        else obj.test1 = 1;
                    } else if(item.target === $test2) {
                    	var n = item.addedNodes.length + item.removedNodes.length;
                        if(obj.test2) obj.test2 += n;
                        else obj.test2 = n;
                    }
                    return obj;
                }, {});

                deepEqual(calls, expected_calls[called], "Multiple observed elements called with correct args on try: " + called);

                if(called === 0) $test2.set("html", "<strong>notta</strong>");

                called += 1;
            });

            observer.observe($test, {
                attributes: true,
                childList: true
            });

            observer.observe($test2, {
                childList: true
            });

            $test.erase("id");
            $test.set("data-test", Number.random(1, 9999));
            $test.setStyle("display", "table");

            $test2.adopt(new Element("a", {href: "github.com"}));

            setTimeout(function() {
                ok(called === 2, "Got called " + called + " in 100 ms. Expected 2 calls.");
                QUnit.start();
            }, 100);
        });
    }
});