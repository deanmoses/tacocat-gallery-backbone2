/**
 * Firsts
 */

  // create the Firsts object
  var Firsts = {};

	/**
	 * Firsts Model
	 */
  Firsts.Model = Backbone.Model.extend({
	
		/**
		 * Called when a new instance of this model is created
		 */
		initialize : function() {
			// Ensure that the 'this' variable is pointing to myself 
			// in the specified methods in all contexts
    		_.bindAll(this, "getFirstsForYear");
		},
	
		/**
		 * Return the URL that Backbone uses to fetch the model data.
		 */
		url : function() {
			//console.log('models.Authentication.url() called');
			
			// if we're offline
			if (app.mock) {
				return "mock/firsts.json.txt";	
			}
			// else return real URL
			else {
				return "http://tacocat.com/p/php/firsts.php";
			}
		},
		
		/**
		 * Return true if the current user is logged in.
		 *
		 * This will return false until the authentication
		 * model is actually fetched from the server.
		 */
		getFirstsForYear : function(year) {
			return this.get(year);
		}
  });