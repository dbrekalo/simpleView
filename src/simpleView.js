(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(['type-factory', 'mitty', 'jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('type-factory'), require('mitty'), require('jquery'));
    } else {
        root.SimpleView = factory(root.typeFactory, root.mitty, root.jQuery);
    }

}(this, function(typeFactory, mitty, $) {

    var viewCounter = 0;

    var View = typeFactory({

        delegatedEvents: true,

        constructor: function(options) {

            this.cid = 'view' + (++viewCounter);

            if (options && options.$el) {
                this.$el = options.$el instanceof $ ? options.$el : $(options.$el).eq(0);
                delete options.$el;
            }

            this.events && this.$el && this.setupEvents();

            this.beforeInitialize && this.beforeInitialize.apply(this, arguments);
            this.initialize && this.initialize.apply(this, arguments);

        },

        setupEvents: function() {

            var eventNamespace = this.ens = this.ens || '.' + this.cid,
                self = this,
                specialSelectors = {
                    'document': window.document,
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

            return this;

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

            return this;

        },

        remove: function() {

            this.trigger('beforeRemove');
            this.removeEvents().abortDeferreds().removeViews();
            this.$el.remove();
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
