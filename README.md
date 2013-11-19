MutationObserver [![Build Status](https://travis-ci.org/megawac/MutationObserver.js.png?branch=master)](https://travis-ci.org/megawac/MutationObserver.js)
========================

A shim for the [MutationObserver API](http://www.w3.org/TR/2013/WD-dom-20131107/#mutation-observers) ([can I use?](http://caniuse.com/mutationobserver)). The shim is async and uses interval fallbacks (default checks changes every 25ms) instead of the deprecated [DOM3 MutationEvents](http://www.w3.org/TR/DOM-Level-3-Events/#events-mutationevents).  

### Shim differences from standard interface

#### MutationObserver

* Implemented using `setInterval` (ever 25 ms) rather than using a `setImmediate` shim; so calls will be made less frequently and likely with more data than the standard MutationObserver. In addition, it can miss changes that occur and then are lost in the interval window.
* Setting an observed elements html using `innerHTML` will call `childList` changes with many items with only 1 addedNode or removed node. With the standard you would have 1 call with multiple nodes in addedNodes and removedNodes
* `.takeRecords()` is currently not supported

#### MutationRecord

* `addedNodes` and `removedNodes` are arrays instead of `NodeList`s
* `oldValue` is always called with attribute changes

### Supported MutationObserverInit properties

Currently supports the following [MutationObserverInit properties](https://developer.mozilla.org/en/docs/Web/API/MutationObserver#MutationObserverInit):

* **childList**: Set to truthy if mutations to target's children are to be observed.
* **attributes**: Set to truthy if mutations to target's children are to be observed.
* **attributeFilter**: Set to an array of attribute local names (without namespace) if not all attribute mutations need to be observed.
* **attributeOldValue**: doesn't do anything attributes are always called with old value


### Dependencies and Compatibility

The shim relies on the following methods to be supported or shimmed:

* `Array.prototype.indexOf`
* `Array.prototype.forEach`
* `Array.prototype.map`
* `Array.prototype.reduce`
* `Function.prototype.bind`


Try [running the test suite](https://rawgithub.com/megawac/MutationObserver.js/master/test/index.html) and see some simple example usage:

* http://jsbin.com/uxAQEWuL/3 listen to images being appended dynamically
* http://jsbin.com/uxAQEWuL/5 autoscroll an element as new content is added

See http://dev.opera.com/articles/view/mutation-observers-tutorial/ for sample usage.