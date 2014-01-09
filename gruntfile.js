/* jshint node:true */
module.exports = function(grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        meta: {},

        uglify: {
            options: {
                compress: {
                    dead_code: true
                },
                preserveComments: "none",
                beautify: false,
                ast_lift_variables: true,
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



    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.registerTask("default", [
        "uglify"
    ]);
};