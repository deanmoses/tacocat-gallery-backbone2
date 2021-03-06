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
			
			// if the year is 2007 or greater, the album's in Gallery2
			if (year >= 2007) {
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
	 * Create a new album.
	 *
	 * @param parentAlbum
	 * @param creationDate
	 * @param title
	 * @param summary
	 */
	createAlbum: function(parentAlbum, creationDate, title, summary) {
		// build a jQuery Deferred object to let my callers do .done() and .fail()
		var deferred = $.Deferred();

		//
		// figure out path of new album
		//
		var albumPath = parentAlbum.attributes.fullPath;

		// if parent is root
		if (parentAlbum.attributes.albumType === 'root') {
			albumPath = new Date(creationDate).getYear().toString();
		}
		// if parent is a year
		else if (parentAlbum.attributes.albumType === 'year') {
			var date = new Date(creationDate);
			var month =  ('0' + (date.getMonth()+1)).slice(-2);
			var day = ('0' + (date.getDate()+1)).slice(-2);
			albumPath = albumPath + '/' + month + '-' + day;
		}
		// if parent is a week
		else if (parentAlbum.attributes.albumType === 'week') {
			var pathComponent = $.trim(title).replace(/\s+|-+/g,"_").replace(/'|"/g,"");

			if (!pathComponent) {
				return deferred.reject('Title is blank');
			}

			// parentAlbum + title stripped of non alphanum characters
			albumPath = albumPath + '/' + pathComponent.toLowerCase();
		}
		else {
			throw 'Unknown album type: [' + this.model.attributes.albumType + ']';
		}

		console.log('new album: ', albumPath);

		//
		// set up album fields to send to server
		//
		var postData = {};
		if (title) {
			postData.title = title;
		}
		if (summary) {
			postData.summary = summary;
		}

		app.post('/album/' + albumPath, postData)
			.fail(function(message){
				deferred.reject(message);
			})
			.done(function(data){
				// TODO:  add newly created album to AlbumStore

				deferred.resolve(data.message);
			});

		// return the jQuery Promise so that the callers can use .then(), .always(), .done() and .fail()
		return deferred.promise();
	},

	/**
	 * Retrieve an album model by full path, like '2010/01_31'.
	 *
	 * This is asynchronous -- you have to register a callback via
	 *  .then(), .always(), .done() and .fail()
	 */
	fetchAlbum: function(path) {
		//console.log('Album.Collection.fetchAlbum('' + path + '')');

		// allow subfunctions to access my 'this'
		var _this = this;

		// build a jQuery Deferred object so that my callers can do .done() and .fail()
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
					// If album doesn't have an ID, it's 2006 or older,
					// and those come from static JSON.  They have a
					// different format and we'll be processing them
					// differently in places.
					//
					var isStaticAlbum = (!album.attributes.id);
					
					//	
					// Figure out what type of album it is:  root, year or week
					//
					// no path: it's the root album
					if (!path || path.length <= 0) {
						album.attributes.albumType = 'root';
					}
					// no slashes:  it's a year album
					else if (path.indexOf('/') < 0) {
						album.attributes.albumType = 'year';
					}
					// else it's a subalbum (2005/12-31 or 2005/12-31/snuggery)
					else {
						album.attributes.albumType = 'week';
					}
					
					//
					// Set up link to album's parent, needed for the Back button
					//
					if (album.attributes.albumType === 'root') {
						album.attributes.parentAlbumPath = null;
						
					}
					else if (album.attributes.albumType === 'week') {
						var pathParts = path.split('/');
						pathParts.pop();
						album.attributes.parentAlbumPath = pathParts.join('/');
					}
					else if (album.attributes.albumType === 'year') {
						album.attributes.parentAlbumPath = '';
					}
					
					//
					// Set up album's title
					//
					
					// blank out any title on the root album, we don't want to display it
					if (album.attributes.albumType === 'root') {
						album.attributes.title = undefined;
					}
					// Add a 'fulltitle' attribute accessbile to templating
					album.attributes.fulltitle = album.getTitle();
					
					// If the album's caption has any links to the the old
					// picture gallery, rewrite them to point to this UI
					if (album.attributes.description) {
						album.attributes.description = app.rewriteGalleryUrls(album.attributes.description);
					}
					
					// If album doesn't have URL, it's a pre 2007 album.
					// Give it URL of same structure as post 2006 albums.
					if (!album.attributes.url) {
						// like v/2013 or v/2013/12-31/
						album.attributes.url = 'v/' + album.attributes.pathComponent;
					}
					
					//
					// If the album is a pre 2007 year, do some munging on its thumbnails
					//
					if (album.attributes.albumType === 'year' && isStaticAlbum) {
						// Each child is thumbnail of a week album
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
					
					//
					// Do some munging on the album's photos
					//
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
					_this.push(album);

					// tell the deferred object to call all done() listeners
					deferred.resolve(album);
				},
				error: function(model, xhr, options) {
					console.log('Error fetching album [' + path + ']: ', xhr, options);

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

		// Allow subfunctions to access my 'this'
		var _this = this;

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

		// Hook up the create album button
		this.$el.find('.admin-button').click(function() {
			app.Routers.main.newAlbum(_this.model.attributes.fullPath);
		})

		// To support chaining
		return this;
	}
});

/**
 * Show the Create New Album dialog
 */
Album.Views.NewAlbum = Backbone.View.extend({

	initialize: function() {
		_.bindAll(this, 'render', 'handleSubmit', 'hide', 'setErrorMessage');
	},

	render: function() {
		//console.log('Album.Views.NewAlbum.render()', this.model.attributes);

		// Allow subfunctions to access my 'this'
		var _this = this;

		// Set up info needed by the create album dialog's template
		var dialogModel = {
			parentTitle: this.model.attributes.title,
			maxDate: '',
			minDate: '',
			initialDate: '',
			showDate: true, // Sub sub albums won't show date
			showTitle: false // Unless it's a sub sub album, don't let user enter a title.  It'll be set to something like "November 8"
		};

		// If the parent album is a year...
		if (this.model.attributes.albumType === 'year') {

			// Confine date picker to within the parent year
			var year = this.model.attributes.pathComponent;
			dialogModel.maxDate = year + '-12-31';
			dialogModel.minDate = year + '-01-01';

			// If parent is current year, set the date input to today
			if (year == new Date().getFullYear()) {
				dialogModel.initialDate = new Date().toJSON().slice(0,10);
			}
		}
		// If it's the root album
		else if (this.model.attributes.albumType === 'root') {
			// TODO: if parent is the root album, only allow creation of a year album
			// Would be nice if we could restrict the HTML5 type="month" picker to
			// just pick years via its step="12" attribute, but it's only supported
			// in Safari not Chrome.  So instead the input type should probably be
			// a number field that goes from 1950 to the current year, defaulting to
			// the current year, like this:
			//<input type="number" min="1950" max="2014" value="2014">
		}
		// Else it's a week a.k.a day album
		else if (this.model.attributes.albumType === 'week') {
			// Don't show date picker: date is same as parent
			dialogModel.showDate = false;
			dialogModel.showTitle = true;
		}
		else {
			throw 'Unknown album type: [' + this.model.attributes.albumType + ']';
		}

		// Blank out the display area
		this.$el.empty();

		// Generate the HTML
		var html = app.renderTemplate('album_create_dialog', dialogModel);

		// Write the HTML to the DOM
		this.$el.html(html);

		// Show the dialog
		this.$el.parent().removeClass('hidden');

		// Hook up submit button
		this.$el.find('[name=submit]').click(this.handleSubmit);

		// Hook up cancel button
		this.$el.find('.cancel').click(this.hide);

		// Hook up esc key cancel
		this.$el.keyup(function(ev) {
			if (ev.which === 27) {
				_this.hide();
			}
		});

		// Submit on [ENTER] in password field
		this.$el.find('input[name=summary]').keyup(function(ev) {
			if (ev.which === 13) {
				_this.handleSubmit();
			}
		});
	},

	/**
	 * Create new album form submitted.   Create the album.
	 */
	handleSubmit: function() {
		// Allow subfunctions to access my 'this'
		var _this = this;

		// Clear out any previous error message
		this.setErrorMessage();

		// Get form values
		var date = this.$el.find('[name=date]').val();
		var title = this.$el.find('[name=title]').val();
		var summary = this.$el.find('[name=summary]').val();

		// Create the new album
		Album.Store.createAlbum(this.model, date, title, summary)
			.fail(function(errorMessage) {
				_this.setErrorMessage(errorMessage);
			})
			// Successful creation
			.done(function(data) {
				_this.hide();
			});
	},

	/**
	 * Set or clear error message
	 */
	setErrorMessage: function(message) {
		var messageElement = this.$el.find('.error.message');
		messageElement.text(message);
		if (message) {
			messageElement.removeClass('hidden');
		}
		else {
			messageElement.addClass('hidden');
		}
	},

	/**
	 * Hide the create new album dialog
	 */
	hide: function() {
		// Hide the dialog
		this.$el.parent().addClass('hidden');

		// Blank out the display area
		this.$el.empty();
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
 * Generate the HTML of the year navigation 2012 | 2013 | etc..
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
