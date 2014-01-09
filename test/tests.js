define(["childList.js", "subtree.js", "attributes.js", "mutationobserver.js", "observe.js", "disconnect.js"],
    function(childList, subtree, attributes, core, observe, disconnect) {
        return function(module) {//tests
            if(QUnit.config.semaphore) QUnit.start();//semaphore is 0 if already started
            QUnit.module(module);
            childList();
            subtree();
            attributes();
            core();
            observe();
            disconnect();
        };
});