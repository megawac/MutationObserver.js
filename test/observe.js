define(["utils"], function(utils) {
    return function() {//tests
        QUnit.asyncTest("observe", 4, function() {
            var deferred = utils.asyncAutocomplete();

            var $test = $("<div>", {
                "class": "test",
                "id": "ya",
                css: {
                    display: "inline"
                }
            });
            var teste1 = $test[0];
            var $test2 = $("<span>", {
                "class": "test2"
            });
            var teste2 = $test2[0];

            var called = 0;
            var expected_calls = {
                0: {
                    test1: 4,
                    test2: 1
                },
                1: {
                    test2: 2
                }
            };
            var observer = new MutationObserver(function(items) {
                var calls = items.reduce(function(obj, item) {
                    var n = item.type === "childList" ? item.addedNodes.length + item.removedNodes.length : 1;
                    if(item.target === teste1) {
                        if(obj.test1) obj.test1 += n;
                        else obj.test1 = n;
                    } else if(item.target === teste2) {
                        if(obj.test2) obj.test2 += n;
                        else obj.test2 = n;

                        if(item.type === "attributes") {
                            throw "Observing an element twice with different configs uses only the most recent config";
                        }
                    } else {
                        throw "Unexpected element given";
                    }
                    return obj;
                }, {});

                deepEqual(calls, expected_calls[called], "Multiple observed elements called with correct args on try: " + called);

                if(called === 0) {
                    ok(items.some(function(item) {
                        return item.type === "childList";
                    }) && items.some(function(item) {
                        return item.type === "attributes";
                    }), "Can watch multiple mutationobserverinit properties");
                    
                    //test3
                    $test2.html("<strong>notta</strong>");
                }

                called += 1;
            });

            observer.observe(teste1, {
                attributes: true,
                childList: true
            });

            observer.observe(teste2, {
                attributes: true,
                childList: true
            });

            observer.observe(teste2, {
                childList: true
            });


            teste1.removeAttribute("id");
            teste1.setAttribute("data-test", Math.random() * 9999);
            teste1.setAttribute("data-test2", Math.random() * 9999);
            $("<span>", {value: "hi"}).appendTo(teste1);

            $("<a>", {href: "github.com"}).appendTo(teste2);
            $test2.addClass("no mutation plz");


            var $test3 = $("<div>text<span class=\"stuff\"><i>stuff</i></span><p><span class=\"stuff\">more stuff</span></p><div class=\"footer\"></div></div>");
            var teste3 = $test3.get(0);


            var observer2 = new MutationObserver(function(items) {
                utils.expectMutations(items, {added: 2, attributes: 1, characterData: 1, childList: 1, removed: 2}, "Can observe multiple mutations on every config type");
            });

            observer2.observe(teste3, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true,
                attributeOldValue: true,
                characterDataOldValue: true
            });

            teste3.childNodes[0].nodeValue += "more text";
            $test3.addClass("register this");
            $test3.find(".stuff").addClass("more stuff").find("i").remove();
            $test3.find("p").text("Clear children");//rem 1 nodes and 1 add
            $test3.find(".footer").append("<p>content by megawac<span class=\"dragger\"></span><span class=\"icon\"></span></p>");


            deferred.done(function() {
                observer.disconnect();
                observer2.disconnect();
            });
        });
    };
});