define(["utils"], function(utils) {
    return function() {//tests
        QUnit.asyncTest("disconnect", 2, function() {
            var deferred = utils.asyncAutocomplete(500);

            var $test = $("<div>", {
                "class": "test",
                "id": "ya",
                css: {
                    display: "inline"
                }
            });

            var teststr = "Called before disconnect";

            var observer = new MutationObserver(function(items, observer) {
                ok(observer instanceof MutationObserver, teststr);
                observer.disconnect();

                $test.attr("data-test", Math.random() * 9999);
                $("<span><i>xxx</i></span>").appendTo($test);
            });

            setTimeout(function() {
                observer.observe($test.get(0), {
                    attributes: true
                });
                $test.attr("data-test2", Math.random() * 9999);
                teststr = "A disconnected observer can be reconnected after a subsequent .observe";
            }, 300);

            observer.observe($test.get(0), {
                attributes: true,
                childList: true,
                subtree: true
            });

            $test.removeAttr("id")
                .attr("data-test", Math.random() * 9999)
                .css("display", "table");
        });
    };
});