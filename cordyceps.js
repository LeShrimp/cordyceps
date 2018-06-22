/**
 * A little react/redux inspired mini-framework without the huge setup, intended to run with jQuery.
 */
var NoRecurseWrapper = function (obj) {
    this.wrappedObj = obj;
};

var cordyceps = function(initState, debug) {
    var isObject = function(obj) {
       return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
    };

    var addToPropertyPath = function(path, key) {
        var res;

        if (!path) {
            res = key;
        } else {
            res = path + '.' + key;
        }

        return res;
    };

    var defaultsDeep = function(target, source, currentPath) {
        if (currentPath === undefined) {
            currentPath = '';
        }

        if (isObject(target) && isObject(source)) {
            for (var key in source) {
                if (source.hasOwnProperty(key)) {

                    if (target[key] === undefined) {
                        target[key] = source[key];
                    } else if (!isNoRecurseProperty(currentPath)) {
                        // Note that defaultsDeep will only do something if both arguments are objects
                        defaultsDeep(target[key], source[key], addToPropertyPath(currentPath, key));
                    }

                }
            }
        }

        return target;
    };

    // Defer execution of f until current call stack terminates
    var defer = function (f) {
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(f);
        } else {
            setTimeout(f, 0);
        }
    };

    var updateState = function(newState, dumpOldState) {
        var oldState = state;

        if (debug) {
            logUpdate(newState, dumpOldState);
        }

        if (dumpOldState) {
            state = newState;
        } else {
            state = defaultsDeep(newState, state);
        }

        for (var i in infectedElements) {
            var ie = infectedElements[i];

            var $newEl = ie.fungus.onStateChange(ie.$element, state, oldState);
            if ($newEl instanceof jQuery) {
                ie.$element.replaceWith($newEl);
                ie.$element = $newEl;
            }
        }

        return this;
    };


    var logUpdate = function(newState, dumpOldState) {
        var recursiveLog = function(partialState, currentPath) {
            if (!isObject(partialState) || isNoRecurseProperty(currentPath)) {
                var t = ' * ' + currentPath + ' -> ';
                if (Array.isArray(partialState)) {
                    t += '[ ... ]';
                } else if (isObject(partialState)) {
                    t += '{ ... }';
                } else if (partialState === undefined) {
                    t += 'undefined';
                } else if (partialState.toString) {
                    t += partialState.toString();
                }
                console.log(t);
            } else {
                for (var key in partialState) {
                    recursiveLog(partialState[key], addToPropertyPath(currentPath, key));
                }
            }
        };

        if (dumpOldState) {
            console.log('Dump old state.');
        }
        console.log('Update properties:');

        recursiveLog(newState, '');

        console.log('---');
    };


    var registerFungus = function(name, fungusConstructor) {
        if (typeof name !== 'string') {
            throw new Error('Invalid name for Fungus.');
        }
        if (name in registeredFungi) {
            throw new Error('Fungus with name ' + name + ' does already exist.');
        }
        
        registeredFungi[name] = fungusConstructor;
    };


    var newFungus = function(name, definition) {
        defaultsDeep(definition, {
            onInit: definition.onInit || function($host, newState) {
                return this.onStateChange($host, newState, undefined)
            },
            onStateChange: definition.onStateChange || function() {}
        });

        var fungusConstructor = new Function();
        defaultsDeep(fungusConstructor.prototype, definition);
        registerFungus(name, fungusConstructor);

        return this;
    };


    var infectAll = function($container) {
        if ($container === undefined) {
            $container = $(document);
        }

        for (var name in registeredFungi) {
            var $infectedEls = $container.find("[data-cordyceps-infected-by='" + name + "']");

            $infectedEls.each(function() {
                var $this = $(this);

                // Prevent multiple initialization
                $this.removeAttr('data-cordyceps-infected-by');

                var newInfectedElement = {
                    $element: $this,
                    fungus: new registeredFungi[name]
                };

                var $newEl = newInfectedElement.fungus.onInit($this, state);
                if ($newEl instanceof jQuery) {
                    newInfectedElement.$element.replaceWith($newEl);
                    newInfectedElement.$element = $newEl;
                }

                infectedElements.push(newInfectedElement);
            });

            if (debug) {
                console.log('Infected ' + $infectedEls.length + ' Element(s) with Fungus "' + name + '"');
            }
        }

        return this;
    };


    var noRecurseProps = {};
    var processInitState = function(initState, currentPath) {
        if (!isObject(initState)) {
            return initState;
        }

        if (initState instanceof NoRecurseWrapper) {
            noRecurseProps[currentPath] = true;
            return initState.wrappedObj;
        }

        if (currentPath === undefined) {
            currentPath = '';
        }

        var state = {};

        for (var key in initState) {
            state[key] = processInitState(initState[key], addToPropertyPath(currentPath, key));
        }

        return state;
    };

    var isNoRecurseProperty = function(path) {
        return noRecurseProps[path] === true;
    };

    var registeredFungi = {};
    var infectedElements = [];
    var state = processInitState(initState);


    return {
        newFungus: newFungus,
        updateState: function(newState) {
            // Wait until current call stack finishes
            defer(function () { updateState(newState) });
        },
        getState: function() { return state; },
        infectAll : infectAll
    }
};

cordyceps.NoRecurseWrapper = NoRecurseWrapper;

module.exports = cordyceps;
