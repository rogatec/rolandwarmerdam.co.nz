requirejs.config({
    baseUrl: '/assets/js',
    paths: {
        jquery: 'vendor/jquery'
    }
});


require(['jquery', 'variables', 'ga'], function ($) {
    'use strict';

    // Track JavaScript errors in Google Analytics
    (function (window, undefined) {
        function link(href) {
            var a = window.document.createElement('a');
            a.href = href;
            return a;
        }

        window.onerror = function (message, file, row) {
            var host = link(file).hostname;
            _gaq.push([
                '_trackEvent',
                (host === window.location.hostname || host === undefined || host === '' ? '' : 'external ') + 'error',
                message, file + ' LINE: ' + row, undefined, undefined, true
            ]);
        };
    }(window));


    $(function () {
        /***** On-demand script loading *****/

        if (Modernizr.canvas) {
            $('#tetris .image').on('click', function () {
                require(['tetris']);
                _gaq.push(['_trackEvent', 'Tetris', 'Load']);
            });
        }

        if ($('#comments').length > 0) {
            require(['comments']);
        }


        /***** Event tracking *****/

        $('.search').on('submit', function () {
            _gaq.push(['_trackEvent', 'Site search', 'Submit']);
        });

        $('#skip-top a').on('click', function () {
            _gaq.push(['_trackEvent', 'Site navigation', 'In-page', 'Skip to top of page']);
        });
    });
});
