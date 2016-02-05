(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.typeFactory = factory();
    }

}(this, function() {

    function transferProperties(destination, source) {

        for (var key in source) {
            source.hasOwnProperty(key) && (destination[key] = source[key]);
        }

        return destination;

    }

    function factory(parentType, prototypeProperties, staticProperties) {

        var generatedType = prototypeProperties.hasOwnProperty('constructor') ? prototypeProperties.constructor : function() {

            if (parentType) {
                parentType.apply(this, arguments);
            } else {
                this.initialize && this.initialize.apply(this, arguments);
            }

        };

        if (parentType) {

            var Surrogate = function() { this.constructor = generatedType; };
            Surrogate.prototype = parentType.prototype;
            generatedType.prototype = new Surrogate();

            transferProperties(generatedType, parentType);
        }

        staticProperties && transferProperties(generatedType, staticProperties);
        prototypeProperties && transferProperties(generatedType.prototype, prototypeProperties);

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

    if (typeof define === 'function' && define.amd) {
        define(['type-factory', 'mitty', 'jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('type-factory'), require('mitty'), require('jquery'));
    } else {
        root.SimpleView = factory(root.typeFactory, root.mitty, root.jQuery);
    }

}(this, function(typeFactory, mitty, $) {

    var viewCounter = 0,
        variableInEventStringRE = /{{(\S+)}}/g,
        parseEventString = function(eventString, context) {

            return eventString.replace(variableInEventStringRE, function(match, namespace) {

                var isInCurrentContext = namespace.indexOf('this.') === 0,
                    current = isInCurrentContext ? context : window,
                    pieces = (isInCurrentContext ? namespace.slice(5) : namespace).split('.');

                for (var i in pieces) {
                    current = current[pieces[i]];
                    if (typeof current === 'undefined') {
                        throw new Error('Undefined variable in event string');
                    }
                }

                return current;

            });

        };

    var View = typeFactory({

        delegatedEvents: true,

        constructor: function(options) {

            this.cid = 'view' + (++viewCounter);

            if (options && options.$el) {
                this.$el = options.$el instanceof $ ? options.$el : $(options.$el).eq(0);
                delete options.$el;
            }

            this.beforeInitialize && this.beforeInitialize.apply(this, arguments);
            this.initialize && this.initialize.apply(this, arguments);

            this.events && this.$el && this.setupEvents();

        },

        setupEvents: function() {

            var eventNamespace = this.ens = this.ens || '.' + this.cid,
                self = this,
                specialSelectors = {
                    'document': window.document,
                    'window': window
                };

            $.each(typeof this.events === 'function' ? this.events() : this.events, function(eventString, handler) {

                eventString = parseEventString(eventString, self);

                var isOneEvent = eventString.indexOf('one:') === 0,
                    splitEventString = (isOneEvent ? eventString.slice(4) : eventString).split(' '),
                    eventName = splitEventString[0] + eventNamespace,
                    eventSelector = splitEventString.slice(1).join(' '),
                    $el = self.$el;

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
                    this.elementsWithBoundEvents = null;
                }

            }

            return this;

        },

        remove: function() {

            this.trigger('beforeRemove');
            this.removeEvents().abortDeferreds().removeViews();
            this.$el && this.$el.remove();
            this.trigger('afterRemove');
            this.off().stopListening();

            return this;

        },

        addDeferred: function(deferred) {

            this.deferreds = this.deferreds || [];

            if (!Array.prototype.indexOf || this.deferreds.indexOf(deferred) < 0) {
                this.deferreds.push(deferred);
            }

            return deferred;

        },

        abortDeferreds: function() {

            this.deferreds && $.each(this.deferreds, function(i, deferred) {

                if (typeof deferred === 'object' && deferred.state && deferred.state() === 'pending') {
                    deferred.abort ? deferred.abort() : deferred.reject();
                }

            });

            delete this.deferreds;

            return this;

        },

        when: function(resources, callbackDone, callbackFail) {

            var self = this;

            $.each(resources = $.isArray(resources) ? resources : [resources], function(i, resource) {
                self.addDeferred(resource);
            });

            return $.when.apply(window, resources)
                .done($.proxy(callbackDone, this))
                .fail($.proxy(callbackFail, this));

        },

        addView: function(view) {

            this.views = this.views || {};
            this.views[view.cid] = view;

            this.listenTo(view, 'afterRemove', function() {
                delete this.views[view.cid];
            });

            return view;

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
