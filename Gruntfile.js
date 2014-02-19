// Generated on 2013-03-27 using generator-webapp 0.1.5

module.exports = function (grunt) {
    var libConfig = {
        src: "src",
        dist: "dist"
    };
    // This needs to be changed. It"s just copies structure of
    // my original builder, which was not really well organized:
    var fileGroups = {
        core: [
            "WY3D.js",
            "core/face3.js",
            "core/renderer.js",
            "core/webgl_program.js",
            "core/object3d.js",
            "core/mesh.js",
        ],
        geometries: [
            "geometries/geometry.js",
            "geometries/plane_geometry.js"
        ],
        utils: [
            "utils/utils.js"
        ],
        math: [
            "math/quaternion.js",
            "math/euler.js",
            "math/vector2.js",
            "math/vector3.js",
            "math/matrix3.js",
            "math/matrix4.js"
        ]
    };
    Object.keys(fileGroups).forEach(function (key) {
        fileGroups[key] = fileGroups[key].map(function (path) {
            return libConfig.src + "/" + path;
        });
    });
    grunt.initConfig({
        lib: libConfig,
        watch: {
            js: {
                files: "<%= lib.src %>/**/*.js",
                tasks: ["build"],
                spawn: true
            }
        },
        jshint: {
            all: [
                "Gruntfile.js",
                "<%= lib.src %>/{,*/}*.js"
            ],
            options: {
                jshintrc: ".jshintrc"
            }
        },
        clean: {
            dist: ["<%= lib.dist %>/*"]
        },
        concat: {
            options: {
                separator: ""
            },
            all: {
                src: [
                    fileGroups.core,
                    fileGroups.geometries,
                    fileGroups.math,
                    fileGroups.utils
                ],
                dest: "<%= lib.dist %>/WY3D.js"
            }
        },
        uglify: {
            dist: {
                files: {
                    "<%= lib.dist %>/WY3D.min.js": ["<%= lib.dist %>/WY3D.js"]
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-regarde");

    grunt.renameTask("regarde", "watch");

    grunt.registerTask("build", [
        "clean:dist",
        "concat:all",
        "uglify"
    ]);
    grunt.registerTask("server", [
        "build",
        "watch"
    ]);
    grunt.registerTask("default", ["jshint", "build"]);
};
