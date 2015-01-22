define(["utils"], function(utils) {
    return function() {//tests        
        if (typeof document.implementation === "object" || typeof document.implementation.createHTMLDocument === "function") {
            QUnit.test("#13: observing a document", 4, function() {

                var doc = document.implementation.createHTMLDocument("attr-doc");
                var observer = new MutationObserver($.noop);
                observer.observe(doc, {
                    attributes: true,
                    subtree: true,
                    characterData: true
                });
                var $crossDocEl = $("body", doc);
                
                // Attributes
                observer.takeRecords();
                $crossDocEl.attr("foo", "boo");
                var records = observer.takeRecords();
                equal(records.length, 1);
                utils.expectRecord(records[0], {
                    attributeName: "foo",
                    type: "attributes",
                    target: $crossDocEl[0]
                }, "Can observe attributes on doc subtree");

                // Character Data
                var $tar = $crossDocEl.append("<span class='target'>bx</span>").find(".target")[0];
                observer.takeRecords();
                $tar.firstChild.nodeValue = "ax";
                records = observer.takeRecords();
                equal(records.length, 1);
                utils.expectRecord(records[0], {
                    type: "characterData",
                    target: $tar.firstChild
                });

                observer.disconnect();
            });
        }
    };
});