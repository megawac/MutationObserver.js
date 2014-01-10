MutationObserver [![Build Status](https://travis-ci.org/megawac/MutationObserver.js.png?branch=master)](https://travis-ci.org/megawac/MutationObserver.js)
========================

[![Browser Test Status](https://saucelabs.com/browser-matrix/mutationobserver.svg)](https://saucelabs.com/u/mutationobserver)

A polyfill for the [MutationObserver API](http://www.w3.org/TR/2013/WD-dom-20131107/#mutation-observers) ([can I use?](http://caniuse.com/mutationobserver)). The polyfill is async and uses a recursive timeout fallback (default checks changes every 30ms + runtime) instead of using the deprecated [DOM3 MutationEvents](http://www.w3.org/TR/DOM-Level-3-Events/#events-mutationevents).  
 
### polyfill differences from standard interface

#### MutationObserver

* Implemented using a recursive `setTimeout` (every ~30 ms) rather than using a `setImmediate` polyfill; so calls will be made less frequently and likely with more data than the standard MutationObserver. In addition, it can miss changes that occur and then are lost in the interval window.
* Setting an observed elements html using `innerHTML` will call `childList` observer listeners with several mutations with only 1 addedNode or removed node per mutation. With the standard you would have 1 call with multiple nodes in addedNodes and removedNodes node lists.
* With `childList` and `subtree` changes in node order (eg first element gets swapped with last) should fire a `addedNode` and `removedNode` mutation but the correct node may not always be identified.
* Currently does not support watching attributes on `childList`/`subtree`. Will add support next version
* Character data yet not supported

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

By default, the polyfill will check observed nodes about 25 times per second (~30 ms interval) for mutations. Try running the [JSLitmus tests in the test suite](https://rawgithub.com/megawac/MutationObserver.js/master/test/index.html). From my tests of expected case (no mutations), ie9 can run the `childList` algorithm on an element with 50 children about 2800 times/sec enabled and ``subtree` on an element with 250 sub-children 550 times. Set `MutationObserver_period` to change the interval.

### Dependencies and Compatibility

The polyfill relies on the following methods to be supported or shimmed:

* `Array.prototype.indexOf`
* `Array.prototype.forEach`
* `Array.prototype.map`
* `Array.prototype.reduce`

I've tested and verified compatibility in the following browsers

* Internet Explorer 9, 10 in win7 and win8
* Firefox 21, 24, 26 in OSX, win7 and win8
* Opera 12.16 in win7
* Safari 6.0.5 on OSX
* "Internet" on Android HTC One V

Try [running the test suite](https://rawgithub.com/megawac/MutationObserver.js/master/test/index.html) and see some simple example usage:

* http://jsbin.com/uxAQEWuL/3 listen to images being appended dynamically
* http://jsbin.com/uxAQEWuL/5 autoscroll an element as new content is added

See http://dev.opera.com/articles/view/mutation-observers-tutorial/ for sample usage.