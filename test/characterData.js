define(["utils"], function(utils) {
    return function() {//tests
        QUnit.asyncTest("characterData", 3, function() {
            var deferred = utils.asyncAutocomplete(500);

            var $test = $("<div>", {
                "class": "test",
                "id": "ya",
                css: {
                    display: "inline"
                }
            }).append("a text <span>a descendent textnode <p class='text'>text node to be removed</p></span>");

            var textNodes = [];

            function findText(node) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    if(node.childNodes[i].nodeType === 3) textNodes.push(node.childNodes[i]);
                    else findText(node.childNodes[i]);
                }
            }
            findText($test.get(0));

            var observer = new MutationObserver(function(items, observer) {
                ok(items.every(function(item) {
                    return item.type === "characterData";
                }), "Called with type 'characterData'");
                ok(items.every(function(item) {
                    return textNodes.indexOf(item.target) >= 0;
                }), "Called with the correct targets");
            });

            observer.observe($test.get(0), {
                characterData: true,
                subtree: true
            });

            var observer2 = new MutationObserver(function(items, observer) {
                deepEqual(utils.reduceTypes(items), {characterData: 2, childList: 1}, "Can observe child list and character data and will not create a mutation for a removed text node.");
                textNodes[2].nodeValue = "asdf";//dont be dumb twice
            });

            observer2.observe($test.get(0), {
                characterData: true,
                childList: true,
                subtree: true
            });


            $test.find(".text").remove();
            for (var i = 0; i < textNodes.length -1; i++) {//native implementations fail for some reason when you remove a textnode and then change its text
                textNodes[i].nodeValue = "something else" + i;
            }
            


            deferred.done(function() {
                observer.disconnect();
                observer2.disconnect();
            });
        });
    };
});