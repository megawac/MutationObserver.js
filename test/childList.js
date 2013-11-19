define([], function() {
    return function() {//tests
        var countChanged = function(items) {
            var changed = {
                added: 0,
                removed: 0
            }
            items.forEach(function(record) {
                changed.added   += record.addedNodes.length;
                changed.removed += record.removedNodes.length;
            });
            return changed;
        }

        QUnit.asyncTest("childList", function() {
            expect(7);

            var $test = $("<div>", {
                'class': "test",
                'id': "ya",
                css: {
                    display: 'inline'
                } 
            });
            var teste = $test[0];

            var n = 10;
            var called = 0;
            var observer = new MutationObserver(function(items, observer) {
                var changed = countChanged(items);

                if(called === 0) {
                    equal(changed.added, n, 'childList notices added items');
                    $test.empty();
                    for (var i = 0; i < n; i++) {
                        $("<span>", {
                            value: i
                        }).appendTo(teste);
                    };
                } else if(called === 1) {
                    ok(observer instanceof MutationObserver, 'childList works twice');
                    ok(changed.added === n && changed.removed === n, 'childList matches removed nodes');
                    $test.html("<div>hi</div><span>test</span><a href='test.com'></a>");
                } else if(called === 2) {
                    ok(changed.added === 3 && changed.removed === n, 'works with setting html explicitly with elements');
                    $test.text("some test text");
                } else if(called === 3) {
                    ok(changed.removed === 3 && changed.added === 1, "works with setting text");
                    $test.html("<span>you work</span> yet?");
                } else if (called === 4) {
                    ok(changed.removed === 1 && changed.added === 2, "works with mixing setting html and text");
                }
                called += 1;
            });

            observer.observe(teste, {
                childList: true
            });

            for (var i = 0; i < n; i++) {
                $("<span>", {
                    value: i
                }).appendTo(teste);
            };

            setTimeout(function() {
                ok(called === 5, "Got called " + called + " in 150 ms. Expected 5 calls.");
                QUnit.start();
            }, 150);
        });
    }
});