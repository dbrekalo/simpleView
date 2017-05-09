var assert = require('chai').assert;
var $ = require('jquery');
var BaseView = require('../');

var $el;

beforeEach(function() {
    $('body').html(
        '<div class="guestbook">' +
            '<form>' +
                '<input class="entryInput" placeholder="Type here..." type="text">' +
                '<button type="submit">+</button>' +
            '</form>' +
            '<div class="entryList"></div>' +
        '</div>'
    );
    $el = $('.guestbook');
});

describe('SimpleView constructor', function() {

    it('produces instance and assigns client id property', function() {

        var view = new BaseView();
        assert.instanceOf(view, BaseView);
        assert.isString(view.cid);

    });

    it('assigns dom reference when one is given', function() {

        var view1 = new BaseView({$el: $el});
        var view2 = new BaseView({$el: '.guestbook'});

        assert.strictEqual(view1.$el, $el);
        assert.strictEqual(view2.$el.get(0), $el.get(0));

    });

    it('assigns defaults to options', function() {

        var View = BaseView.extend({
            assignOptions: true,
            defaults: {test: true}
        });

        var view = new View({$el: $el});

        assert.deepEqual(view.options, {test: true});

    });

    it('assigns deep extended options', function() {

        var View = BaseView.extend({
            assignOptions: 'deep',
            defaults: {tree: {branch: {leaf1: true}}}
        });

        var view = new View({
            $el: $el,
            tree: {branch: {leaf2: false}}
        });

        assert.deepEqual(view.options, {tree: {branch: {leaf1: true, leaf2: false}}});

    });

    it('calls initialize when view is created, passes arguments and removes $el reference', function() {

        var View = BaseView.extend({
            initialize: function(options, secondParameter) {
                this.options = options;
                this.secondParameter = secondParameter;
            }
        });

        var view = new View({$el: $el, testOption: true}, 'test');

        assert.deepEqual(view.options, {testOption: true});
        assert.equal(view.secondParameter, 'test');

    });

    it('calls beforeInitialize hook before initialize', function() {

        var options = {testOption: true};

        var View = BaseView.extend({
            beforeInitialize: function(options) {
                this.options = options;
            },
            initialize: function(options) {
                this.options = this.options || {};
            }
        });

        var view = new View(options);

        assert.deepEqual(view.options, options);

    });

});

