'use strict';

/**
 * The initial javascript called by the HTML page.
 *
 * I set up and kick off the Backbone.js app
 */

// tell JSHint to assume existence of these global vars
/*global app, $, _, Backbone, Handlebars, alert, JST, Router, Firsts, Authentication, Album, Photo*/

// define the global variable 'app'
window.app = {

	/**
	 * Containers for Backbone Models, Views, etc.
	 */
	Models: {},
	Collections: {},
	Views: {},
	Routers: {},

	/**
	 * Flag as to whether the system should be run offline.
	 * Only for development when disconnected.
	 */
	mock: false,

	/**
	 * The base of the URL for all JSON calls
	 */
	baseAjaxUrl: 'http://tacocat.com/pictures/main.php?g2_view=',
	
	/**
	 * Helper function to set the browser title
	 */
	setTitle: function(title) {
		if (title) {
			document.title = title + ' - Dean, Lucie, Felix and Milo Moses';
		}
		else {
			document.title = 'Dean, Lucie, Felix and Milo Moses';
		}
	},

	/**
	 * Helper for managing templates
	 *
	 * @param templateId ID of template
	 * @param context - the model attributes, or whatever data you pass to a template
	 * @return results of executed template, typically HTML
	 */
	renderTemplate : function(templateId, context) {
		var template = this.getTemplate(templateId);
		if (!template) {
			throw 'Error retrieving template [' + templateId + ']';
		}
		
		// execute the template and return the resulting HTML
		return template(context);
	},

	/**
	 * Return the template
	 *
	 * @param templateId ID of template
	 */
	getTemplate : function(templateId) {
		// Look for version of template that's been compiled to JST,
		// the JavaScript Template system. These will only exist in
		// production mode, where the Grunt.js build process has 
		// compiled the Handlebars templates into JST templates.
		var jstTemplateName = 'app/templates/'+templateId+'.handlebars';
		if (JST && JST[jstTemplateName]) {
			return JST[jstTemplateName];
		}
		
		//
		// Else retrieve the development version of the template
		//
		
		// If the place where we cache dev templates is undefined, define it
		if (Handlebars.templates === undefined) {
			Handlebars.templates = {};
		}
		
		// If there's no cached version of development template,
		// download the template (the raw Handlebars file), 
		// compile it, and cache it.
		if (Handlebars.templates[templateId] === undefined) {
			//console.log('app.getTemplate('+templateId+'): fetching from server');
			$.ajax({
				url : 'templates/' + templateId + '.handlebars',
				async : false
			}).done(function(data) {
				Handlebars.templates[templateId] = Handlebars.compile(data);
			}).fail(function(data, textStatus, jqXHR) {
				throw 'Failed to retrieve template [' + templateId + ']: ' + jqXHR;
			});
		}
		
		// return cached version of development template
		return Handlebars.templates[templateId];
	},
	
	/**
	 * If the passed-in caption contains any <a hrefs> that link to a gallery
	 * URL, rewrite them to point to this UI instead.
	 *
	 * @param caption The HTML of the caption
	 * @return the caption HTML with any hrefs to the gallery rewritten
	 */
	rewriteGalleryUrls: function(caption) {
		if (!caption) {
			return caption;
		}
		
		// Create a new jQuery object from the passed-in HTML.
		// Gotta wrap it in a tag (like <span> here) or else
		// the selector (.find('a')) doesn't work.  When I call
		// jqObj.html() at the end, that removes the <span>.
		var jqObj = $($.parseHTML('<span>' + caption + '</span>'));
		
		// Iterate over each <a> tag in the caption
		jqObj.find('a').attr('href', function() {
			// if the <a> tag has a href and the href is pointing to this server...
			if (this.href && this.href.lastIndexOf(window.location.origin, 0) === 0) {
				
				var href = this.href.replace(window.location.origin, '');
				
				// rewrite 
				// 'pictures/v/2008' to '#/v/2008'
				if (this.href.indexOf('pictures/') >= 0) {
					return this.href.replace(/pictures\//, 'p/#');
				}
				// rewrite 
				// pix/2005/ to #v/2005
				// pix/2005/12/31/ to #v/2005/12-31
				// pix/2005/12/31/snuggery/ to #v/2005/12-31/snuggery
				else if (this.href.indexOf('pix/') >= 0) {
					// pix to #v
					var newHref = this.href.replace(/pix\//, 'p/#v/');
	
					// rewrite 12/31 to 12-31
					newHref =  newHref.replace(/#v\/([^\/]*\/)(\d{2})\/(\d{2})(.*)/mg, window.location.path + '#v/$1$2-$3$4');
					
					// remove trailing slash, if any
					newHref =  newHref.replace(/\/$/, '');
					
					return newHref;
				}
				// rewrite
				// '/swim/index.html' to 'swim/'
				else {
					return window.location.href + href.replace(/index.html/, '');
				}
			}
		});
		
		// Return the caption with rewritten URLs
		return jqObj.html();
	},

	/**
	 * Kick off the app.
	 *
	 * Called when HTML page is fully loaded
	 */
	init: function () {
		//console.log('main.js Backbone app.init()');

		// Fetching this model will trigger a render of the authentication view,
		// which writes some CSS classes into the body tag
		app.Models.authenticationModel.fetch({
			error : function(model, xhr, options) {
				console.log('gallery.authentication.fetch() - error.  xhr: ', xhr);
			}
		});

		// Trigger the initial route 
		Backbone.history.start({ pushState: false /* turn on/off the HTML5 History API */});
	}
};

// Handles authentication of admins (aka Dean & Lucie) to 
// the tacocat menalto gallery PHP server
app.Models.authenticationModel = new Authentication.Model();

// Will write CSS classes into the body if the user is authenticated
app.Models.authenticationView = new Authentication.View({model:app.Models.authenticationModel});

// Get the firsts
app.Models.firstsModel = new Firsts.Model();
app.Models.firstsModel.fetch();

// Create the master router.  All navigation is triggered from this
app.Routers.main = new Router();

$(document).ready(function () {
    app.init();
});
