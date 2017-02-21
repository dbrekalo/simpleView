/* jshint node: true */
module.exports = function(grunt) {

    grunt.initConfig({

        npmPackage: grunt.file.readJSON('package.json'),
        bowerPackage: grunt.file.readJSON('bower.json'),

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

        eslint: {
            options: {
                configFile: '.eslintrc.js'
            },
            target: ['src/**/*.js', 'Gruntfile.js', 'test/index.js']
        },

        concat: {
            bundle: {
                src: [
                    'node_modules/type-factory/dist/typeFactory.js',
                    'node_modules/mitty/dist/mitty.js',
                    'dist/simpleView.js'
                ],
                dest: 'dist/simpleView.bundle.js'
            },
            bundleMin: {
                src: [
                    'node_modules/type-factory/dist/typeFactory.min.js',
                    'node_modules/mitty/dist/mitty.min.js',
                    'dist/simpleView.min.js'
                ],
                dest: 'dist/simpleView.bundle.min.js'
            }
        },

        includereplace: {
            dist: {
                options: {
                    globals: {
                        repositoryUrl: '<%= npmPackage.repository.url %>',
                        npmRepositoryName: '<%= npmPackage.name %>',
                        bowerRepositoryName: '<%= bowerPackage.name %>'
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
                tasks: ['eslint', 'uglify', 'copy', 'concat'],
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
        },

        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                commitFiles: ['package.json', 'bower.json'],
                tagName: '%VERSION%',
                push: false
            }
        }

    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', ['watch']);
    grunt.registerTask('build', ['eslint', 'uglify', 'copy', 'concat', 'includereplace']);

};
