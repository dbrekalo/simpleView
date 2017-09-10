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
