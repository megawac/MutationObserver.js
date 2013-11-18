define(["childList.js", "attributes.js", "mutationobserver.js", "observe.js", "disconnect.js"], function(childList, attributes, core, observe, disconnect) {
	
	return function(module) {//tests
		QUnit.module(module);
		childList();
		attributes();
        core();
        observe();
		disconnect();
	};

});