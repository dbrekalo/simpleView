(function(root, factory) {
    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.typeFactory = factory();
    }

}(this, function() {

    function each(obj, callback) {

        for (var key in obj) {
            obj.hasOwnProperty(key) && callback(obj[key], key);
        }

    }

    function transferProperties(out) {

        for (var i = 1; i < arguments.length; i++) {

            each(arguments[i], function(value, key) {
                typeof value !== 'undefined' && (out[key] = value);
            });

        }

        return out;

    }

    var optionsApi = {

        writeOptions: function(options) {

            var defaults = typeof this.defaults === 'function' ? this.defaults() : this.defaults;
            var ruleDefaults = {};

            this.optionRules && each(this.optionRules, function(data, optionName) {
                ruleDefaults[optionName] = data.default;
            });

            this.options = transferProperties({}, defaults, ruleDefaults, options);

        },

        validateOptions: function(options, rules) {

            var errors = [];

            each(rules, function(data, optionName) {

                var optionValue = options[optionName];
                var optionValueType = typeof optionValue;

                if (data.required !== false || optionValueType !== 'undefined') {

                    if (data.type && optionValueType !== data.type) {
                        errors.push('Option "' + optionName +'" is ' + optionValueType + ', expected ' + data.type + '.');
                    }

                    if (data.rule && !data.rule(optionValue)) {
                        errors.push('Option "' + optionName +'" breaks defined rule.');
                    }

                    if (data.instanceOf && !(optionValue instanceof data.instanceOf)) {
                        errors.push('Option "' + optionName +'" is not instance of defined constructor.');
                    }

                }

            });

            if (errors.length) {
                throw new Error(errors.join(' '));
            } else {
                return this;
            }

        }

    };

    function factory(parentType, prototypeProperties, staticProperties) {

        prototypeProperties = prototypeProperties || {};

        var generatedType = prototypeProperties.hasOwnProperty('constructor') ? prototypeProperties.constructor : function() {

            if (parentType) {

                parentType.apply(this, arguments);

            } else {

                if (this.assignOptions) {
                    this.writeOptions.apply(this, arguments);
                    this.optionRules && this.validateOptions(this.options, this.optionRules);
                }
                this.initialize && this.initialize.apply(this, arguments);

            }

        };

        if (parentType) {

            var Surrogate = function() { this.constructor = generatedType; };
            Surrogate.prototype = parentType.prototype;
            generatedType.prototype = new Surrogate();

            transferProperties(generatedType, parentType);

        } else {

            transferProperties(prototypeProperties, optionsApi);

        }

        staticProperties && transferProperties(generatedType, staticProperties);
        transferProperties(generatedType.prototype, prototypeProperties);

        return generatedType;

    }

    return function(prototypeProperties, staticProperties) {

        var createdType = factory(null, prototypeProperties, staticProperties);

        createdType.extend = function(prototypeProperties, staticProperties) {

            return factory(this, prototypeProperties, staticProperties);

        };

        return createdType;

    };

}));

