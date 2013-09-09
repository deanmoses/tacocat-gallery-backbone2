'use strict';

/**
 * The initial javascript called by the HTML page.
 *
 * I set up and kick off the Backbone.js app
 */

// tell JSHint to assume existence of these global vars
/*global app, $, _, Backbone, Handlebars, alert, Router, Firsts, Authentication, Album, Photo*/

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
		// Else look for cached version of development template
		else if (Handlebars.templates && Handlebars.templates[templateId]) {
			return Handlebars.templates[templateId];
		}
		// Else download the development version of the template (the
		// raw Handlebars file), compile it, and cache it.
		else {
			//console.log('app.getTemplate('+templateId+'): fetching from server');
			$.ajax({
				url : 'templates/' + templateId + '.handlebars',
				async : false
			}).done(function(data) {
				if (Handlebars.templates === undefined) {
					Handlebars.templates = {};
				}
				Handlebars.templates[templateId] = Handlebars.compile(data);
			}).fail(function(data, textStatus, jqXHR) {
				throw 'Failed to retrieve template [' + templateId + ']: ' + jqXHR;
			});
		}
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
