#Simple view
Lightweight javascript view component boilerplate (Api similar to Backbone view).

##Basic usage
```javascript
app.components.searchItem = app.view.extend({

	initialize: function(options){

		this.url = options.url;

	},

	events: {
		'keyup .input' : 'getResults',
		'click .toggleBtn' : 'toggle'
	},

	toggle: function(e){

		this.$el.toggleClass('active');

	},

	getResults: function(){

		$.get(this.url, this.$el.serializeArray(), this.showResults.bind(this));

	},

	showSearchResults: function(data){

		this.$searchResults = this.$searchResults || $('ul').appendTo(this.$el);
		this.$searchResults.html(data);

	}


});

new app.components.searchItem({el: $('.searchItem')});
```
##Api
###extend
```javascript
extend(definitions)
```
Use to define components. Returns component conctructor function. Definitions define component prototype functions and properties.

###initialize
```javascript
initialize(options)
```
Optional function that can handle parameteres that were given to component contructor

###$
```javascript
$(selector)
```
Alias for this.$el.find(selector);

###events
```javascript
events: {}
```
Optional event hash used to delegate events and handlers to component dom element. ({'click .title': 'openItem'})

###delegateEvents
```javascript
delegateEvents()
```
Can be called if component dom element is set during runtime.

###require
```javascript
require(key, callback, context)
```
Requires resource according to [repository](https://github.com/dbrekalo/repository) documentation.
After resources under key have been loaded / resolved executes callback if one is provided. Default context is component object.

###close
```javascript
close
```
Removes view component

##Installation
Plugin is initially in $.wk.simpleView namespace. Alias is to your desired namespace (app.view = $.wk.simpleView);