(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.mitty = factory();
    }

}(this, function() {

    var api = {

        on: function(eventName, callback) {
            registerEvent(this, this, eventName, callback);
            return this;
        },

        listenTo: function(publisher, eventName, callback) {
            registerEvent(publisher, this, eventName, callback);
            this._mittyListenTo = this._mittyListenTo || [];
            indexOf(this._mittyListenTo, publisher) < 0 && this._mittyListenTo.push(publisher);
            return this;
        },

        off: function(eventName, callback) {
            removeFromPublisher(this, null, eventName, callback);
            return this;
        },

        stopListening: function(publisher, eventName, callback) {
            removeFromListener(this, publisher, eventName, callback);
            return this;
        },

        trigger: function(eventName, data) {
            this._mittyOn && each(this._mittyOn, function(item) {
                if (item.eventName === eventName) {
                    item.callback.call(item.listener, data);
                }
            });
            return this;
        }
    };

    function each(collection, callback) {

        if (collection instanceof Array) {
            for (var i = 0; i < collection.length; i++) {
                callback(collection[i], i);
            }
        } else {
            for (var key in collection) {
                collection.hasOwnProperty(key) && callback(key, collection[key]);
            }
        }

    }

    function indexOf(collection, objectToSearch) {

        if (Array.prototype.indexOf) {
            return collection.indexOf(objectToSearch);
        } else {
            for (var i = 0; i < collection.length; i++) {
                if (collection[i] === objectToSearch) {
                    return i;
                }
            }
            return -1;
        }

    }

    function registerEvent(publisher, listener, eventName, callback) {

        publisher._mittyOn = publisher._mittyOn || [];

        publisher._mittyOn.push({
            listener: listener,
            eventName: eventName,
            callback: callback
        });

    }

    function removeFromPublisher(publisher, listener, eventName, callback) {

        if (publisher._mittyOn && publisher._mittyOn.length) {

            var criteria = {},
            temp = [];

            listener && (criteria.listener = listener);
            callback && (criteria.callback = callback);
            eventName && (criteria.eventName = eventName);

            each(publisher._mittyOn, function(item) {

                var shouldRemove = true;

                each(criteria, function(name, ref) {
                    if (item[name] !== ref) {
                        shouldRemove = false;
                    }
                });

                !shouldRemove && temp.push(item);

            });

            publisher._mittyOn = temp;

        }

    }

    function containsListener(publisher, listener) {

        if (publisher._mittyOn) {
            for (var i = 0; i < publisher._mittyOn.length; i++) {
                if (publisher._mittyOn[i].listener === listener) {
                    return true;
                }
            }
        }
        return false;

    }

    function removeFromListener(listener, publisher, eventName, callback) {

        var listening = listener._mittyListenTo && listener._mittyListenTo.length > 0;

        if (publisher && listening) {

            removeFromPublisher(publisher, listener, eventName, callback);

            if (!containsListener(publisher, listener)) {
                listener._mittyListenTo.splice(indexOf(listener._mittyListenTo, publisher), 1);
            }

        } else if (listening) {

            each(listener._mittyListenTo, function(item) {
                removeFromPublisher(item, listener);
            });
            listener._mittyListenTo = [];

        }

    }

    return function(objectToExtend) {

        each(api, function(methodName, method) {
            objectToExtend[methodName] = method;
        });

        return objectToExtend;

    };

}));

