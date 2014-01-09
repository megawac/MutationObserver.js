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
                    browsers: [{
                            browserName: "firefox",
                            version: "19",
                            platform: "XP"
                        }, {
                            browserName: "chrome",
                            platform: "XP"
                        }, {
                            browserName: "chrome",
                            platform: "linux"
                        }, {
                            browserName: "internet explorer",
                            platform: "WIN8",
                            version: "10"
                        }, {
                            browserName: "internet explorer",
                            platform: "VISTA",
                            version: "9"
                        }, {
                            browserName: "opera",
                            platform: "Windows 2008",
                            version: "12"
                        }
                    ]
                }
            }
        },

        uglify: {
            options: {
                compress: {
                    // unsafe: true,
                    // hoist_vars: true
                },
                preserveComments: "none",
                beautify: false,
                ast_lift_variables: true,

                report: "gzip",
                banner: [
                    "/*!",
                    "* <%= pkg.name %> v<%= pkg.version %> (<%= pkg.repository.url %>)",
                    "* Authors: <% _.each(pkg.authors, function(author) { %><%= author.name %> (<%= author.email %>) <% }); %>",
                    "* Use, redistribute and modify as desired. Released under <%= pkg.license.type %> <%= pkg.license.version %>.",
                    "*/\n"
                ].join("\n")
            },
            min: {
                files: {
                    "dist/<%= pkg['short name'] %>.min.js": "MutationObserver.js"
                }
            },
            strip: {
                options: {
                    beautify: true,
                    mangle: false
                },
                files: {
                    "dist/<%= pkg['short name'] %>.strip.js": "MutationObserver.js"
                }
            }
        }
    });



    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-qunit");
    grunt.loadNpmTasks("grunt-contrib-uglify");


    var testJobs = ["jshint", "connect", "qunit"];
    if (typeof process.env.SAUCE_ACCESS_KEY !== "undefined") {
        grunt.loadNpmTasks("grunt-saucelabs");
        testJobs.push("saucelabs-qunit");
    }
    grunt.registerTask("test", testJobs);

    grunt.registerTask("build", ["uglify"]);

    grunt.registerTask("default", ["test", "build"]);
};