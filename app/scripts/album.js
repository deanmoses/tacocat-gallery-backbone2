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
			
			// if the year is blank (the root album) or 2007 or greater, the album's in Gallery2
			if (!year || year >= 2007) {
				return 'http://tacocat.com/pictures/main.php?g2_view=json.Album&album=' + this.id;
			}
			// 2006 and earlier years are in static JSON
			// at /oldpix/year/month-day/album.json
			// such as /oldpix/2001/12-31/album.json
			else {
				return 'http://tacocat.com/oldpix/' + this.id + '/album.json';
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
					
					//	
					// Figure out what type of album it is:  root, year or week
					//
					var albumType;
					// no path: it's the root album
					if (!path || path.length <= 0) {
						albumType = 'root';
					}
					// no slashes:  it's a year album
					else if (path.indexOf('/') < 0) {
						albumType = 'year';
					}
					// else it's a subalbum (2005/12-31 or 2005/12-31/snuggery)
					else {
						albumType = 'week';
					}
					
					//
					// If album doesn't have an ID, it's 2006 or older,
					// and those come from static JSON.  They have a
					// different format and we'll be processing them
					// differently in places.
					//
					var isStaticAlbum = (!album.attributes.id);
					
					//
					// Process album, inserting or deleting info needed
					// to display it.
					//
					
					// process root album
					if (albumType === 'root') {
						album.attributes.albumType = 'root';
						album.attributes.parentAlbumPath = null;
						
						// blank out any title on the root album, we don't want to display it
						album.attributes.title = undefined;
						
						// the root album comes from Gallery2.  Insert all the old 
						// static years
						var earlyYearThumbs = [{
							url: 'v/2006',
							title: '2006',
							thumbnail: {
								url: 'http://tacocat.com/pix/img/2006-reading.jpg',
								height: 75,
								width: 150
							}
						}, {
							url: 'v/2005',
							title: '2005',
							thumbnail: {
								url: 'http://tacocat.com/pix/img/2005-bath.jpg',
								height: 75,
								width: 150
							}
						}, {
							url: 'v/2004',
							title: '2004',
							thumbnail: {
								url: 'http://tacocat.com/pix/img/2004_fall_milo.jpg',
								height: 75,
								width: 75
							}
						}, {
							url: 'v/2003',
							title: '2003',
							thumbnail: {
								url: 'http://tacocat.com/pix/img/21months_small.jpg',
								height: 75,
								width: 75
							}
						}, {
							url: 'v/2002',
							title: '2002',
							thumbnail: {
								url: 'http://tacocat.com/pix/img/1year_small.jpg',
								height: 75,
								width: 75
							}
						}, {
							url: 'v/2001',
							title: '2001',
							thumbnail: {
								url: 'http://tacocat.com/pix/img/felix_small.jpg',
								height: 75,
								width: 75
							}
						}, {
							url: 'v/2001',
							title: '1973',
							thumbnail: {
								url: 'http://tacocat.com/pix/img/1973-dean-2weeks-thumb.jpg',
								height: 75,
								width: 75
							}
						}];
						
						album.attributes.children = album.attributes.children.concat(earlyYearThumbs);
					}
					
					// process week album
					else if (albumType === 'week') {
						album.attributes.albumType = 'week';
						
						var pathParts = path.split('/');
						pathParts.pop();
						album.attributes.parentAlbumPath = pathParts.join('/');
					}
					
					// process year album
					else if (albumType === 'year') {
						album.attributes.albumType = 'year';
						album.attributes.parentAlbumPath = '';
						
						// Process year albums that are pre 2007
						if (isStaticAlbum) {
							
							// Process info about my sub albums, which are week albums
							_.each(album.attributes.children, function(entry, key) {
								
								// Generate url to album.
								// Give url same structure as post 2006 albums
								if (!entry.url) {
									// like v/2013/12-31/
									entry.url = 'v/' + entry.pathComponent;
								}

								// Generate thumbnail image info.
								// Thumb will use full-sized image sent through an 
								// image proxy service (this is temporary, need a more
								// performant solution like hooking up to a CDN)
								if (!entry.thumbnail) {
									var url = 'http://images.weserv.nl/?w=100&h=100&t=square&url=';
									url = url + entry.fullSizeImage.url.replace('http://', '');
									entry.thumbnail = {
										url: url,
										height: 100,
										width: 100
									};
								}
							});
						}
					}
					
					// Add a 'fulltitle' attribute accessbile to templating
					album.attributes.fulltitle = album.getTitle();
					
					// If the album's caption has any links to the the old
					// picture gallery, rewrite them to point to this UI
					album.attributes.description = app.rewriteGalleryUrls(album.attributes.description);
					
					// If album doesn't have URL, it's a pre 2007 album.
					// Give it URL of same structure as post 2006 albums.
					if (!album.attributes.url) {
						// like v/2013 or v/2013/12-31/
						album.attributes.url = 'v/' + album.attributes.pathComponent;
					}
					
					// Do some munging on the album's photos
					if (album.attributes.albumType === 'week') {
						
						// Pre 2007 albums store photos in an associative array instead 
						// of a regular array.  Photo order is in the .childrenOrder array.
						// Move .children to .photosByPhotoName and make a correctly ordered
						// array at .children.
						if (album.attributes.childrenOrder) {
							album.attributes.photosByPhotoName = album.attributes.children;
							album.attributes.children = [];
							_.each(album.attributes.childrenOrder, function(childName) {
								var photo = album.attributes.photosByPhotoName[childName];
								album.attributes.children.push(photo);
							});
						}

						// process each album photo
						_.each(album.attributes.children, function(entry, key) {
													    
							// If the caption contains any <a hrefs> that link to a gallery
							// URL, rewrite them to point to this UI instead.
							entry.description = app.rewriteGalleryUrls(entry.description);
							
							// If I don't have URL to full sized image, I'm a post 2006 album.
							// Generate now
							if (!entry.fullSizeImage) {
								entry.fullSizeImage = {
									// http://tacocat.com/pictures/d/{{id}}-3/{{pathComponent}}
									url: 'http://tacocat.com/pictures/d/' + entry.id + '-3/' + entry.pathComponent
								};
							}
							
							// If I don't have a URL to my photo page, I'm a pre 2007 album.
							// Set up URL here of same format as post 2006 albums: v/2009/11-08/supper.jpg.html
							if (!entry.url) {
								entry.url = 'v/' + album.attributes.pathComponent + '/' + entry.pathComponent + '.html';
							}
						
							// If I don't have a thumbnail URL, I'm a pre 2007 album.
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
								};
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

	// Set up the sidebar HTML
	// Years 2001-2006 have a pregenerated album.sidebar
	// Years 2007 & up will have firsts, which we generate album.sidebar from here
	if (!album.attributes.sidebar) {
		var firsts = app.Models.firstsModel.getFirstsForYear(album.attributes.title);
		if (firsts) {
			album.attributes.sidebar = app.renderTemplate('firsts', {firsts: firsts});
		}
	}
		
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

	// Generate the body HTML
	return app.renderTemplate('album_body', {
		album: album,
		thumbnails: thumbnailHtml
	});
};