(function(root, factory) {

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['type-factory', 'mitty', 'jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('type-factory'), require('mitty'), require('jquery'));
    } else {
        root.SimpleView = factory(root.typeFactory, root.mitty, root.jQuery);
    }

}(this, function(typeFactory, mitty, $) {

    var viewCounter = 0;
    var variableInEventStringRE = /{{\s*(\S+)\s*}}/g;
    var parseEventVariables = function(eventString, context) {

        return eventString.replace(variableInEventStringRE, function(match, namespace) {

            var current = context;
            var pieces = namespace.slice(5).split('.');

            for (var i in pieces) {
                current = current[pieces[i]];
                if (typeof current === 'undefined') {
                    throw new Error('Undefined variable in event string');
                }
            }

            return current;

        });

    };

    var specialSelectors = {
        'document': window.document,
        'window': window
    };

    var View = typeFactory({

        delegatedEvents: true,
        parseEventVariables: true,

        constructor: function(options) {

            this.cid = 'view' + (++viewCounter);

            if (options && options.$el) {
                this.$el = options.$el instanceof $ ? options.$el : $(options.$el).eq(0);
                delete options.$el;
            }

            if (this.assignOptions) {
                this.writeOptions.apply(this, arguments);
                this.optionRules && this.validateOptions(this.options, this.optionRules);
            }

            this.beforeInitialize && this.beforeInitialize.apply(this, arguments);
            this.initialize && this.initialize.apply(this, arguments);

            this.events && this.$el && this.setupEvents();

        },

        setupEvents: function(eventsMap) {

            var eventsProvider = eventsMap || this.events;
            var eventList = typeof eventsProvider === 'function' ? eventsProvider.call(this) : eventsProvider;
            var self = this;

            if (eventList) {

                var eventNamespace = this.ens = this.ens || '.' + this.cid;

                $.each(eventList, function(eventString, handler) {

                    if (self.parseEventVariables) {
                        eventString = parseEventVariables(eventString, self);
                    }

                    var isOneEvent = eventString.indexOf('one:') === 0;
                    var splitEventString = (isOneEvent ? eventString.slice(4) : eventString).split(' ');
                    var eventName = splitEventString[0] + eventNamespace;
                    var eventSelector = splitEventString.slice(1).join(' ');
                    var $el = self.$el;

                    if (specialSelectors[eventSelector]) {
                        $el = self['$' + eventSelector] = self['$' + eventSelector] || $(specialSelectors[eventSelector]);
                        eventSelector = undefined;
                    } else if (!self.delegatedEvents) {
                        (self.elementsWithBoundEvents = self.elementsWithBoundEvents || []).push($el = $el.find(eventSelector));
                        eventSelector = undefined;
                    }

                    $el[isOneEvent ? 'one' : 'on'](eventName, eventSelector, function() {
                        (typeof handler === 'function' ? handler : self[handler]).apply(self, arguments);
                    });

                });

            }

            return this;

        },

        removeEvents: function() {

            var eventNamespace = this.ens;

            if (eventNamespace) {

                this.$el && this.$el.off(eventNamespace);
                this.$document && this.$document.off(eventNamespace);
                this.$window && this.$window.off(eventNamespace);

                if (this.elementsWithBoundEvents) {
                    $.each(this.elementsWithBoundEvents, function(i, el) {
                        $(el).off(eventNamespace);
                    });
                    delete this.elementsWithBoundEvents;
                }

                delete this.dismissListeners;

            }

            return this;

        },

        addDismissListener: function(listenerName, options) {

            var self = this;

            if (!listenerName) {
                throw new Error('Dismiss listener name not speficied');
            }

            options = $.extend({$el: this.$el}, options);

            this.$document = this.$document || $(document);
            this.ens = this.ens || '.' + this.cid;
            this.dismissListeners = this.dismissListeners || {};

            if (!this.dismissListeners[listenerName]) {

                this.dismissListeners[listenerName] = function(e) {

                    if (e.keyCode === 27 || (!$(e.target).is(options.$el) && !$.contains(options.$el.get(0), e.target))) {
                        self[listenerName].call(self);
                    }

                };

                this.$document.on('click' + this.ens + ' keyup' + this.ens, this.dismissListeners[listenerName]);

            }

            return this;

        },

        removeDismissListener: function(listenerName) {

            if (!listenerName) {
                throw new Error('Name of dismiss listener to remove not specified');
            }

            if (this.dismissListeners && this.dismissListeners[listenerName]) {
                this.$document.off('click keyup', this.dismissListeners[listenerName]);
                delete this.dismissListeners[listenerName];
            }

            return this;

        },

        remove: function() {

            this.trigger('beforeRemove');
            this.removeEvents().removeViews();
            this.$el && this.$el.remove();
            this.trigger('afterRemove');
            this.off().stopListening();

            return this;

        },

        addView: function(view) {

            this.views = this.views || {};
            this.views[view.cid] = view;

            this.listenTo(view, 'afterRemove', function() {
                delete this.views[view.cid];
            });

            return view;

        },

        mapView: function(selector, View, params) {

            var $el = (typeof selector === 'string' ? this.$(selector) : $(selector)).eq(0);

            return $el.length ? this.addView(new View($.extend({$el: $el}, params))) : undefined;

        },

        mapViews: function(selector, View, params) {

            var self = this;
            var $elements = typeof selector === 'string' ? this.$(selector) : $(selector);

            return $elements.map(function(i, el) {

                return self.addView(new View($.extend({$el: $(el)}, params)));

            }).get();

        },

        removeViews: function() {

            this.views && $.each(this.views, function(id, view) {
                view.remove();
            });

            delete this.views;

            return this;

        },

        $: function(selector) {

            return this.$el.find(selector);

        }

    });

    mitty(View.prototype);

    return View;

}));
