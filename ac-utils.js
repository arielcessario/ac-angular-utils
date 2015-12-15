/*TODO: No funciona para carritos*/
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
        .directive('acValidator', AcValidator)
    ;


    AcValidator.$inject = ["AcUtils", 'AcUtilsGlobals', '$timeout'];
    function AcValidator(AcUtils, AcUtilsGlobals, $timeout) {
        return {
            restrict: 'A',
            scope: {
                isRequired: '@', // Mensaje de error para el requerido, la presencia del mensaje significa que es requerido
                minLength: '@', // Minima longitud de la cadena, separado por ; el mensaje para el error. Ej: min-length="5;El texto ingresado es demasiado corto"
                maxLength: '@', // Máxima longitud de la cadena, separado por ; el mensaje para el error. Ej: min-length="5;El texto ingresado es demasiado largo"
                isMail: '@', // Mensaje de error por si el formato del mail se incorrecto, la presencia del mensaje significa que es mail
                minNumber: '@', // Número mínimo que puede ingresar, ej: min-number="5;El número debe ser mayor a 5"
                maxNumber: '@', // Número máximo que puede ingresar, ej: min-number="5;El número debe ser menor a 5"
                minDate: '@', // Compara la fecha. ej: min-date="today;La fecha no puede ser menor a hoy" / También se pueden enviar fechas variables {{'11/25/2015'}}
                maxDate: '@', // Compara la fecha
                ngModel: '=' // Compara la fecha
            },
            controller: function ($scope, $element, $attrs) {
                var vm = this;


                // Agrego siempre el error, luego se va cuando completo bien los datos requeridos
                addError(getMainContainer($element));


                /**
                 * En el caso que se necesite, borra todas las instancias de los mensajes de error. No usar en la mayoría de los casos.
                 */
                AcUtilsGlobals.listen(function () {
                    var control = angular.element(document.querySelectorAll('.error-input'));
                    var error = angular.element(document.querySelectorAll('.error-message'));


                    for (var i = 0; i < control.length; i++) {

                        control[i].classList.remove('error-input');
                        control[i].removeEventListener('focus');
                        //mensaje.remove();
                    }
                    for (var i = 0; i < error.length; i++) {
                        error[i].remove();
                    }
                });

                /**
                 * @description Busca el padre del formulario, esta clave obtenida luego se usa para ver si tiene errores encolados
                 * @param el
                 */
                function getMainContainer(el) {
                    while (el.parent()) {
                        el = el.parent();
                        for (var i = 0; i < el[0].attributes.length; i++) {
                            if (el[0].attributes[i].nodeName == 'form-id') {
                                return (el[0].attributes[i].nodeValue);
                            }
                        }
                    }
                    return null;
                }

                /**
                 * @description Agrega un error al formulario para evitar que se ejecute cualquier acción
                 * @param parent
                 */
                function addError(parent) {

                    if ($element[0].id.trim().length == 0) {
                        return;
                    }


                    var index = -1;
                    var sub_index = -1;
                    for (var i = 0; i < AcUtilsGlobals.errores.length; i++) {
                        if (AcUtilsGlobals.errores[i].parent == parent) {
                            index = i;
                            for (var x = 0; x < AcUtilsGlobals.errores[i].errores.length; x++) {
                                if (AcUtilsGlobals.errores[i].errores[x].control == $element[0].id) {
                                    sub_index = x;
                                }
                            }
                        }
                    }

                    if (index == -1) {
                        // No existe el formulario en el array de errores, tampoco va a existir el control así que creo todo
                        AcUtilsGlobals.errores.push({parent: parent, errores: [{control: $element[0].id}]});
                    } else {
                        // Existe el formulario, veo si existe el control
                        if (sub_index == -1) {
                            AcUtilsGlobals.errores[index].errores.push({control: $element[0].id});
                        }
                    }

                }

                /**
                 * @description Remueve el estado de error para el formulario
                 * @param parent
                 */
                function removeError(parent) {
                    var index = -1;
                    var sub_index = -1;
                    for (var i = 0; i < AcUtilsGlobals.errores.length; i++) {
                        if (AcUtilsGlobals.errores[i].parent == parent) {
                            index = i;
                            for (var x = 0; x < AcUtilsGlobals.errores[i].errores.length; x++) {
                                if (AcUtilsGlobals.errores[i].errores[x].control == $element[0].id) {
                                    sub_index = x;
                                }
                            }
                        }
                    }

                    if (index != -1 && sub_index != -1) {
                        AcUtilsGlobals.errores[index].errores.splice(sub_index, 1);
                    }

                }

                /**
                 * Dentro de esta función valido el evento click y si no está todo ok en el formulario, no lo ejecuto
                 */
                $element.bind('click', function (e) {
                    if ($element[0].tagName == 'BUTTON' || $element[0].type == 'button') {

                        var parent = getMainContainer($element);

                        for (var i = 0; i < AcUtilsGlobals.errores.length; i++) {
                            if (AcUtilsGlobals.errores[i].parent == parent &&
                                AcUtilsGlobals.errores[i].errores.length > 0) {


                                AcUtils.showMessage('error', 'Existen errores en el formulario, por favor corríjalos y vuelva a intentar');
                                e.stopImmediatePropagation();
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                            }
                        }
                    }
                });

                /**
                 * Cuando el usuario abandona el control, se ejecuta la validación
                 */
                $element.bind('blur', onChange);
                $scope.$watch('ngModel', function (newVal, oldVal) {

                    onChange(newVal, oldVal, 'ngModel');
                });

                /**
                 * Function validadora
                 * @param v nuevo valor
                 * @param value origen de la llamada de la función
                 */
                function onChange(v, o, value) {

                    // Fallback para cuando se inicializa el control
                    // v es undefined en el onload
                    if (value == 'ngModel' && (v == undefined || v.length == 0)) {
                        return;
                    }
                    v = (v == undefined) ? '' : v;

                    o = (o == undefined) ? '' : o;

                    if (Math.abs(v.length - o.length) == 1) {
                        return;
                    }

                    // No hago nada en el blur del botón
                    if ($element[0].tagName == 'BUTTON' || $element[0].type == 'button') {
                        return;
                    }

                    // Randomizo un id para el div que voy a crear con la descripción del error
                    var id = Math.floor((Math.random() * 1000) + 1);
                    var elem = $element;

                    // Texto en donde mostrar el error, separo cada texto con </br>
                    var texto = '';


                    // Verifico requerido
                    if ($scope.isRequired != undefined && $element.val().trim().length == 0) {
                        texto = texto + $scope.isRequired + '</br>';
                    }

                    // Verifico longitud mínima
                    if ($scope.minLength != undefined && $element.val().length < $scope.minLength.split(';')[0]) {
                        texto = texto + $scope.minLength.split(';')[1] + '</br>';
                    }

                    // Verifico longitud máxima
                    if ($scope.maxLength != undefined && $element.val().length > $scope.maxLength.split(';')[0]) {
                        texto = texto + $scope.maxLength.split(';')[1] + '</br>';
                    }

                    // Verifico si el mail es correcto
                    if ($scope.isMail != undefined && !AcUtils.validateEmail($element.val())) {
                        texto = texto + $scope.isMail + '</br>';
                    }

                    // Verifico floor
                    if ($scope.minNumber != undefined && parseFloat($element.val()) < parseFloat($scope.minNumber.split(';')[0])) {
                        texto = texto + $scope.minNumber.split(';')[1] + '</br>';
                    }

                    // Verifico ceiling
                    if ($scope.maxNumber != undefined && parseFloat($element.val()) < parseFloat($scope.maxLength.split(';')[0])) {
                        texto = texto + $scope.maxNumber.split(';')[1] + '</br>';
                    }

                    // Verifico fecha mínima
                    if ($scope.minDate != undefined) {
                        if ($scope.minDate.split(';')[0] == 'today') {
                            if (new Date($element.val()) < new Date()) {
                                texto = texto + $scope.minDate.split(';')[1] + '</br>';
                            }
                        } else {
                            if ((new Date($element.val()) < new Date($scope.minDate.split(';')[0]))) {
                                texto = texto + $scope.minDate.split(';')[1] + '</br>';
                            }
                        }
                    }

                    // Verifico fecha máxima
                    if ($scope.maxDate != undefined) {
                        if ($scope.maxDate.split(';')[0] == 'today') {
                            if (new Date($element.val()) > new Date()) {
                                texto = texto + $scope.maxDate.split(';')[1] + '</br>';
                            }
                        } else {
                            if ((new Date($element.val()) > new Date($scope.minDate.split(';')[0]))) {
                                texto = texto + $scope.maxDate.split(';')[1] + '</br>';
                            }
                        }
                    }

                    texto = texto.substr(0, texto.length - 5);

                    // Si no hay errores me voy de la función
                    if (texto.trim().length == 0) {
                        // Remuevo el error si existe y salgo de la validación
                        removeError(getMainContainer(elem));
                        return;
                    } else {
                        // Agrego el campo con error al
                        addError(getMainContainer(elem));
                    }

                    //Agrego la visualización del error
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
                            removeError(getMainContainer(elem));
                        });
                    }
                }

            },
            link: function (scope, element, attrs, ctrl) {

            },
            controllerAs: 'acSearchCtrl'
        };
    }

    /**
     * Directiva que muestra un panel de resultados de las b?squedas. Para darle aspecto, utilizar .ac-result-panel
     * @type {string[]}
     */
    AcSearchPanel.$inject = ['$injector', 'AcUtilsGlobals', '$timeout', '$compile'];
    function AcSearchPanel($injector, AcUtilsGlobals, $timeout, $compile) {
        return {
            restrict: 'AE',
            scope: {
                service: '=', // El servicio que va a devolver los valores
                params: '@', // Campos en donde buscar, string separado por comas, sin espacios, y el nombre del campo de la tabla
                exactMatch: '=', // True busca la palabra completa, False solo un parcial -> recomendado
                visible: '@', // lo que se va a mostrar en el listado, string separado por comas, sin espacios, y el nombre del campo de la tabla
                selected: '=', // El objeto en donde queremos volcar la selecci?n
                objeto: '=', // El objeto en donde queremos volcar la selecci?n,
                func: '@', // Si se desea se pude pasar otra funciï¿½n
                minInput: '=' // Si se desea se pude pasar otra funciï¿½n
            },
            controller: function ($scope, $element, $attrs) {
                var vm = this;

                vm.resultados = [];
                vm.acItemListPanelSelected = 0;
                var timeout = {};
                vm.minInput = ($scope.minInput) ? $scope.minInput : 2;

                vm.over = false;

                // Cuando saco el mouse de la ventana, se tiene que ocultar la ventana
                $element.bind('mouseleave', function () {
                    vm.over = false;
                    timeout = $timeout(AcUtilsGlobals.broadcastPanel, 1000);
                });

                // El mouse arriba tiene que evitar que oculte la ventana
                $element.bind('mouseover', function () {
                    $timeout.cancel(timeout);
                    vm.over = true;
                });

                // Copio el objeto, si no lo copio y lo envio directo se borra del array original
                vm.selectItem = function (i) {
                    $scope.objeto = angular.copy(vm.resultados[i]);
                    vm.over = false;
                    AcUtilsGlobals.broadcastPanel();
                };


                // Mï¿½todo principal cuando tiene el foco o cuando presiona la tecla
                $element.bind('keyup focus', function (event) {
                    $timeout.cancel(timeout);

                    if ($element.val().length > vm.minInput) {

                        // Avisa a todos los paneles para que se oculten
                        vm.over = false;
                        AcUtilsGlobals.broadcastPanel();

                        // Consigo el servicio a partir del par?metro pasado en la directiva
                        var myService = $injector.get($attrs.service);

                        if ($scope.func != undefined) {
                            $injector.get($attrs.service)[$scope.func]($scope.params, $element.val(), function (data) {
                                if (data.length > 0) {

                                    procesarRespuesta(data);
                                }
                            });

                        } else {
                            // Invoco al evento genÃ©rico
                            myService.getByParams($attrs.params, $element.val(), $attrs.exactMatch, function (data) {
                                if (data.length > 0) {
                                    procesarRespuesta(data);
                                }
                            });
                        }


                    } else {
                        vm.over = false;
                        AcUtilsGlobals.broadcastPanel();
                    }
                });

                function procesarRespuesta(data) {

                    vm.resultados = data;
                    // Creo un random id para darle a la lista y que no tenga error con otros div de la aplicaci?n
                    var id = Math.floor((Math.random() * 100000) + 1);

                    // Creo el contenedor de los items que devuelvo de la b?squeda.
                    $element.after('<div class="ac-result-panel" id="panel-' + id + '"></div>');

                    // Obtengo a la lista y la guardo en una variable
                    var lista = angular.element(document.querySelector('#panel-' + id));


                    // Agrego un evento que cuando me voy de la lista espero un segundo y la remuevo
                    lista.bind('mouseleave', function () {
                        vm.over = false;
                        timeout = $timeout(AcUtilsGlobals.broadcastPanel, 1000);
                    });

                    // Agrego un evento que cuando estoy sobre la lista, no se oculte
                    lista.bind('mouseover focus', function () {
                        $timeout.cancel(timeout);
                        vm.over = true;
                    });

                    // Parseo la lista de columnas a mostrar en la lista
                    var a_mostrar_columnas = $attrs.visible.split(',');

                    // Reviso la lista completa para saber que mostrar
                    for (var i = 0; i < data.length; i++) {
                        var columns = Object.keys(data[i]);
                        var a_mostrar_text = '';

                        for (var x = 0; x < columns.length; x++) {
                            for (var y = 0; y < a_mostrar_columnas.length; y++) {
                                if (a_mostrar_columnas[y] == columns[x]) {
                                    var base = ' ' + data[i][Object.keys(data[i])[x]];
                                    a_mostrar_text = a_mostrar_text + base;
                                }
                            }
                        }
                        lista.append($compile('<div class="ac-item-list" ng-click="acSearchCtrl.selectItem(' + i + ')" ng-class="{\'ac-item-selected-list\': acSearchCtrl.acItemListPanelSelected == ' + i + '}">' + a_mostrar_text + '</div>')($scope));
                    }


                    // Selecciono Item de la lista
                    // Me muevo para abajo en la lista
                    if (event.keyCode == 40) {
                        vm.acItemListPanelSelected = (vm.acItemListPanelSelected + 1 > data.length - 1) ? vm.acItemListPanelSelected : vm.acItemListPanelSelected + 1;
                    }

                    // Me muevo para arriba en la lista
                    if (event.keyCode == 38) {
                        vm.acItemListPanelSelected = (vm.acItemListPanelSelected - 1 < 0) ? vm.acItemListPanelSelected : vm.acItemListPanelSelected - 1;
                    }

                    // selecciono
                    if (event.keyCode == 13) {
                        vm.selectItem(vm.acItemListPanelSelected);
                    }

                    // Agrego formatos bï¿½sicos para la lista
                    lista.css('position', 'absolute');
                    lista.css('top', ($element[0].offsetTop + $element[0].offsetHeight) + 'px');
                    lista.css('left', $element[0].offsetLeft + 'px');
                    lista.css('width', $element[0].offsetWidth + 'px');
                    lista.css('max-width', $element[0].offsetWidth + 'px');


                    // Me aseguro que no se oculte la lista
                    vm.over = true;
                }

                // Oculto la lista si no est? el mouse arriba y no tiene foco
                AcUtilsGlobals.listenPanel(function () {
                    if (vm.over) {
                        return;
                    }
                    var control = angular.element(document.querySelectorAll('.ac-result-panel'));
                    for (var i = 0; i < control.length; i++) {
                        control[i].remove();
                    }
                });

            },
            link: function (scope, element, attr) {


            },
            controllerAs: 'acSearchCtrl'
        };
    }


    AcUtilsController.$inject = [];
    function AcUtilsController() {
    }


    /**
     * Expone variables de control de la clase
     * @type {string[]}
     */
    AcUtilsGlobals.$inject = ['$rootScope'];
    function AcUtilsGlobals($rootScope) {
        this.isWaiting = false;
        this.sucursal_auxiliar_id = -1;
        // Cantidad mínima de caracteres para que se ejecute getByParams
        this.getByParamsLenght = 2;
        this.errores = [];

        this.broadcast = function () {
            $rootScope.$broadcast("AcUtilsGlobalsValidations")
        };
        this.listen = function (callback) {
            $rootScope.$on("AcUtilsGlobalsValidations", callback)
        };

        this.broadcastPanel = function () {
            $rootScope.$broadcast('acSearchPanels');
        };

        this.listenPanel = function (callback) {
            $rootScope.$on('acSearchPanels', callback);
        };
    }

    /**
     * Expone validaciones y otras herramientas de uso común
     * @type {string[]}
     */
    AcUtils.$inject = ['AcUtilsGlobals', '$document', '$timeout'];
    function AcUtils(AcUtilsGlobals, $document, $timeout) {
        var service = {};

        service.validateEmail = validateEmail;
        service.validations = validations;
        service.verifyBrowser = verifyBrowser;
        service.getByParams = getByParams;
        service.showMessage = showMessage;

        return service;


        /**
         * @description Retorna la lista filtrada de Carritos
         * @param params -> String, separado por comas (,) que contiene la lista de par?metros de b?squeda, por ej: nombre, sku
         * @param values
         * @param exact_match
         * @param data
         * @param callback
         */
        function getByParams(params, values, exact_match, data, callback) {

            if (data.length == 0) {
                return;
            }

            var parametros = params.split(',');
            var valores = values.split(',');
            var exactos = exact_match.split(',');


            var respuesta = [];
            for (var y = 0; y < data.length; y++) {
                var columns = Object.keys(data[y]);

                for (var i = 0; i < columns.length; i++) {
                    for (var x = 0; x < parametros.length; x++) {
                        if (columns[i] == parametros[x]) {

                            var base = '' + data[y][Object.keys(data[y])[i]];
                            var valor = (valores.length == 1) ? '' + valores[0] : '' + valores[x];
                            var exacto = (exactos.length == 1) ? exactos[0] : exactos[x];
                            exacto = exacto == 'true';
                            var negado = valor.indexOf('!') > -1;

                            // Indices para remover del array respuesta
                            var index_a_sacar = [];


                            if (negado) {

                                if (
                                    ( exacto && base.toUpperCase() !== valor.toUpperCase().replace('!', '')) ||
                                    (!exacto && base.toUpperCase().indexOf(valor.toUpperCase().replace('!', '')) == -1)
                                ) {
                                    respuesta.push(data[y]);
                                    x = parametros.length;
                                    i = columns.length;

                                } else {

                                    index_a_sacar.push(y);

                                }
                            } else {
                                if (
                                    ( exacto && base.toUpperCase() == valor.toUpperCase()) ||
                                    (!exacto && base.toUpperCase().indexOf(valor.toUpperCase()) > -1)
                                ) {
                                    respuesta.push(data[y]);
                                    x = parametros.length;
                                    i = columns.length;
                                }
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

        function showMessage(tipo, texto, timeout) {
            var body = $document.find('body').eq(0);

            var class_type = (tipo == 'error') ? 'ac-error-message' : 'ac-success-message';
            body.append('<div ' +
                'style="position: fixed; height: 100px; width: 250px; top:50%; left: calc(50% - 125px);" ' +
                'class="ac-mensaje-custom-show ' + class_type + '" ' +
                'id="ac-mensaje-custom" onclick="this.remove();">' + texto + '</div>');


            timeout = (timeout == undefined) ? 3000 : timeout;
            $timeout(function () {
                var el = angular.element(document.querySelector('#ac-mensaje-custom'));
                el.remove();
            }, timeout);
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