/*jshint node:true */
'use strict';

module.exports = function (grunt) {
    var target = !!grunt.option('prod') ? 'prod' : 'dev';

    // auto load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
    grunt.loadTasks('tasks');


    grunt.initConfig({
        jekyll: {
            all: {
                src: 'app',
                dest: 'temp',
                config: '_config.yml',
                drafts: !!grunt.option('drafts')
            }
        },
        less: {
            dev: {
                options: {
                    dumpLineNumbers: 'comments'
                },
                files: {
                    'build/assets/css/main.css': 'temp/assets/css/main.less'
                }
            },
            prod: {
                options: {
                    compress: true,
                    yuicompress: true
                },
                files: {
                    'build/assets/css/main.css': 'temp/assets/css/main.less'
                }
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                '.jshintrc',
                '.bowerrc',
                'bower.json',
                'package.json',
                'Gruntfile.js',
                'app/assets/js/**/*.js',
                '!app/assets/js/vendor/**/*',
                '!app/assets/js/ga.js',
                '!app/assets/js/variables.js'
            ]
        },
        copy: {
            dev: {
                expand: true,
                filter: 'isFile',
                cwd: 'temp/',
                src: ['**/*'],
                dest: 'build/'
            },
            prod: {
                expand: true,
                filter: 'isFile',
                cwd: 'temp/',
                src: [ // don't copy files that are generated by other tasks
                    '**/*',
                    '!assets/bower_components/**/*', // requirejs
                    '!assets/css/**/*.less', // less
                    '!assets/img/**/*.{png,jpg,jpeg,svg}', // imagemin/svgmin
                    '!assets/js/**/*' // requirejs
                ],
                dest: 'build/'
            }
        },
        clean: {
            build: ['build'],
            unneeded: [ // clean up after requirejs
                'build/assets/js/build.txt'
            ]
        },
        requirejs: {
            all: {
                options: {
                    mainConfigFile: 'temp/assets/js/main.js',
                    baseUrl: 'temp/assets/js',
                    dir: 'build/assets/js',
                    removeCombined: true,
                    useStrict: true,
                    optimize: 'uglify2',
                    preserveLicenseComments: false,
                    modules: [
                        {
                            name: 'main'
                        }, {
                            name: 'comments',
                            exclude: ['main']
                        }, {
                            name: 'tetris',
                            exclude: ['main']
                        }
                    ]
                }
            }
        },
        imagemin: {
            all: {
                options: {
                    optimizationLevel: 2
                },
                files: [{
                    expand: true,
                    cwd: 'temp/',
                    src: ['assets/img/**/*.{png,jpg,jpeg}'],
                    dest: 'build/'
                }]
            }
        },
        svgmin: {
            all: {
                files: [{
                    expand: true,
                    cwd: 'temp/',
                    src: 'assets/img/**/*.svg',
                    dest: 'build/'
                }]
            }
        },
        handlebars: {
            options: {
                amd: true,
                namespace: false
            },
            dev: {
                files: [{
                    expand: true,
                    cwd: 'temp/',
                    src: 'assets/js/templates/*.html',
                    dest: 'build/',
                    ext: '.js'
                }]
            },
            prod: {
                files: [{
                    expand: true,
                    cwd: 'temp/',
                    src: 'assets/js/templates/*.html',
                    dest: 'temp/', // output to temp so requirejs can pick it up
                    ext: '.js'
                }]
            }
        },
        watch: {
            options: {
                livereload: true
            },
            dev: {
                files: [
                    'app/**/*',
                    'Gruntfile.js',
                    '_config.yml'
                ],
                tasks: ['dev']
            },
            prod: {
                files: [
                    'app/**/*',
                    'Gruntfile.js',
                    '_config.yml'
                ],
                tasks: ['prod']
            }
        },
        connect: {
            all: {
                options: {
                    base: 'build',
                    middleware: function (connect, options) {
                        // emulate the server headers/compression
                        return [
                            function (req, res, next) {
                                /*jshint quotmark:false */
                                res.setHeader('X-UA-Compatible', 'IE=Edge');
                                res.setHeader('X-Content-Type-Options', 'nosniff');
                                res.setHeader('X-XSS-Protection', '1; mode=block');
                                res.setHeader('X-Frame-Options', 'SAMEORIGIN');
                                res.setHeader(
                                    'Content-Security-Policy',
                                    "default-src 'self' chrome-extension:; style-src 'self' chrome-extension: 'unsafe-inline'; script-src 'self' chrome-extension: https://www.google-analytics.com https://ssl.google-analytics.com; img-src *; connect-src 'self' chrome-extension: https://api.github.com ws://127.0.0.1:35729; report-uri /csp-report;"
                                );
                                next();
                            },
                            connect.compress({
                                filter: function (req, res) {
                                    return (/json|text|javascript|xml/).test(res.getHeader('Content-Type'));
                                }
                            }),
                            connect.static(options.base)
                        ];
                    }
                }
            }
        },
        concurrent: {
            dev: [
                'copy:dev',
                'handlebars:dev',
                'less:dev'
            ],
            prod: [
                'copy:prod',
                'less:prod',
                'imagemin',
                'svgmin',
                'requirejs'
            ]
        }
    });


    grunt.registerTask('dev', [
        'clean:build',
        'jekyll',
        'concurrent:dev'
    ]);

    grunt.registerTask('prod', [
        'clean:build',
        'jekyll',
        'handlebars:prod', // needs to run before requirejs
        'concurrent:prod',
        'clean:unneeded'
    ]);

    grunt.registerTask('build', [target]);
    grunt.registerTask('server', [target, 'connect', 'watch:' + target]);
    grunt.registerTask('deploy', ['prod', 'upload']);

    grunt.registerTask('default', ['server']);
};
