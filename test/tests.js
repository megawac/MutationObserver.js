define(["childList.js", "subtree.js", "attributes.js", "characterData.js", "document.js", "mutationobserver.js", "observe.js", "disconnect.js"],
    function(childList, subtree, attributes, characterData, observeDocument, core, observe, disconnect) {
        return function(module) {//tests
            if(QUnit.config.semaphore) QUnit.start();//semaphore is 0 if already started
            QUnit.module(module);
            core();
            observe();
            observeDocument();
            disconnect();
            childList();
            attributes();
            characterData();
            subtree();
        };
});