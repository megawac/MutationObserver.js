define(["utils"], function(utils) {
    return function() {//tests
        QUnit.asyncTest("disconnect", 1, function() {
            var deferred = utils.asyncAutocomplete();

            var $test = $("<div>", {
                "class": "test",
                "id": "ya",
                css: {
                    display: "inline"
                }
            });

            var observer = new MutationObserver(function(items, observer) {
                ok(observer instanceof MutationObserver, "called once");
                observer.disconnect();

                $test.attr("data-test", Math.random() * 9999);
                $("<span><i>xxx</i></span>").appendTo($test);
            });

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