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
            option: {timeout: 10000},
            main: {
                options: {
                    urls: ["http://localhost:8000/test/index.html"]
                }
            },
            min: {
                options: {
                    urls: ["http://localhost:8000/test/index.html?min=true"]
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
                    urls: ["http://localhost:8000/test/index.html"],
                    tags: ["master"],
                    testname: "MutationObserver QUnit tests",
                    browsers: grunt.file.readYAML("target-browsers.yml"),
                    concurrency: 2,
                    sauceConfig: {
                        "video-upload-on-pass": false
                    }
                }
            }
        },

        closurecompiler: {
            minify: {
                options: {
                    // Options mapped to Closure Compiler:
                    "compilation_level": "ADVANCED_OPTIMIZATIONS",
                    // language: "ECMASCRIPT3",
                    generate_exports: true,
                    warning_level: "VERBOSE",
                    // output_info: "warnings"

                    banner: [
                        "// <%= pkg.name %> v<%= grunt.file.readJSON('package.json').version %> (<%= pkg.repository.url %>)",
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
            message: "Release v%version%"
        }
    });


    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    var testJobs = ["jshint", "connect", "qunit:main"];
    if (typeof process.env.SAUCE_ACCESS_KEY !== "undefined") {
        testJobs.push("saucelabs-qunit");
    }
    grunt.registerTask("test", testJobs);
    grunt.registerTask("build", ["test", "closurecompiler", "qunit:min", "file_info"]);

    // Release alias task
    grunt.registerTask("release", function (type) {
        type = type || "patch";
        grunt.task.run("test");
        grunt.task.run("bumpup:" + type); // Bump up the package version
        grunt.task.run("closurecompiler");
        grunt.task.run("file_info");
        grunt.task.run("tagrelease");     // Commit & tag the changes from above
    });

    grunt.registerTask("default", ["build"]);
};
