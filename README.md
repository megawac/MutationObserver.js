MutationObserver [![Build Status](https://travis-ci.org/megawac/MutationObserver.js.png?branch=master)](https://travis-ci.org/megawac/MutationObserver.js)
========================

A shim for the [MutationObserver API](http://www.w3.org/TR/2013/WD-dom-20131107/#mutation-observers) ([can I use?](http://caniuse.com/mutationobserver)). The shim is async and uses interval fallbacks (default checks changes every 25ms) instead of the deprecated [DOM3 MutationEvents](http://www.w3.org/TR/DOM-Level-3-Events/#events-mutationevents).  
 
### Shim differences from standard interface

#### MutationObserver

* Implemented using `setInterval` (every 40 ms) rather than using a `setImmediate` shim; so calls will be made less frequently and likely with more data than the standard MutationObserver. In addition, it can miss changes that occur and then are lost in the interval window.
* Setting an observed elements html using `innerHTML` will call `childList` changes with many items with only 1 addedNode or removed node. With the standard you would have 1 call with multiple nodes in addedNodes and removedNodes
* With `childList` and `subtree` changes in node order (eg first element gets swapped with last) should fire a `addedNode` and `removedNode` mutation but the correct node may not always be identified.

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

The shim will check observed nodes usually 25 times per second (40 ms interval) for mutations (by default). Try running the [JSLitmus tests in the test suite](https://rawgithub.com/megawac/MutationObserver.js/master/test/index.html). From my tests of expected case (no mutations), ie9 can run the `childList` algorithm on an element with 50 children about 2800 times/sec enabled and ``subtree` on an element with 250 sub-children 550 times. Set `MutationObserver_period` if 25 times a second (*40 ms*) is too frequent or not frequent enough... TODO I should implement a heuristic to set the `_period`.

### Dependencies and Compatibility

The shim relies on the following methods to be supported or shimmed:

* `Array.prototype.indexOf`
* `Array.prototype.forEach`
* `Array.prototype.map`
* `Array.prototype.reduce`

I've tested and verified compatibility in the following browsers

* Internet Explorer 9, 10 in win7 and win8
* Firefox 24, 26 in win7 and win8
* Opera 12.16 in win7
* "Internet" on Android HTC One V

Try [running the test suite](https://rawgithub.com/megawac/MutationObserver.js/master/test/index.html) and see some simple example usage:

* http://jsbin.com/uxAQEWuL/3 listen to images being appended dynamically
* http://jsbin.com/uxAQEWuL/5 autoscroll an element as new content is added

See http://dev.opera.com/articles/view/mutation-observers-tutorial/ for sample usage.