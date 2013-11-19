define([], function() {
    return function() {//tests
        QUnit.asyncTest("observe", function() {
            expect(3);

            var $test = $("<div>", {
                'class': "test",
                'id': "ya",
                css: {
                    display: 'inline'
                }
            });
            var teste1 = $test[0];
            var $test2 = $("<span>", {
                'class': "test2"
            });
            var teste2 = $test2[0];

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
                    var n = item.type === "childList" ? item.addedNodes.length + item.removedNodes.length : 1;
                    if(item.target === teste1) {
                        if(obj.test1) obj.test1 += n;
                        else obj.test1 = n;
                    } else if(item.target === teste2) {
                        if(obj.test2) obj.test2 += n;
                        else obj.test2 = n;
                    }
                    return obj;
                }, {});

                deepEqual(calls, expected_calls[called], "Multiple observed elements called with correct args on try: " + called);

                if(called === 0) $test2.html("<strong>notta</strong>");

                called += 1;
            });

            observer.observe(teste1, {
                attributes: true,
                childList: true
            });

            observer.observe(teste2, {
                childList: true
            });

            teste1.removeAttribute("id");
            teste1.setAttribute("data-test", Math.random() * 9999);
            teste1.style.display = "table";

            $("<a>", {href: "github.com"}).appendTo(teste2);

            setTimeout(function() {
                ok(called === 2, "Got called " + called + " in 100 ms. Expected 2 calls.");
                QUnit.start();
            }, 100);
        });
    }
});