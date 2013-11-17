
//Simple test manager to delete window.MutationObserver after the original test runs
$(function() {

    QUnit.config.testTimeout = 1000;

    curl(["mutationobserver.js"], function(MutationObserverTests) {
        MutationObserverTests("MutationObserver");

        QUnit.moduleDone( function(context) {
            if(context.name !== "MutationObserver") return;

            window.WebkitMutationObserver = window.MutationObserver = null;
            delete window.MutationObserver;//so poly goes in
            delete window.WebkitMutationObserver;

            Asset.javascript("../MutationObserver.js", {
                onload: function() {
                    MutationObserverTests("MutationObserver-Shim");
                }
            });
        });
    });
});
