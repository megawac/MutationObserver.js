define(["utils"], function(utils) {
    function testDoc(doc, $target) {
        var observer = new MutationObserver($.noop);
        observer.observe(doc, {
            attributes: true,
            subtree: true,
            characterData: true
        });
        
        var target = $target[0];
        for (var i = 0; i < 10; i++) {
            target.appendChild(document.createComment("Comment " + i));
        }
        observer.takeRecords();

        $target.attr("foo", "boo");
        var records = observer.takeRecords();
        equal(records.length, 1);
        utils.expectRecord(records[0], {
            attributeName: "foo",
            type: "attributes",
            target: $target[0]
        }, "Can observe attributes on doc subtree");

        // Character Data
        var $tar = $target.append("<span class='target'>bx</span>").find(".target")[0];
        observer.takeRecords();
        $tar.firstChild.nodeValue = "ax";
        records = observer.takeRecords();
        equal(records.length, 1);
        utils.expectRecord(records[0], {
            type: "characterData",
            target: $tar.firstChild
        });

        for (i = 2; i < 6; i++) {
            target.childNodes[i].nodeValue = "tnt";
        }
        equal(observer.takeRecords().length, 4);

        observer.disconnect();
    }

    return function() {//tests        
        if (typeof document.implementation === "object" && typeof document.implementation.createHTMLDocument === "function") {
            QUnit.test("#13: observing a documents", 5, function() {
                var doc = document.implementation.createHTMLDocument("attr-doc");
                testDoc(doc, $("body", doc));
            });
        }

        QUnit.test("#19: observing a documents fragments", 5, function() {
            var doc = document.createDocumentFragment();
            var target = $("<div id='target'>")[0];
            doc.appendChild(target);
            testDoc(doc, $(target));
        });
    };
});