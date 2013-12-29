define(["childList.js", "subtree.js", "attributes.js", "mutationobserver.js", "observe.js", "disconnect.js"],
    function(childList, subtree, attributes, core, observe, disconnect) {
        return function(module) {//tests
            QUnit.module(module);
            childList();
            subtree();
            attributes();
            core();
            observe();
            disconnect();
        };
});