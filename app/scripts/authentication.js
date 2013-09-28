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
		_.bindAll(this, 'isAuthenticated', 'isSiteAdmin');
	},

	/**
	 * Return the URL that Backbone uses to fetch the model data.
	 */
	url : function() {
		//console.log('models.Authentication.url() called');
		
		// if we're offline / in testing mode
		if (app.mock) {
			return 'mock/authentication.json.txt';
		}
        else if (app.useRestServer) {
            return app.restServerUrl() + '/auth_status';
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
        // usually fetch is a GET, but for authentication use POST
        // to make very sure browser doesn't replay them.
        if (app.useRestServer) {
            options.type = 'POST';
        }

        //Call Backbone's regular fetch
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
		return this.get('isSiteAdmin') === true;
	}
});


/**
 * Login screen
 */
Authentication.Views.LoginPage = Backbone.View.extend({

	initialize: function() {
		_.bindAll(this, 'render', 'doLogin');
		//this.listenTo(this.model, 'change', this.render);
	},

	render : function() {
		// Blank out the display area
		this.$el.empty();

		// Generate the header HTML
		var headerHtml = app.renderTemplate('album_root_header', this.model);

		// Generate the body HTML
		var bodyHtml = app.renderTemplate('login_body', this.model);

		// Generate the layout HTML
		var html = app.renderTemplate('layout_main', {
			pageType: 'login',
			header: headerHtml,
			body: bodyHtml
		});

		// Write the HTML to the DOM
		this.$el.html(html);

		// Set the browser title
		app.setTitle('Login');

		// Hook up the form submit button
		this.$el.find('.submit.button').click(this.doLogin);
	},

	doLogin: function(data) {
		var username = this.$el.find('.login-form input[type=text]').val();
		var password = this.$el.find('.login-form input[type=password]').val();

		// Send the data using post
		$.post( app.restServerUrl() + '/login', { username: username, password: password } )
		.done(function( data ) {
			console.log('done with login', data);
		})
		.fail(function() {
			console.log( "error" );
		});
	}
}),

/**
 * Authentication View
 * 
 * If the user is authenticated, write some classes into the body tag.
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
