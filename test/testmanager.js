QUnit.config.testTimeout = 1000;
QUnit.config.autostart = false; //was having trouble with autostart

QUnit.testSkip = function() { //http://stackoverflow.com/questions/13748129/skipping-a-test-in-qunit
    return QUnit.test(arguments[0] + " (SKIPPED)", 0, function() {
        var li = document.getElementById(QUnit.config.current.id);
        QUnit.done(function() {
            li.style.background = "#FFFF99";
        });
    });
};

//Simple test manager to delete window.MutationObserver after the original test runs
$(function() {
    curl(["tests.js", "perf.js"], function(MutationObserverTests, perf) {
        var called = 0;
        var test2 = function() {
            called += 1;
            if (called !== 1) return;

            var original = window.WebkitMutationObserver || window.MutationObserver;

            window.WebkitMutationObserver = window.MutationObserver = {};
            window.WebkitMutationObserver = window.MutationObserver = null; //so poly goes in

            var file = /\bmin=/.test(window.location.search) ? "../dist/mutationobserver.min.js" : "../MutationObserver.js";

            yepnope.injectJs(file, function() {

                var custom = window.MutationObserver;

                if (original != custom) { //webkit doesnt allow mutation observer to be deleted
                    MutationObserverTests("MutationObserver Shim");
                    perf(custom, original);
                } else {
                    QUnit.module("MutationObserver Shim");
                    QUnit.testSkip("Can't test shim in this browser as we cannot delete the native MutationObserver. Some implementations protect it --- lookin at you webkit");
                }
            });
        };

        if (window.MutationObserver) {
            MutationObserverTests("Native MutationObserver");
            QUnit.moduleDone(test2);
        } else {
            test2();
        }
    });
});
