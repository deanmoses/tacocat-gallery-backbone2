'use strict';

// tell JSHint to assume existence of these global vars
/*global app, $, _, Backbone, alert, Album, Photo*/

/**
 * Backbone.js router.
 *
 * Decides what happens when various URLs in the app are hit.
 */
var Router = Backbone.Router.extend({
	
	/**
	 * Define the application's routes.
	 *
	 * This maps a URL 'route' expression to a 
	 * javascript function to call when Backbone
	 * detects a matching URL has been entered
	 * into the browser.location.
	 */
	routes: {
		'v/*path.html': 'viewPhoto',
		'v/*path': 'viewAlbum',
		'*path': 'notFound'
	},
	
	initialize: function() {
		_.bindAll(this);
	},
	
	wait: function() {
		$('#waiting').addClass('on');
	},
	
	unwait: function() {
		$('#waiting').removeClass('on');
	},
	
	/**
	 * Show the photo page
	 */
	viewPhoto: function(path) {
		var _this = this;
		this.wait();
		
		var pathParts = path.split('/');
		var photoId = pathParts.pop();
		var albumPath = pathParts.join('/');
		
		//console.log('Router.viewPhoto() photo ' + photoId + ' in album ' + albumPath);
		
		// fetch the album, either from cache or from server
		Album.Store.fetchAlbum(albumPath)
			.fail(function(xhr, options) {
				console('Router.viewPhoto() couldn\'t find album ' + path + '. Error: ', xhr, options);
			})
			.done(function(album) {
				//console.log('Router.viewPhoto() got album ' + albumPath + ' for photo ' + photoId + '.  Album: ' , album);
		
				var photo = album.getPhotoByPathComponent(photoId);
				if (!photo) {
					throw 'No photo with ID ' + photoId;
				}
				//console.log('Router.viewPhoto() got photo ' + photoId, photo);
				
				// set the photo's album on the photo so the view can use that info
				photo.album = album.attributes;
				photo.nextPhoto = album.getNextPhoto(photoId);
				photo.prevPhoto = album.getPrevPhoto(photoId);
				photo.orientation = (photo.height > photo.width) ? 'portrait' : 'landscape';
				
				new Photo.Views.PhotoPage({
					model: photo,
					el: $('#main')
				}).render();
			})
			.always(function(){
				_this.unwait();
			});
	},

	/**
	 * Show the album page
	 */
	viewAlbum: function(path) {
		var _this = this;
		this.wait();
		//console.log('Router.viewAlbum(path: [' + path + '])');

		// regularize path by getting rid of any preceding or trailing slashes
		path = this.normalizePath(path);

		// fetch album, either from cache or from server
		Album.Store.fetchAlbum(path)
			.fail(function(xhr, options) {
				console.log('Couldn\'t find album ' + path + '. Error: ', xhr, options);
			})
			.done(function(album) {
				//console.log('URL router viewAlbum() got album ' + path + '.  Album: ' , album);
				new Album.Views.Main({
					model: album,
					el: $('#main')
				}).render();
			})
			.always(function(){
				_this.unwait();
			});
	},

	/**
	 * Show the 'not found' page
	 */
	notFound: function(path) {
		// retrieve the root album
		this.viewAlbum('');
	},

	/**
	 * Helper method to normalize paths
	 */
	normalizePath: function(path) {
		if (!path) {
			return '';
		}
		
		// strip any trailing slash
		path = path.replace(/\/$/, '');

		// Regularize path by getting rid of any preceding or trailing slashes
		var pathParts = path.split('/');
		return pathParts.join('/');
	}
});
