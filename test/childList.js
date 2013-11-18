define([], function() {
    return function() {//tests
        var countChanged = function(items) {
            var changed = {
                added: 0,
                removed: 0
            }
            items.each(function(record) {
                changed.added   += record.addedNodes.length;
                changed.removed += record.removedNodes.length;
            });
            return changed;
        }

        QUnit.asyncTest("childList", function() {
            expect(5);

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
                var changed = countChanged(items);

                if(called === 0) {
                    equal(changed.added, n, 'childList notices added items');
                    $test.empty();
                    n.times(function(i) {
                        new Element("span", {
                            value: i
                        }).inject($test);
                    });
                } else if(called === 1) {
                    ok(observer instanceof MutationObserver, 'childList works twice');
                    ok(changed.added === n && changed.removed === n, 'childList matches removed nodes');
                    $test.innerHTML = "<div>hi</div><span>test</span><a href='test.com'></a>"
                } else if(called === 2) {
                    ok(changed.added === 3 && changed.removed === n, 'works with setting html');
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
                ok(called === 3, "Got called " + called + " in 100 ms. Expected 3 calls.");
                QUnit.start();
            }, 100);
        });
    }
});