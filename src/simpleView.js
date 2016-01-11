(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(['type-factory', 'jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('type-factory'), require('jquery'));
    } else {
        root.SimpleView = factory(typeFactory, jQuery);
    }

}(this, function(typeFactory, $) {

    var viewCounter = 0;

    return typeFactory({

        delegatedEvents: true,

        constructor: function(options) {

            this.cid = 'view' + (++viewCounter);

            if (options && options.$el) {
                this.$el = options.$el instanceof $ ? options.$el : $(options.$el).eq(0);
                delete options.$el;
            }

            this.events && this.$el && this.setupEvents();
            this.initialize && this.initialize.apply(this, arguments);

        },

        setupEvents: function() {

            var eventNamespace = this.ens = this.ens || '.' + this.cid,
                self = this,
                specialSelectors = {
                    'document': document,
                    'window': window
                };

            $.each(typeof this.events === 'function' ? this.events() : this.events, function(eventString, handler) {

                var isOneEvent = eventString.indexOf('one:') === 0,
                    splitEventString = (isOneEvent ? eventString.slice(4) : eventString).split(' '),
                    eventName = splitEventString[0] + eventNamespace,
                    eventSelector   = splitEventString.slice(1).join(' '),
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

        },

        removeEvents: function() {

            var eventNamespace = this.ens;

            if (eventNamespace) {

                this.$el.off(eventNamespace);
                this.$document && this.$document.off(eventNamespace);
                this.$window && this.$window.off(eventNamespace);

                if (this.elementsWithBoundEvents) {
                    $.each(this.elementsWithBoundEvents, function(i, el) {
                        $(el).off(eventNamespace);
                    });
                    this.elementsWithBoundEvents = null;
                }

            }

        },

        remove: function() {

            this.beforeRemove && this.beforeRemove();
            this.removeEvents();
            this.$el.remove();
            this.afterRemove && this.afterRemove();

        },

        $: function(selector) {

            return this.$el.find(selector);

        }

    });

}));
