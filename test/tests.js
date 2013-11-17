

QUnit.config.testTimeout = 1000;
QUnit.config.autostart = false;//was having trouble with autostart

//Simple test manager to delete window.MutationObserver after the original test runs
$(function() {

    curl(["mutationobserver.js"], function(MutationObserverTests) {

        QUnit.start();

        var test2 = function(context) {
            if(context && context.name !== "MutationObserver") return;

            window.WebkitMutationObserver = window.MutationObserver = null;
            delete window.MutationObserver;//so poly goes in
            delete window.WebkitMutationObserver;

            Asset.javascript("../MutationObserver.js", {
                onload: function() {
                    MutationObserverTests("MutationObserver-Shim");
                }
            });
        }

        if(window.MutationObserver) {
            MutationObserverTests("MutationObserver");
            QUnit.moduleDone( test2 );
        } else {
            test2();
        }
        
    });
});
