define([], function() {
    return function(Custom, Native) {
        var small = {
            $ele: $("<div class='test'></div>"),
            children: 10,
            descendents: 1
        };
        var mid = {
            $ele: $("<div class='test'></div>"),
            children: 20,
            descendents: 3
        };
        var large = {
            $ele: $("<div class='test'></div>"),
            children: 50,
            descendents: 5
        };

        function fill(opts) {
            var str = "";
            for (var i = 0, j; i < opts.children; i++) {
                for (j = 0; j < opts.descendents; j++) {
                    str += "<span>" + j + "</span>";
                }
                str+=i;
            }
            opts.$ele.html(str);
        };

        fill(small);
        fill(mid);
        fill(large);

        Custom.prototype.options.period = Infinity;//dont check

        [{
            childList: true
        },
        {
            childList: true,
            subtree: true
        },
        {
            attributes: true
        },
        {
            attributes: true,
            attributeFilter: ["id", "style"]
        }].forEach(function(context) {

            [small, mid, large].forEach(function(test) {
                var ele = test.$ele[0];

                var description = Object.keys(context).join("+") + " search on element with " + test.children + " children and " + test.descendents + " descendents";

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