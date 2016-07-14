var assert = require("chai").assert;
var jsdom = require('jsdom').jsdom;

var document = global.document = jsdom('<body></body>');
var window = global.window = document.defaultView;

var $ = require('jquery');
var BaseView = require("../");
var $el;

beforeEach(function () {
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

describe("SimpleView constructor", function() {

    it('produces instance and assigns client id property', function() {

        var view = new BaseView();
        assert.instanceOf(view, BaseView);
        assert.isDefined(view.cid);

    });

    it('assigns dom reference when one is given', function() {

        var view1 = new BaseView({$el: $el});
        var view2 = new BaseView({$el: '.guestbook'});

        assert.strictEqual(view1.$el, $el);
        assert.strictEqual(view2.$el.get(0), $el.get(0));

    });

    it('allows views to be extended', function() {

        var View1 = BaseView.extend({});
        var View2 = View1.extend({});

        var view1 = new View1();
        var view2 = new View2();

        assert.instanceOf(view1, BaseView);
        assert.instanceOf(view1, View1);
        assert.instanceOf(view2, BaseView);
        assert.instanceOf(view2, View1);
        assert.instanceOf(view2, View2);

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

describe("SimpleView events", function() {

    it('can be defined as function or pointer to type function', function() {

        var View = BaseView.extend({
            events: {
                'submit form': 'submitForm',
                'click form': function() {
                    this.formIsClicked = true;
                },
            },
            submitForm: function() {
                this.formIsSubmited = true;
            }
        });

        var view = new View({$el: $el});

        $el.find('form').trigger('submit').trigger('click');

        assert.isTrue(view.formIsSubmited);
        assert.isTrue(view.formIsClicked);

    });

    it('can be defined from hash produced by function', function() {

        var View = BaseView.extend({
            events: function() {
                return {'submit form': 'submitForm'};
            },
            submitForm: function(e) {
                this.formIsSubmited = true;
            }
        });

        var view = new View({$el: $el});

        $el.find('form').trigger('submit');

        assert.isTrue(view.formIsSubmited);

    });

    it('can be defined as one time events', function() {

        var View = BaseView.extend({
            events: {
                'one:submit form': function(e) {
                    this.formSubmitCounter = this.formSubmitCounter || 0;
                    this.formSubmitCounter++;
                }
            }
        });

        var view = new View({$el: $el});

        $el.find('form').trigger('submit').trigger('submit').trigger('submit');

        assert.equal(view.formSubmitCounter, 1);

    });

    it('can be defined with injected instance variables', function() {

        var View = BaseView.extend({
            initialize: function() {
                this.formSelector = 'form';
            },
            events: {
                'submit {{this.formSelector}}': function() {
                    this.formIsSubmited = true;
                }
            }
        });

        var view = new View({$el: $el});

        $el.find('form').trigger('submit');

        assert.isTrue(view.formIsSubmited);

    });

    it('can be defined with injected global variables', function(done) {

        window.formSelector = 'form';

        var View = BaseView.extend({
            events: {
                'submit {{formSelector}}': function() {
                    this.formIsSubmited = true;
                }
            }
        });

        var view = new View({$el: $el});

        $el.find('form').trigger('submit');

        window.formSelector = undefined;

        assert.isTrue(view.formIsSubmited);

        done();

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
            var view = new View1({$el: $el});
        });

        assert.throws(function() {
            var view = new View2({$el: $el});
        });

    });

    it('are bound directly when delegated events are set to false', function(done) {

        var View = BaseView.extend({
            delegatedEvents: false,
            events: {
                'submit form': function(e) {
                    assert.strictEqual(e.delegateTarget, $el.find('form').get(0));
                    done();
                }
            }
        });

        var view = new View({$el: $el});

        $el.find('form').trigger('submit');

    });

    it('are properly handled when called with special selectors (window or document)', function() {

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

        assert.isTrue(view.windowIsResized);
        assert.isTrue(view.documentIsClicked);


    });

    it('can be removed and cleaned up', function() {

        var View = BaseView.extend({
            delegatedEvents: false,
            events: {
                'submit form': function() {
                    this.formIsSubmited = true;
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

        $el.find('form').trigger('submit');
        $(document).trigger('click');
        $(window).trigger('resize');

        assert.isUndefined(view.formIsSubmited);
        assert.isUndefined(view.windowIsResized);
        assert.isUndefined(view.documentIsClicked);

    });

});

describe("SimpleView utilities", function() {

    it('uses $ as alias for view element find', function() {

        var view = new BaseView({$el: $el});
        var formElement = $el.find('form').get(0);
        var viewFormElement = view.$('form').get(0);

        assert.strictEqual(viewFormElement, formElement);

    });

});

describe("SimpleView subviews", function() {

    it('can be added to parent registry', function() {

        var ChildView = BaseView.extend({});

        var ParentView = BaseView.extend({
            initialize: function() {
                var childView = this.addView(new ChildView({$el: this.$('form')}));
                assert.strictEqual(childView, this.views[childView.cid]);
            }
        });

        var view = new ParentView({$el: $el});

    });

    it('can be removed by parent', function() {

        var ChildView = BaseView.extend({});

        var ParentView = BaseView.extend({
            initialize: function() {
                this.addView(new ChildView({$el: this.$('form')}));
            }
        });

        var view = new ParentView({$el: $el});
        view.removeViews();

        assert.isUndefined(view.views);

    });

    it('can be removed by child remove call', function() {

        var ChildView = BaseView.extend({});
        var ParentView = BaseView.extend({});

        var parentView = new ParentView({$el: $el});
        var childView = parentView.addView(new ChildView({$el: parentView.$('form')}));
        childView.remove();

        assert.isUndefined(parentView.views[childView.cid]);

    });

});
