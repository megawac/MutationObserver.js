define(["utils"], function(utils) {
    return function() {//tests
        QUnit.asyncTest("Core", 9, function() {
            var deferred = utils.asyncAutocomplete();

            var $test = $("<div>", {
                'class': "test",
                'id': "ya",
                css: {
                    display: 'inline'
                }
            });
            var teste = $test.get(0);

            /*var tobserver;
            try { //implementation dependent (fails on chrome passes on ff)
                tobserver = MutationObserver(function() {

                });
            } catch(o_O) {
            }
            ok(tobserver instanceof MutationObserver, "Can be instantiated without new keyword :o");
            */

            var mutations;
            var observer1 = new MutationObserver(function(items, observer) {
                equal(items.length, 4, "observer1 was called correctly");
                ok(observer  === observer1, "Change event called with observer as second argument");
                ok(this === observer1, "Change event called with observer as second argument");

                deepEqual(items, mutations, "Observer1 called with the same records from .takeRecords");
            });
            ok(observer1 instanceof MutationObserver, "should be an instance of MutationObserver");

            var observer2 = new MutationObserver(function(items) {
                equal(items.length, 4, "observer2 was called correctly on the same watched element");

                deepEqual(items, mutations, "Both observers called with the same changes");
            });

            var observer3 = new MutationObserver(function(items) {
                equal(items.length, 3, "observer3 was called with only attributes mutations");
            });

            var observer4 = new MutationObserver(function(/*items*/) {//should not be called
                ok(false, "Take records successfully emptied record queue for observer4");
            });

            observer1.observe(teste, {
                attributes: true,
                childList: true
            });

            observer2.observe(teste, {
                attributes: true,
                childList: true
            });

            observer3.observe(teste, {
                attributes: true
            });

            observer4.observe(teste, {
                attributes: true,
                childList: true
            });

            teste.removeAttribute("id");
            teste.setAttribute("data-test", Math.random() * 9999);
            teste.setAttribute("data-test2", Math.random() * 9999);

            $("<a>", {href: "github.com", value: "github"}).appendTo(teste);

            mutations = observer4.takeRecords();
            equal(mutations.length, 4, ".takeRecords correctly return the correct number of mutations");

            deferred.done(function() {
                observer1.disconnect();
                observer2.disconnect();
                observer3.disconnect();
                observer4.disconnect();
            });
        });
    };
});