describe('SimpleView events', function() {

    it('can be defined as function or pointer to view function', function(done) {

        var View = BaseView.extend({
            events: {
                'submit form': 'submitForm',
                'click form': function() {
                    this.formIsClicked = true;
                },
            },
            submitForm: function(e) {
                e.preventDefault();
                this.formIsSubmited = true;
            }
        });

        var view = new View({$el: $el});

        $el.find('form').trigger('submit').trigger('click');

        setTimeout(function() {
            assert.isTrue(view.formIsSubmited);
            assert.isTrue(view.formIsClicked);
            done();
        }, 100);

    });

    it('can be defined from hash produced by function', function(done) {

        var View = BaseView.extend({
            events: function() {
                return {'submit form': 'submitForm'};
            },
            submitForm: function(e) {
                e.preventDefault();
                this.formIsSubmited = true;
            }
        });

        var view = new View({$el: $el});

        $el.find('form').trigger('submit');

        setTimeout(function() {
            assert.isTrue(view.formIsSubmited);
            done();
        }, 100);

    });

    it('can be defined as one time events', function(done) {

        var clickCounter = 0;

        var View = BaseView.extend({
            events: {
                'one:click form': function(e) {
                    e.preventDefault();
                    clickCounter++;
                }
            }
        });

        new View({$el: $el});

        $el.find('form').trigger('click').trigger('click').trigger('click');

        setTimeout(function() {
            assert.equal(clickCounter, 1);
            done();
        }, 100);

    });

    it('can be defined with injected instance variables', function(done) {

        var View = BaseView.extend({
            initialize: function() {
                this.formSelector = 'form';
            },
            events: {
                'submit {{this.formSelector}}': function(e) {
                    e.preventDefault();
                    this.formIsSubmited = true;
                }
            }
        });

        var view = new View({$el: $el});

        $el.find('form').trigger('submit');

        setTimeout(function() {
            assert.isTrue(view.formIsSubmited);
            done();
        }, 100);

    });

    it('can be defined with injected global variables', function(done) {

        window.formSelector = 'form';

        var View = BaseView.extend({
            events: {
                'submit {{formSelector}}': function(e) {
                    e.preventDefault();
                    this.formIsSubmited = true;
                }
            }
        });

        var view = new View({$el: $el});

        $el.find('form').trigger('submit');

        window.formSelector = undefined;

        setTimeout(function() {
            assert.isTrue(view.formIsSubmited);
            done();
        }, 100);

    });

    it('throws error when injected variable is not defined', function() {

        var View1 = BaseView.extend({
            events: {
                'submit {{formSelector}}': function() {}
            }
        });

        var View2 = BaseView.extend({
            events: {
                'submit {{this.formSelector}}': function() {}
            }
        });

        assert.throws(function() {
            new View1({$el: $el});
        });

        assert.throws(function() {
            new View2({$el: $el});
        });

    });

    it('are bound directly when delegated events are set to false', function(done) {

        var View = BaseView.extend({
            delegatedEvents: false,
            events: {
                'submit form': function(e) {
                    e.preventDefault();
                    assert.strictEqual(e.delegateTarget, $el.find('form').get(0));
                    done();
                }
            }
        });

        new View({$el: $el});

        $el.find('form').trigger('submit');

    });

    it('are properly handled when called with special selectors (window or document)', function(done) {

        var View = BaseView.extend({
            events: {
                'resize window': function(e) {
                    this.windowIsResized = true;
                },
                'click document': function(e) {
                    this.documentIsClicked = true;
                }
            }
        });

        var view = new View({$el: $el});

        $(document).trigger('click');
        $(window).trigger('resize');

        setTimeout(function() {
            assert.isTrue(view.windowIsResized);
            assert.isTrue(view.documentIsClicked);
            done();
        }, 100);

    });

    it('can be removed and cleaned up', function(done) {

        var View = BaseView.extend({
            delegatedEvents: false,
            events: {
                'click form': function(e) {
                    e.preventDefault();
                    this.formIsClicked = true;
                },
                'resize window': function(e) {
                    this.windowIsResized = true;
                },
                'click document': function(e) {
                    this.documentIsClicked = true;
                }
            }
        });

        var view = new View({$el: $el});

        view.removeEvents();

        $el.find('form').trigger('click');
        $(document).trigger('click');
        $(window).trigger('resize');

        setTimeout(function() {
            assert.isUndefined(view.formIsClicked);
            assert.isUndefined(view.windowIsResized);
            assert.isUndefined(view.documentIsClicked);
            done();
        }, 100);

    });

});

describe('SimpleView utilities', function() {

    it('uses $ as alias for view element find', function() {

        var view = new BaseView({$el: $el});
        var formElement = $el.find('form').get(0);
        var viewFormElement = view.$('form').get(0);

        assert.strictEqual(viewFormElement, formElement);

    });

    it('provides addDeferred method for registering deferreds', function() {

        var view = new BaseView({$el: $el});
        var deferred = $.Deferred();
        var returnValue = view.addDeferred(deferred);

        assert.equal(view.deferreds.length, 1);
        assert.strictEqual(returnValue, deferred);

    });

    it('provides abortDeferreds method for canceling all pending deferreds', function() {

        var view = new BaseView({$el: $el});
        var deferred = $.Deferred();
        var anotherDeferred = $.Deferred();

        anotherDeferred.abort = function() {};

        view.when([deferred, anotherDeferred, true, 5, {}], function() {
            this.deferredsDone = true;
        });

        view.abortDeferreds();

        deferred.resolve();

        assert.isUndefined(view.deferredsDone);

    });

    describe('provides when method as $.when syntax sugar', function() {

        it('accepts single deferred and done callback', function(done) {

            var view = new BaseView({$el: $el});
            var deferred = $.Deferred();

            var returnValue = view.when(deferred, function() {
                assert.strictEqual(this, view);
                done();
            });

            assert.isFunction(returnValue.done);
            deferred.resolve();

        });

        it('accepts array of deferreds and done callback', function(done) {

            var view = new BaseView({$el: $el});
            var deferred = $.Deferred();

            view.when([deferred, true, 5, {}], function() {
                assert.strictEqual(this, view);
                done();
            });

            deferred.resolve();

        });

        it('accepts single deferred and fail callback', function(done) {

            var view = new BaseView({$el: $el});
            var deferred = $.Deferred();

            view.when(deferred, undefined, function() {
                assert.strictEqual(this, view);
                done();
            });

            deferred.reject();

        });

    });

});

