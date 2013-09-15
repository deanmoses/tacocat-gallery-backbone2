'use strict';
/**
 * Backbone models & views representing and displaying a photo album
 */

// tell JSHint to assume existence of these global vars
/*global app, $, _, Backbone, alert, Photo*/

// Create the Album object
var Album = {
	Views : {}
};

//
// MODELS
//
	
/**
 * Represents an album.
 *
 * Includes all data about child photos.
 * Includes child albums, but not the child album's photos.
 */
Album.Model = Backbone.Model.extend({
	idAttribute: 'fullPath',

	/**
	 * Return the URL location of the album's JSON
	 */
	url: function() {
		// if not mock, return real URL
		if (!app.mock) {
			// Album IDs are of this format:
			//   2013
			//   2013/09-08
			//   2013/09-08/someSubAlbum
			var year = this.id.split('/')[0];
			
			// if the year is 2006 or greater, the album's in Gallery2
			if (year >= 2006) {
				return 'http://tacocat.com/pictures/main.php?g2_view=json.Album&album=' + this.id;
			}
			// 2005 and earlier years are in static JSON
			// at /oldpix/year/month/day/album.json
			// such as /oldpix/2001/12/31/album.json
			else {
				var path = this.id.replace('-', '/');
				return 'http://tacocat.com/oldpix/' + path + '/album.json'
			}
		}
		// else if it's a sub album with photos
		else if (this.id.indexOf('/') >= 0) {
			return 'mock/album.json.txt';
		}
		// else it's a year album
		else {
			return 'mock/album-year.json.txt';
		}
	},

	initialize: function() {
		_.bindAll(this, 'getPhotoByPathComponent', 'getNextPhoto', 'getPrevPhoto', 'getCreationDate', 'getTitle');
	},

	/**
	 * Find a photo by it's pathComponent, like 'flowers.jpg'
	 */
	getPhotoByPathComponent: function(pathComponent) {
		//console.log('Album.Model.getPhotoByPathComponent('+pathComponent+'): model: ', jQuery.extend(true, {}, this));
		var photo = _.find(this.attributes.children, function(child) {
			//console.log('album.getPhotoByPathComponent('+pathComponent+'): looking at child.pathComponent: ' + child.pathComponent);
			return child.pathComponent === pathComponent;
		});

		return photo;
	},

	getNextPhoto: function(pathComponent) {
		//console.log('Album.Model.getNextPhoto('+pathComponent+')');
		var foundCurrentPhoto = false;
		return _.find(this.attributes.children, function(child) {
			//console.log('album.getNextPhoto('+pathComponent+'): looking at child.pathComponent: ' + child.pathComponent);
			if (foundCurrentPhoto) {
				//console.log('album.getNextPhoto('+pathComponent+'): ' + child.pathComponent + ' is the next photo!');
				return true;
			} else if (child.pathComponent === pathComponent) {
				foundCurrentPhoto = true;
			}
		});
	},

	getPrevPhoto: function(pathComponent) {
		var prevPhoto;
		_.find(this.attributes.children, function(child) {
			if (child.pathComponent === pathComponent) {
				return true;
			}
			prevPhoto = child;
		});

		return prevPhoto;
	},
	
	/**
	 * Return a javascript Date object of this album's creation time.
	 */
	getCreationDate: function() {
		return new Date(this.attributes.creationTimestamp * 1000);
	},
	
	/**
	 * Return the title of this album.
	 */
	getTitle: function() {
		if (this.attributes.albumType === 'week') {
			return this.attributes.title + ', ' + this.getCreationDate().getFullYear();
		}
		else if (this.attributes.albumType === 'year') {
			return this.attributes.title + ' - Dean, Lucie, Felix & Milo Moses';
		}
		return null;
	}
});

/**
 * Caching collection of all the albums in the system
 * that have been retrieved so far.
 */
