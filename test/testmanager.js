QUnit.config.testTimeout = 1000;
QUnit.config.autostart = false;//was having trouble with autostart

QUnit.testSkip = function() {//http://stackoverflow.com/questions/13748129/skipping-a-test-in-qunit
   QUnit.test(arguments[0] + ' (SKIPPED)', 0, function() {
       var li = document.getElementById(QUnit.config.current.id);
       QUnit.done(function() {
           li.style.background = '#FFFF99';
       });
   });
};

//Simple test manager to delete window.MutationObserver after the original test runs
$(function() {
    curl(["tests.js", "perf.js"], function(MutationObserverTests, perf) {

        var test2 = function(context) {
            if(context && context.name !== "MutationObserver") return;

            var native = window.WebkitMutationObserver || window.MutationObserver;

            window.WebkitMutationObserver = window.MutationObserver = null;//so poly goes in

            yepnope.injectJs("../MutationObserver.js", function() {

                var custom = window.MutationObserver;

                if(native != custom) {//webkit doesnt allow mutation observer to be deleted
                    MutationObserverTests("MutationObserver-Shim");
                    perf(custom, native);
                } else {
                    QUnit.module("MutationObserver-Shim");
                    QUnit.testSkip("Can't test shim in this browser as we cannot delete the native MutationObserver. Some implementations protect it --- lookin at you webkit");
                }
            });
        };

        if(window.MutationObserver) {
            MutationObserverTests("MutationObserver");
            QUnit.moduleDone( test2 );
        } else {
            test2();
        }
    });
});