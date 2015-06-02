;(function($){

	"use strict";

	$.wk = $.wk || {};

	var instanceCounter = 0,
		require = $.wk.repo && $.wk.repo.require;

	var view = function(options){

		this.cid = 'view' + (++instanceCounter);
		this.ens = '.' + this.cid;
		this.el && (this.$el = $(this.el));

		if (options) {

			if (options.$el) {
				this.$el =  options.$el;
				delete options.$el;
			}

			if (options.el) {
				this.$el =  $(options.el);
				delete options.el;
			}

		}

		this.$el && this.events && this.delegateEvents();

		this.initialize && this.initialize.apply(this, arguments);

	};

	$.extend(view.prototype, {

		$: function(selector){

			return this.$el.find(selector);

		},

		close: function(){

			this.beforeClose && this.beforeClose();
			this.$el && this.$el.remove();
			this.afterClose && this.afterClose();

		},

		delegateEvents: function(){

			var self = this;

			$.each(this.events, function(eventString, handler){

				var temp = eventString.split(' '),
					eventName = temp[0] + self.ens,
					eventSelector = $.trim(eventString.slice(temp[0].length));

				self.$el.on(eventName, eventSelector, $.proxy(typeof handler === 'function' ? handler : self[handler], self));

			});

		},

		require: function(key, callback, context){

			var deferred = require(key, callback, context || this);

			deferred.baseViewDeferred = 'require: '+ key;
			this.deferreds = this.deferreds || [];
			this.deferreds.push(deferred);

			return deferred;

		}

	});

	view.extend = function(viewDefinitions){

		var parent = this;

		var extendedView = viewDefinitions.hasOwnProperty('constructor') ? viewDefinitions.constructor : function() {
		    parent.apply(this, arguments);
		};

		var Surrogate = function() { this.constructor = extendedView; };
		Surrogate.prototype = parent.prototype;
		extendedView.prototype = new Surrogate();

		$.extend(extendedView.prototype, viewDefinitions);

		return $.extend(extendedView, parent);

	};

	$.wk.simpleView = view;

})(window.jQuery || window.Zepto);