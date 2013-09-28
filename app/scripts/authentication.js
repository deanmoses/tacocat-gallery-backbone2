'use strict';

/**
 * Authentication system
 * 
 * Handles authentication of admins (aka Dean & Lucie) to 
 * tacocat.com's menalto gallery PHP server
 *
 * Writes CSS classes into the body if the user is authenticated.
 *
 * Loads admin-only assets, like the rich text editor for captions.
 */

// tell JSHint to assume existence of these global vars
/*global app, $, _, Backbone, alert, Album, Photo*/

// create the Authentication object
var Authentication = {
	Views : {}
};

/**
 * Authentication Model
 * 
 * Main task is to answer the question:  is the user authenticated?
 */
Authentication.Model = Backbone.Model.extend({

	/**
	 * Called when a new instance of this model is created
	 */
	initialize : function() {
		// Ensure that the 'this' variable is pointing to myself 
		// in the specified methods in all contexts
		_.bindAll(this, 'isAuthenticated', 'isSiteAdmin', 'doLogout');
	},

	/**
	 * Return the URL that Backbone uses to fetch the model data.
	 */
	url : function() {
		// if we're offline / in testing mode
		if (app.mock) {
			return 'mock/authentication.json.txt';
		}
        else if (app.useRestServer) {
            return app.restServerUrl('/auth_status');
        }
		// else return real URL
		else {
			return app.baseAjaxUrl + 'json.Auth';
		}
	},

    /**
     * Override Backbone's fetch(), which fetches the
     * model data.  In this case, it fetches whether
     * the user is authenticated or not.
     *
     * If they aren't, this will result in a 401 unauthorized,
     * and we won't receive a model from the server.
     *
     * This only applies to the REST server.  The Gallery2
     * baseAjaxUrl uses GET for everything
     */
    fetch : function(options) {
        // Backbone's fetch is usually a GET, but for authentication use POST
        // to ensure the browser doesn't replay the request.
        if (app.useRestServer) {
			if (options === undefined) {
				options = {};
			}
            options.type = 'POST';
        }

        // Call Backbone's regular fetch
        return Backbone.Collection.prototype.fetch.call(this, options);
    },
	
	/**
	 * Return true if the current user is logged in.
	 *
	 * This will return false until the authentication
	 * model is actually fetched from the server.
	 */
	isAuthenticated : function() {
		return this.get('isAuthenticated') === true;
	},
	
	/**
	 * Return true if the current user is logged in
	 * and a site admin.
	 *
	 * This will return false until the authentication
	 * model is actually fetched from the server.
	 */
	isSiteAdmin : function() {
		return this.isAuthenticated() && this.get('isSiteAdmin') === true;
	},

	/**
	 * Do Logout
	 */
	doLogout : function() {
		// Make 'this' available to the following anonymous functions
		var _this = this;

		$.post( app.restServerUrl('/logout'))
			// Would only fail if there's a real server error...
			.fail(function(data) {
				console.log('Failed to logout', data)
			})
			// Successful logout
			.done(function(data) {
				// Update the authentication model.
				// This will trigger the authentication view, which writes
				// CSS classes into <body>
				_this.set(data);
			});
	},

	/**
	 * Do login.
	 * You can attach a .done() and .fail() to this.
	 */
	doLogin : function(username, password) {
		// build a jQuery Deferred object
		var deferred = $.Deferred();

		// Make 'this' available to the following anonymous functions
		var _this = this;

		// Login
		$.post( app.restServerUrl('/login'), { username: username, password: password } )
			// I receive a 401 if login fails
			.fail(function(data) {
				// tell the deferred object to call all .fail() listeners
				deferred.reject();
			})
			// Successful login
			.done(function(data) {
				// Update the authentication model.
				// This will trigger the authentication view, which writes
				// CSS classes into <body> and loads admin CSS and JS
				_this.set(data);

				// resolve the deferred immediately with success
				deferred.resolve();
			});

		// return the jQuery Promise so that the callers can use .then(), .always(), .done() and .fail()
		return deferred.promise();
	}
});


