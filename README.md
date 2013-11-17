MutationObserver [![Build Status](https://travis-ci.org/megawac/MutationObserver.js.png?branch=master)](https://travis-ci.org/megawac/MutationObserver.js)
========================

A compliant shim for the MutationObserver API ([can I use?](http://caniuse.com/mutationobserver))  

Currently supports the following [MutationObserverInit properties](https://developer.mozilla.org/en/docs/Web/API/MutationObserver#MutationObserverInit):

* childList: Set to truthy if mutations to target's children are to be observed.
* attributes: Set to truthy if mutations to target's children are to be observed.
* attributeFilter: Set to an array of attribute local names (without namespace) if not all attribute mutations need to be observed.
* attributeOldValue: doesn't do anything attributes are always called with old value

See http://dev.opera.com/articles/view/mutation-observers-tutorial/ for sample usage.