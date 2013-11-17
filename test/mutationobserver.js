define(["childList.js", "attributes.js", "disconnect.js"], function(childList, attributes, disconnect) {
	
	return function(module) {//tests
		QUnit.module(module);
		childList();
		attributes();
		disconnect();
	};

});