Album.Collection = Backbone.Collection.extend({
	model: Album.Model,

	initialize: function() {
		_.bindAll(this, 'fetchAlbum');
	},

	/**
	 * Retrieve an album model by full path, like '2010/01_31'.
	 *
	 * This is asynchronous -- you have to register a callback via
	 *  .then(), .always(), .done() and .fail()
	 */
	fetchAlbum: function(path) {
		//console.log('Album.Collection.fetchAlbum('' + path + '')');

		// 'this' points to 
		var that = this;

		// build a jQuery Deferred object
		var deferred = $.Deferred();

		// look for album in my cache of albums
		var album = this.get(path);

		// if album is in cache...
		if (album) {
			//console.log('Album.Collection.fetchAlbum(): album ' + path + ' is in cache');

			// resolve the deferred immediately with success
			deferred.resolve(album);
		}
		// else the album is not in cache...
		else {
			//console.log('Album.Collection.fetchAlbum(): album ' + path + ' not on client, fetching');
			album = new Album.Model({
				fullPath: path
			});
			album.fetch({
				success: function(model, response, options) {
					//console.log('Success fetching album ' + path);
					// Figure out path to parent album
					// if there's a slash, then it's a sub album
					if (path.indexOf('/') >= 0) {
						var pathParts = path.split('/');
						pathParts.pop();
						
						// If album doesn't have an ID, it's a pre 2006 album
						// and the path contains a month like this:  2001/12/31
						// Pop off the month to get the correct year path.
						if (!album.attributes.id) {
							pathParts.pop();
						}
						album.attributes.parentAlbumPath = pathParts.join('/');
						album.attributes.albumType = 'week';
					}
					// else if the album path is not '', it's a year album
					else if (path.length > 0) {
						album.attributes.parentAlbumPath = '';
						album.attributes.albumType = 'year';
						
						// Make this year's firsts available
						album.attributes.firsts = app.Models.firstsModel.getFirstsForYear(album.attributes.title);
						
						// If year album doesn't have an ID, it's a pre 2006 album
						// and we need to generate thumbnail info for each week
						// from full sized image
						if (!album.attributes.id) {						
							album.attributes.children.forEach(function(entry) {
								// If I don't have a thumbnail URL, I'm a pre 2006 album.
								// Generate a thumb using my full-sized image using an 
								// image proxy service (this is temporary, need a more
								// performant solution like hooking up to a CDN)
								if (!entry.thumbnail) {								
									var url = 'http://images.weserv.nl/?w=100&h=100&t=square&url=';
									url = url + entry.fullSizeImage.url.replace('http://', '');
									entry.thumbnail = {
										url: url,
										height: 100,
										width: 100
									}
								}
								
								// If album doesn't have URL, it's a pre 2006 album.
								// Give it URL of same structure as post 2006 albums.
								if (!entry.url) {
									//v/2013/07-07/
									entry.url = 'v/' + entry.pathComponent;
								}
							});
						}
						
					}
					// else this is the root album
					else {
						album.attributes.parentAlbumPath = null;
						album.attributes.albumType = 'root';
						
						// blank out any title on the root album, we don't want to display it
						album.attributes.title = undefined;
					}
					
					// Add a 'fulltitle' attribute accessbile to templating
					album.attributes.fulltitle = album.getTitle();
					
					// If the album's caption has any links to the the old
					// picture gallery, rewrite them to point to this UI
					album.attributes.description = app.rewriteGalleryUrls(album.attributes.description);
					
					
					// If album doesn't have URL, it's a pre 2006 album.
					// Give it URL of same structure as post 2006 albums.
					if (!album.attributes.url) {
						//v/2013/07-07/
						album.attributes.url = 'v/' + album.attributes.pathComponent;
					}
					
					// Do some munging on the album's photos
					if (album.attributes.albumType == 'week') {
						album.attributes.children.forEach(function(entry) {
						    
							// If the caption contains any <a hrefs> that link to a gallery
							// URL, rewrite them to point to this UI instead.
							
							entry.description = app.rewriteGalleryUrls(entry.description);
							
							// If I don't have URL to full sized image, I'm a post 2006 album.
							// Generate now
							if (!entry.fullSizeImage) {
								entry.fullSizeImage = {
									// http://tacocat.com/pictures/d/{{id}}-3/{{pathComponent}}
									url: 'http://tacocat.com/pictures/d/' + entry.id + '-3/' + entry.pathComponent
								}
							}
							
							// If I don't have a URL to my photo page, I'm a pre 2006 album.
							// Set up URL here of same format as post 2006 albums: v/2009/11-08/supper.jpg.html
							if (!entry.url) {
								entry.url = 'v/' + album.attributes.pathComponent + '/' + entry.pathComponent + '.html';
							}
						
							// If I don't have a thumbnail URL, I'm a pre 2006 album.
							// Generate a thumb using my full-sized image using an 
							// image proxy service (this is temporary, need a more
							// performant solution like hooking up to a CDN)
							if (!entry.thumbnail) {								
								var url = 'http://images.weserv.nl/?w=100&h=100&t=square&url=';
								url = url + entry.fullSizeImage.url.replace('http://', '');
								entry.thumbnail = {
									url: url,
									height: 100,
									width: 100
								}
							}
						});
					}

					// cache the album
					that.push(album);

					// tell the deferred object to call all done() listeners
					deferred.resolve(album);
				},
				error: function(model, xhr, options) {
					console.log('Error fetching album ' + path + ': ', xhr, options);

					// tell the deferred object to call all .fail() listeners
					deferred.reject(xhr, options);
				}
			});
		}

		// return the jQuery Promise so that the callers can use .then(), .always(), .done() and .fail()
		return deferred.promise();
	}
});

/**
 * The single store of all albums in the system
 */
Album.Store = new Album.Collection();

//
// VIEWS
//

/**
 * Display an album
 */