describe('SimpleView subviews', function() {

    it('can be added to parent registry', function() {

        var ParentView = BaseView.extend({});
        var ChildView = BaseView.extend({});

        var parentView = new ParentView({$el: $el});
        var childView = parentView.addView(new ChildView({$el: parentView.$('form')}));

        assert.strictEqual(childView, parentView.views[childView.cid]);

    });

    it('can be removed by parent', function() {

        var parentView = new BaseView({$el: $el});

        parentView.addView(new BaseView({$el: parentView.$('form')}));
        parentView.removeViews();

        assert.isUndefined(parentView.views);

    });

    it('can be removed by child remove call', function() {

        var parentView = new BaseView({$el: $el});
        var childView = parentView.addView(new BaseView({$el: parentView.$('form')}));

        childView.remove();

        assert.isUndefined(parentView.views[childView.cid]);

    });

    it('maps single view and returns instance', function() {

        var ParentView = BaseView.extend({});
        var ChildView = BaseView.extend({
            initialize: function(options) {
                this.options = options;
            }
        });

        var parentView = new ParentView({$el: $el});
        var childOptions = {test: true};

        var childView = parentView.mapView('form', ChildView, childOptions);
        var undefinedChildView = parentView.mapView($('.undefinedClass'), ChildView);

        assert.deepEqual(childView.options, childOptions);
        assert.isTrue(childView.$el.is('form'));
        assert.strictEqual(childView, parentView.views[childView.cid]);
        assert.isUndefined(undefinedChildView);

    });

    it('maps multiple views and returns view instances as array', function() {

        var ParentView = BaseView.extend({});
        var ChildView = BaseView.extend({
            initialize: function(options) {
                this.options = options;
            }
        });

        var parentView = new ParentView({$el: $el});
        var childOptions = {test: true};
        var childViews = parentView.mapViews('form', ChildView, childOptions);
        var undefinedChildViews = parentView.mapViews($('.undefinedClass'), ChildView, childOptions);

        assert.deepEqual(childViews[0].options, childOptions);
        assert.strictEqual(childViews[0], parentView.views[childViews[0].cid]);
        assert.lengthOf(undefinedChildViews, 0);

    });

    it('maps multiple views with async view provider', function(done) {

        var ParentView = BaseView.extend({});
        var ChildView = BaseView.extend({
            initialize: function(options) {
                this.options = options;
            }
        });

        var parentView = new ParentView({$el: $el});

        var firstDeferred = parentView.mapViewsAsync('form', function(viewProvider) {
            viewProvider(ChildView);
        }).done(function(childViews) {
            assert.strictEqual(childViews[0], parentView.views[childViews[0].cid]);
        });

        var secondDeferred = parentView.mapViewsAsync($('.undefinedClass'), function(viewProvider) {
            viewProvider(ChildView);
        }).done(function(childViews) {
            assert.lengthOf(childViews, 0);
        });

        $.when(firstDeferred, secondDeferred).done(function() {
            done();
        });

    });

});
