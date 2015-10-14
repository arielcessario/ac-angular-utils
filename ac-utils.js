(function () {
    'use strict';
    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;
    angular.module('acUtils', ['ngRoute'])
        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/module', {
                templateUrl: currentScriptPath.replace('.js', '.html'),
                controller: 'AcUtils'
            });
        }])
        .controller('AcUtilsController', AcUtilsController)
        .factory('AcUtils', AcUtils)
        .service('AcUtilsGlobals', AcUtilsGlobals)
        .directive('acSearchPanel', AcSearchPanel)
    ;





    AcSearchPanel.$inject = [];
    function AcSearchPanel() {
        return {
            restrict: 'AE',
            scope: {
                service: '=',
                params: '=',
                values: '=',
                selected: '='
            },
            controller: function ($scope, $compile, $http) {
                var vm = this;


            },
            link: function (scope, element, attr) {
                element.bind('keyup', function(data){

                });

            },
            controllerAs: 'acSearchCtrl'
        };
    }

    AcUtilsController.$inject = [];
    function AcUtilsController() {
    }

    AcUtilsGlobals.$inject = ['$rootScope'];
    function AcUtilsGlobals($rootScope) {
        this.isWaiting = false;
        this.sucursal_auxiliar_id = -1;
        this.broadcast = function () {
            $rootScope.$broadcast("AcUtilsGlobalsValidations")
        };
        this.listen = function (callback) {
            $rootScope.$on("AcUtilsGlobalsValidations", callback)
        };
    }


    AcUtils.$inject = ['AcUtilsGlobals'];
    function AcUtils(AcUtilsGlobals) {
        var service = {};

        service.validateEmail = validateEmail;
        service.validations = validations;
        service.verifyBrowser = verifyBrowser;
        service.getByParams = getByParams;

        return service;


        /**
         * @description Retorna la lista filtrada de Carritos
         * @param params -> String, separado por comas (,) que contiene la lista de parámetros de búsqueda, por ej: nombre, sku
         * @param values
         * @param exact_match
         * @param data
         * @param callback
         */
        function getByParams(params, values, exact_match, data, callback) {
            if(data.length == 0){
                return;
            }

            var parametros = params.split(',');
            var valores = values.split(',');

            var respuesta = [];
            for (var y = 0; y < data.length; y++) {
                var columns = Object.keys(data[y]);

                for (var i = 0; i < columns.length; i++) {
                    for (var x = 0; x < parametros.length; x++) {
                        if (columns[i] == parametros[x]) {

                            var base = '' + data[y][Object.keys(data[y])[i]];
                            var valor = (valores.length == 1) ? '' + valores[0] : '' + valores[x];
                            if (
                                ( exact_match && base.toUpperCase() == valor.toUpperCase()) ||
                                (!exact_match && base.toUpperCase().indexOf(valor.toUpperCase()) > -1)
                            ) {
                                respuesta.push(data[y]);
                                x = parametros.length;
                                i = columns.length;
                            }
                        }
                    }
                }
            }
            callback(respuesta);
        }


        function verifyBrowser() {

            var obj = {};
            obj.isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
            // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
            obj.isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
            obj.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
            // At least Safari 3+: "[object HTMLElementConstructor]"
            obj.isChrome = !!window.chrome && !isOpera;              // Chrome 1+
            obj.isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

            return obj;
        }

        function validateEmail(email) {
            var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return re.test(email);
        }


        function validations(control, texto) {
            var id = Math.floor((Math.random() * 1000) + 1);
            var elem = angular.element(document.querySelector('#' + control));
            elem.addClass('error-input');
            elem.after('<div class="error-message" id="error-' + id + '">' + texto + '</div>');
            var mensaje = angular.element(document.querySelector('#error-' + id));


            mensaje.css('top', (elem[0].offsetTop + elem[0].offsetHeight) + 'px');
            mensaje.css('left', elem[0].offsetLeft + 'px');

            clear();

            function clear() {
                elem[0].addEventListener('focus', function () {
                    elem.removeClass('error-input');
                    elem[0].removeEventListener('focus');
                    mensaje.remove();
                });
            }

            AcUtilsGlobals.listen(function () {
                var control = angular.element(document.querySelectorAll('.error-input'));
                var error = angular.element(document.querySelectorAll('.error-message'));


                for (var i = 0; i < control.length; i++) {

                    control[i].classList.remove('error-input');
                    control[i].removeEventListener('focus');
                    mensaje.remove();
                }
                for (var i = 0; i < error.length; i++) {
                    error[i].remove();
                }
            });

        }
    }

})();


/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }
        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date();

        if (isNaN(date) && !(typeof InstallTrigger !== 'undefined')) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d: d,
                dd: pad(d),
                ddd: dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m: m + 1,
                mm: pad(m + 1),
                mmm: dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy: String(y).slice(2),
                yyyy: y,
                h: H % 12 || 12,
                hh: pad(H % 12 || 12),
                H: H,
                HH: pad(H),
                M: M,
                MM: pad(M),
                s: s,
                ss: pad(s),
                l: pad(L, 3),
                L: pad(L > 99 ? Math.round(L / 10) : L),
                t: H < 12 ? "a" : "p",
                tt: H < 12 ? "am" : "pm",
                T: H < 12 ? "A" : "P",
                TT: H < 12 ? "AM" : "PM",
                Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
dateFormat.masks = {
    "default": "ddd mmm dd yyyy HH:MM:ss",
    shortDate: "m/d/yy",
    mediumDate: "mmm d, yyyy",
    longDate: "mmmm d, yyyy",
    fullDate: "dddd, mmmm d, yyyy",
    shortTime: "h:MM TT",
    mediumTime: "h:MM:ss TT",
    longTime: "h:MM:ss TT Z",
    isoDate: "yyyy-mm-dd",
    isoTime: "HH:MM:ss",
    isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};