Album.Views.Main = Backbone.View.extend({

	initialize: function() {
		_.bindAll(this, 'render');
	},

	render: function() {
		//console.log('Album.Views.Main.render() model: ', this.model);

		// Render different types of albums differently
		var albumType = this.model.attributes.albumType;

		var albumTypeRenderers = Album.Views[albumType];
		if (!albumTypeRenderers) {
			throw 'Unknown album type: [' + albumType + ']';
		}
		
		// Blank the page
		this.$el.empty();

		// Generate the header HTML
		var headerHtml = app.renderTemplate('album_' + albumType + '_header', this.model.attributes);
		
		// Generate the secondary header HTML if any
		var secondaryHeaderHtml = (Album.Views[albumType].getSecondaryHeader) ? Album.Views[albumType].getSecondaryHeader() : undefined;
		
		// Generate the thumbnail HTML
		var bodyHtml = Album.Views[albumType].getBodyHtml(this.model);

		// Generate the layout HTML
		var html = app.renderTemplate('layout_main', {
			pageType: 'album ' + albumType + (albumType === 'year' ? ' y' + this.model.attributes.title : ''),
			header: headerHtml,
			secondaryHeader: secondaryHeaderHtml,
			body: bodyHtml
		});

		// Write the HTML to the DOM
		this.$el.html(html);
		
		// Set the page title
		app.setTitle(this.model.getTitle());

		// To support chaining
		return this;
	}
});

//
// VIEW HELPERS
// These help generate the above views
//

/**
 * Define an object to store the HTML generators for the week albums.
 */
Album.Views.week = {};

/**
 * Generate the HTML for the body of a week album
 */
Album.Views.week.getBodyHtml = function(album) {

	// Generate the thumbnail HTML
	var thumbnailHtml = '';
	_.each(album.get('children'), function(child) {
		//console.log('Album.Views.week.getBodyHtml() thumbnail child: ' + child.title);
		thumbnailHtml += app.renderTemplate('thumbnail', child);
	});

	// Generate the body HTML
	return app.renderTemplate('album_body', {
		album: album.attributes,
		thumbnails: thumbnailHtml
	});
};

/**
 * Define an object to store the HTML generators for the year albums.
 */
Album.Views.year = {};

/**
 * Generate the HTML for the body of a year album
 */
Album.Views.year.getBodyHtml = function(album) {

	// Generate the thumbnail HTML
	// Group the child week albums of the year album by month
	var months = _.groupBy(album.get('children'), function(child) {
		// create a new javascript Date object based on the timestamp
		// multiplied by 1000 so that the argument is in milliseconds, not seconds
		var date = new Date(child.creationTimestamp * 1000);
		var month = date.getMonth();
		return month;
	});

	// Template to render an entire month's worth of thumbs
	var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

	// Render the months in reverse chronological order
	// month[0] = January
	var thumbnailHtml = '';
	for (var i = 11; i >= 0; i--) {
		if (months[i]) {
			var month = {
				name: monthNames[i],
				albums: months[i]
			};
			//console.log('Month: ', month);
			thumbnailHtml += app.renderTemplate('thumbnail_month', month);
		}
	}

	// Generate the body HTML
	return app.renderTemplate('album_body', {
		album: album.attributes,
		thumbnails: thumbnailHtml
	});
};

/**
 * Generate the HTML of the years navigation 2012 | 2013 | etc..
 */
Album.Views.year.getSecondaryHeader = function() {
	return app.renderTemplate('album_year_header_secondary');
};

/**
 * Define an object to store the HTML generators for the root album.
 */
Album.Views.root = {};

/**
 * Generate the body HTML for the root album
 */
Album.Views.root.getBodyHtml = function(album) {

	// Generate the thumbnail HTML
	var thumbnailHtml = '';
	_.each(album.get('children'), function(child) {
		//console.log('Album.Views.Root.render() thumbnail child: ' + child.title);
		thumbnailHtml += app.renderTemplate('thumbnail', child);
	});

	// Generate the thumbnail HTMl for the early years as fake child albums 
	var earlyYears = [{
		url: '/pix/2006/index.php',
		title: '2006',
		thumbnail: {
			url: '2006-reading.jpg',
			height: 75,
			width: 150
		}
	}, {
		url: '/pix/2005/index.php',
		title: '2005',
		thumbnail: {
			url: '2005-bath.jpg',
			height: 75,
			width: 150
		}
	}, {
		url: '/pix/2004/index.php',
		title: '2004',
		thumbnail: {
			url: '2004_fall_milo.jpg',
			height: 75,
			width: 75
		}
	}, {
		url: '/pix/2003/index.php',
		title: '2003',
		thumbnail: {
			url: '21months_small.jpg',
			height: 75,
			width: 75
		}
	}, {
		url: '/pix/2002/index.php',
		title: '2002',
		thumbnail: {
			url: '1year_small.jpg',
			height: 75,
			width: 75
		}
	}, {
		url: '/pix/2001/index.php',
		title: '2001',
		thumbnail: {
			url: 'felix_small.jpg',
			height: 75,
			width: 75
		}
	}, {
		url: '/pix/1973/dean/index.php',
		title: '1973',
		thumbnail: {
			url: '1973-dean-2weeks-thumb.jpg',
			height: 75,
			width: 75
		}
	}];

	_.each(earlyYears, function(child) {
		//console.log('Album.Views.Root.render() thumbnail early year: ' + child.title);
		thumbnailHtml += app.renderTemplate('thumbnail_earlyyears', child);
	});

	// Generate the body HTML
	return app.renderTemplate('album_body', {
		album: album,
		thumbnails: thumbnailHtml
	});
};
