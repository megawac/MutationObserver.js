define([], function() {
    return function() {//tests
        QUnit.asyncTest("disconnect", 2, function() {
            expect(2);

            var $test = $("<div>", {
                'class': "test",
                'id': "ya",
                css: {
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
                $test.attr("data-test", Math.random() * 9999);
                $("<span>").appendTo($test);
                called += 1;
            });

            observer.observe($test[0], {
                attributes: true,
                childList: true
            });

            $test.removeAttr("id");
            $test.attr("data-test", Math.random() * 9999);
            $test.css("display", "table");

            setTimeout(function() {
                ok(called === 1, "Got called " + called + " in 100 ms. Expected 1 calls.");
                QUnit.start();
            }, 100);
        });
    }
});