/**
 * Login dialog
 */
Authentication.Views.LoginPage = Backbone.View.extend({

	initialize: function() {
		_.bindAll(this, 'render', 'doLogin', 'hide');
	},

	/**
	 * Show login dialog
	 */
	render : function() {

		// Blank out the display area
		this.$el.empty();

		// Generate the HTML
		var html = app.renderTemplate('login_dialog', this.model);

		// Write the HTML to the DOM
		this.$el.html(html);

		// Show the dialog
		this.$el.removeClass('hidden');

		// Hook up cancel button
		this.$el.find('.cancel').click(this.hide);

		// Submit on [ENTER] in password field
		var _this = this;
		this.$el.find('.login-form input[type=password]').keyup(function(ev) {
			if (ev.which === 13) {
				_this.doLogin();
			}
		});
	},

	/**
	 * Process login submit
	 */
	doLogin: function(data) {
		// Hide any previous failure message
		this.$el.find('.login-form .fail-message').addClass('hidden')

		// Get credentials the user entered
		var username = this.$el.find('.login-form input[type=text]').val();
		var password = this.$el.find('.login-form input[type=password]').val();

		// Make 'this' available to the following anonymous functions
		var _this = this;

		// Login
		app.Models.authenticationModel.doLogin(username, password)
		.fail(function() {
			// show error message
			_this.$el.find('.login-form .fail-message').removeClass('hidden')
		})
		// Successful login
		.done(function( data ) {
			_this.hide();
		});
	},

	/**
	 * Hide the login dialog
	 */
	hide: function() {
		// Hide the dialog
		this.$el.addClass('hidden');

		// Blank out the display area
		// Just to keep the DOM lightweight
		this.$el.empty();
	}
}),

/**
 * Authentication View
 * 
 * If the user is authenticated, write some classes into <body>
 * and load admin CSS and JS.
 */
Authentication.Views.AuthClass = Backbone.View.extend({
	
	/**
	 * Called when a new instance of this view is created
	 */
	initialize : function() {
		// Ensure that the 'this' variable is pointing to myself 
		// in the specified methods in all contexts
		_.bindAll(this, 'render');

		// When the model changes, call render()
		this.listenTo(this.model, 'change', this.render);
	},
	
	/**
	 * If the user is authenticated, write some classes into the body tag.
	 */
	render : function() {
		//console.log('Authentication.View.render().  model: ', this.model);
		
		if (this.model.isAuthenticated()) {
			$('body').addClass('authenticated');
		}
		else {
			$('body').removeClass('authenticated');
		}
		
		if (this.model.isSiteAdmin()) {
			$('body').addClass('is-site-admin');
		}
		else {
			$('body').removeClass('is-site-admin');
		}

		if (!this.model.isSiteAdmin()) {
			return;
		}

		// load the scripts only needed by admins

		// define a $.cachedScript() method that allows fetching a cached script:
		jQuery.getCachedScript = function(url, options) {

			// allow user to set any option except for dataType, cache, and url
			options = $.extend(options || {}, {
				dataType: 'script',
				cache: true,
				url: url
			});
			
			// Use $.ajax() since it is more flexible than $.getScript
			// Return the jqXHR object so we can chain callbacks
			return jQuery.ajax(options);
		};
		
		// load the wysihtml5 rich text editor
		$.getCachedScript('scripts/vendor/wysihtml5-0.3.0.min.js')
		.done(function(script, textStatus) {
			//console.log('Loaded rich text editor: ' + textStatus );
		})
		.fail(function(jqxhr, settings, exception) {
			console.log('Error loading rich text editor: ' + exception);
		});
		
		// load the wysihtml5 rich text editor parser rules
		$.getCachedScript('scripts/vendor/wysihtml5-parser-rules-advanced.js')
		.done(function(script, textStatus) {
			//console.log('Loaded rich text editor parser rules: ' + textStatus );
		})
		.fail(function(jqxhr, settings, exception) {
			console.log('Error loading rich text editor parser rules: ' + exception);
		});

	}

});
