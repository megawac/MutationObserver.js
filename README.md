MutationObserver [![Build Status](https://travis-ci.org/megawac/MutationObserver.js.png?branch=master)](https://travis-ci.org/megawac/MutationObserver.js)
========================

A shim for the [MutationObserver API](http://www.w3.org/TR/2013/WD-dom-20131107/#mutation-observers) ([can I use?](http://caniuse.com/mutationobserver)). The shim is async and uses interval fallbacks (default checks changes every 25ms) instead of the deprecated [DOM3 MutationEvents](http://www.w3.org/TR/DOM-Level-3-Events/#events-mutationevents).  
 
### Shim differences from standard interface

#### MutationObserver

* Implemented using `setInterval` (ever 25 ms) rather than using a `setImmediate` shim; so calls will be made less frequently and likely with more data than the standard MutationObserver. In addition, it can miss changes that occur and then are lost in the interval window.
* Setting an observed elements html using `innerHTML` will call `childList` changes with many items with only 1 addedNode or removed node. With the standard you would have 1 call with multiple nodes in addedNodes and removedNodes
* With `childList` and `subtree` changes in node order should be identified with a `addedNode` and `removedNode` mutation but the correct node may not always be identified.
* `.takeRecords()` is currently not supported

#### MutationRecord

* `addedNodes` and `removedNodes` are arrays instead of `NodeList`s
* `oldValue` is always called with attribute changes

### Supported MutationObserverInit properties

Currently supports the following [MutationObserverInit properties](https://developer.mozilla.org/en/docs/Web/API/MutationObserver#MutationObserverInit):

* **childList**: Set to truthy if mutations to target's immediate children are to be observed.
* **subtree**: Set to truthy to do deep scans on a target's children (as per spec, must be set with childList).
* **attributes**: Set to truthy if mutations to target's children are to be observed.
* **attributeFilter**: Set to an array of attribute local names (without namespace) if not all attribute mutations need to be observed.
* **attributeOldValue**: doesn't do anything attributes are always called with old value

### Performance

The shim will check observed nodes usually 40 times per second for mutations (by default). See http://jsbin.com/uhoVibU/6 for `childList` and `subtree` performance and functionality tests. From my tests, assuming there are usually no mutations (shouldnt make much difference) will decrease page performance by *~1.5%* with childList (50 children) enabled and *~6.6%* with subtree (250 children) in ie9 (calculation is based on (`(ops/per sec) / (options.period in secs)`). Set `MutationObserver.prototype.options.period` if 40 times a second (*25 ms*) is too frequent. 

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