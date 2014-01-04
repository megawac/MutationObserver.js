QUnit.config.testTimeout = 1000;
QUnit.config.autostart = false;//was having trouble with autostart

//Simple test manager to delete window.MutationObserver after the original test runs
$(function() {
    curl(["tests.js", "perf.js"], function(MutationObserverTests, perf) {

        QUnit.start();

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
                    alert("can't test shim because webkit does not allow MutationObserver to be deleted");
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