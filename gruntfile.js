/* jshint node:true */
module.exports = function(grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        meta: {},

        jshint: {
            all: {
                files: {
                    src: ["MutationObserver.js"]
                },
                options: {
                    jshintrc: ".jshintrc"
                }
            }
        },

        qunit: {
            all: {
                options: {
                    timeout: 10000,
                    urls: [
                        "http://localhost:8000/test/index.html"
                    ]
                }
            }
        },

        connect: {
            server: {
                options: {
                    port: 8000,
                    base: "."
                }
            }
        },

        "saucelabs-qunit": {
            all: {
                options: {
                    username: process.env.SAUCE_USERNAME || "mutationobserver",
                    key: process.env.SAUCE_ACCESS_KEY || "",
                    build: process.env.TRAVIS_JOB_ID,
                    tags: ["master"],
                    urls: ["http://localhost:8000/test/index.html"],
                    testname: "MutationObserver QUnit tests",
                    browsers: [{ //webkitMutationObserver -> MutationObserver
                        browserName: "chrome",
                        platform: "XP",
                        version: "26"
                    }, { //supported
                        browserName: "firefox",
                        platform: "linux"
                    }, { //not supported
                        browserName: "firefox",
                        version: "13"
                    }, { //not supported
                        browserName: "firefox",
                        platform: "OS X 10.9",
                        version: "4"
                    }, { //not supported
                        browserName: "internet explorer",
                        version: "10"
                    }, { //not supported
                        browserName: "internet explorer",
                        version: "9"
                    }, { //not supported and extremely buggy
                        browserName: "internet explorer",
                        version: "8",
                        platform: "Windows XP"
                    }, { //not supported and extremely buggy
                        browserName: "internet explorer",
                        version: "7",
                        platform: "Windows XP"
                    }, { //not supported
                        browserName: "opera",
                        version: "12"
                    }, { //not supported
                        browserName: "safari",
                        version: "5"
                    }, {
                        browserName: "iphone",
                        version: "5"
                    }]
                }
            }
        },

        gcc: {
            build: {
                options: {
                    compilation_level: "ADVANCED_OPTIMIZATIONS",
                    generate_exports: true,
                    // language: "ECMASCRIPT3",

                    // output_info: "warnings",
                    warning_level: "VERBOSE",

                    banner: [
                        "// <%= pkg.name %> v<%= pkg.version %> (<%= pkg.repository.url %>)",
                        "// Authors: <% _.each(pkg.authors, function(author) { %><%= author.name %> (<%= author.email %>) <% }); %>"
                        // "// Use, redistribute and modify as desired. Released under <%= pkg.license.type %> <%= pkg.license.version %>.",
                    ].join("\n")
                },
                src: ["MutationObserver.js"],
                dest: "dist/<%= pkg['short name'] %>.min.js"
            }
        },

        file_info: {
            source_files: {
                src: ["MutationObserver.js", "dist/<%= pkg['short name'] %>.min.js"],
                options: {
                    inject: {
                        dest: "dist/README.md",
                        text:   "- Original: {{= sizeText(size(src[0])) }}" +
                                grunt.util.linefeed +
                                "- Minified: {{= sizeText(size(src[1])) }}" +
                                grunt.util.linefeed +
                                "- Gzipped:  {{= sizeText(gzipSize(src[1])) }}" +
                                grunt.util.linefeed
                    }
                }
            }
        },

        bumpup: {
            file: "package.json"
        },
        tagrelease: {
            file: "package.json",
            commit:  true,
            message: "Release %version%"
        }
    });


    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    var testJobs = ["jshint", "connect", "qunit"];
    if (typeof process.env.SAUCE_ACCESS_KEY !== "undefined") {
        testJobs.push("saucelabs-qunit");
    }
    grunt.registerTask("test", testJobs);
    grunt.registerTask("build", ["test", "gcc", "file_info"]);

    // Release alias task
    grunt.registerTask("release", function (type) {
        type = type ? type : "patch";
        grunt.task.run("test");
        grunt.task.run("bumpup:" + type); // Bump up the package version
        grunt.task.run("gcc");
        grunt.task.run("file_info");
        grunt.task.run("tagrelease");     // Commit & tag the changes from above
    });

    grunt.registerTask("default", ["build"]);
};
