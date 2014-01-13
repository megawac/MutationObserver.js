define(["childList.js", "subtree.js", "attributes.js", "characterData.js", "mutationobserver.js", "observe.js", "disconnect.js"],
    function(childList, subtree, attributes, characterData, core, observe, disconnect) {
        return function(module) {//tests
            if(QUnit.config.semaphore) QUnit.start();//semaphore is 0 if already started
            QUnit.module(module);
            childList();
            subtree();
            attributes();
            characterData();
            core();
            observe();
            disconnect();
        };
});