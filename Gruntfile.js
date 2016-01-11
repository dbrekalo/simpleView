/* jshint node: true */
module.exports = function(grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            min: {
                files: [{
                    expand: true,
                    cwd: 'src',
                    src: '**/*.js',
                    dest: 'dist',
                    ext: '.min.js'
                }],
                options: {

                }
            }
        },

        copy: {
            jsFiles: {
                files: [{
                    expand: true,
                    cwd: 'src',
                    src: ['**/*.js'],
                    dest: 'dist'
                }]
            }
        },

        jshint: {
            options: {
                'jshintrc': '.jshintrc'
            },
            all: ['src','Gruntfile.js']
        },

        jscs: {
            options: {
                config: '.jscsrc'
            },
            scripts: {
                files: {
                    src: [
                        'src/**/*.js'
                    ]
                }
            }
        },

        concat: {
            bundle: {
                src: ['bower_components/type-factory/dist/typeFactory.js', 'dist/simpleView.js'],
                dest: 'dist/simpleView.bundle.js'
            },
            bundleMin: {
                src: ['bower_components/type-factory/dist/typeFactory.min.js', 'dist/simpleView.min.js'],
                dest: 'dist/simpleView.bundle.min.js'
            }
        },

        includereplace: {
            dist: {
                options: {
                    globals: {
                        repositoryUrl: '<%= pkg.repository.url %>',
                        repositoryName: '<%= pkg.name %>'
                    },
                    prefix: '{{ ',
                    suffix: ' }}'
                },
                src: 'demo/index.html',
                dest: 'index.html'
            }
        },

        watch: {
            jsFiles: {
                expand: true,
                files: ['src/**/*.js', 'Gruntfile.js'],
                tasks: ['jshint', 'jscs', 'copy', 'uglify', 'concat'],
                options: {
                    spawn: false
                }
            },
            demoFiles: {
                expand: true,
                files: ['demo/**/*.html'],
                tasks: ['includereplace'],
                options: {
                    spawn: false
                }
            }
        }

    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['watch']);
    grunt.registerTask('build', ['jshint', 'jscs', 'uglify', 'copy', 'concat', 'includereplace']);

};
