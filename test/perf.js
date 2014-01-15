define([], function() {
    return function(Custom, Native) {
        var small = {
            $ele: $("<div class='test'></div>"),
            children: 10,
            descendents: 1,
            attributes: 3
        };
        var mid = {
            $ele: $("<div class='test'></div>"),
            children: 20,
            descendents: 3,
            attributes: 3
        };
        var large = {
            $ele: $("<div class='test'></div>"),
            children: 50,
            descendents: 5,
            attributes: 3
        };

        var attributes = [];
        for (var i = 0; i < 20; i++) {
            attributes.push("attr-" + Math.random().toFixed(5) + "='a" + i + "'");
        }

        function fill(opts) {
            var str = "";
            var rand;
            for (var i = 0, j; i < opts.children; i++) {
                for (j = 0; j < opts.descendents; j++) {
                    rand = Math.floor(Math.random() * (17 - 0) + 0);
                    str += "<span " + attributes.slice(rand, rand+3) + ">" + j + "</span>";
                }
                str+=i;
            }
            opts.$ele.html(str);
        }

        fill(small);
        fill(mid);
        fill(large);

        Custom._period = Infinity;//dont check

        [{
            childList: true
        },
        {
            childList: true,
            subtree: true
        },
        {
            attributes: true,
            simple: true
        },
        {
            attributes: true,
            attributeFilter: ["id", "style"],
            simple: true
        },
        {
            attributes: true,
            subtree: true
        }, {
            characterData: true,
            childList: true
        }, {
            characterData: true,
            childList: true,
            subtree: true
        }].forEach(function(context) {
            var items = context.simple ? [large] : [small, mid, large];
            delete context.simple;
            (items).forEach(function(test) {
                var ele = test.$ele[0];

                var description = Object.keys(context).join("+") + " search on element with " + test.children + " children and " + test.descendents + " descendents and " + test.attributes + " attributes per node";

                var observer = new Custom(function(items, observer) {});
                observer.observe(test.$ele.get(0), context);
                JSLitmus.test("Shimmed MutationObserver: " + description, function() {
                    observer.takeRecords();
                });

                /*if(Native) {
                    var observer2 = new Native(function(items, observer) {});
                    observer2.observe(test.$ele.get(0), context);
                    JSLitmus.test("Native MutationObserver: " + description, function() {
                        observer2.takeRecords();
                    });
                }*/
            });
        });
    }
});