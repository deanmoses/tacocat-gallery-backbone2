// Create the Photo object
var Photo = {
	Views : {}
};


    /**
     * Display an individual photo
     */
    Photo.Views.PhotoPage = Backbone.View.extend({
    
    	initialize: function() {
        	_.bindAll(this, "render", "renderCaptionEdit", /*"renderCaptionEditReal",*/ "handleCaptionSubmit", "handleCaptionCancel");
        	//this.listenTo(this.model, "change", this.render);
        },
	    
        render: function() {
        
        	// Blank out the display area
        	this.$el.empty();

			// Generate the header HTML
			var headerHtml = app.renderTemplate('photo_header', this.model);
			
			// Generate the body HTML
			var bodyHtml = app.renderTemplate('photo_body', this.model);

			// Generate the layout HTML
			var hasLongText = this.model.description && (this.model.description.length > 100 || this.model.description.indexOf('<p') >= 0);
			var isPortrait = this.model.height > this.model.width;
			var sidebarClass = isPortrait || hasLongText ? 'sidebar-text' : 'top-text';
			var html = app.renderTemplate('layout_main', {
				pageType: 'photo ' + sidebarClass,
				header: headerHtml,
				body: bodyHtml
			});

			// Write the HTML to the DOM
			this.$el.html(html);
			
			// Set the browser title
			app.setTitle(this.model.title + " - " + this.model.album.fulltitle);
	        
	        // Hook up the image resizing
	        this.resizeImage(
				// image
				'.photo #body .photo-container img', 
				// container to fit image into
				'.photo #body .photo-container'
			);
			
			// Hook up the admin controls, if any
	        var captionEditButton = this.$el.find('.admin-controls .caption-button');
	        if (captionEditButton) captionEditButton.click(this.renderCaptionEdit);
		
			// to support chaining
	        return this;
        },
        
        /**
         * Show the photo caption edit UI
         */
        renderCaptionEdit : function() {
	        var photoInfoArea = this.$el.find('#header');
	        photoInfoArea.html(app.renderTemplate('photo_caption_edit', this.model));
	        photoInfoArea.find('.button.submit').click(this.handleCaptionSubmit);
	        photoInfoArea.find('.button.cancel').click(this.handleCaptionCancel);
	        
	        // create the rich text editor
			var editor = new wysihtml5.Editor(
				// id of textarea element
				"caption",
				{ 
					// id of toolbar element
					toolbar: "wysihtml5-editor-toolbar", 
					
					// stylesheets to display inside the editor iframe
					stylesheets: [
						"http://yui.yahooapis.com/2.9.0/build/reset/reset-min.css", 
						"app/styles/css/editor/editor.css"
					],
					
					// name of javascript variable defined in parser rules .js
					parserRules:  wysihtml5ParserRules
				}
			);
			
			// Hack I found online to sort of make the editor expand as you type
			editor.observe("load", function() {
				editor.composer.element.addEventListener("mouseover", function() {
					editor.composer.iframe.style.height = editor.composer.element.scrollHeight + "px";
				});
				editor.composer.element.addEventListener("keyup", function() {
					editor.composer.iframe.style.height = editor.composer.element.scrollHeight + "px";
				});
			});
			
			// Hide the regular caption
			$("#body .caption").addClass("hidden");

			return this;
        },
        
        handleCaptionSubmit : function() {
        	var _this = this;
	        var title = this.$el.find('.caption-edit-controls input[name="title"]').val();
	        var description = this.$el.find('.caption-edit-controls textarea#caption').val();
	        
	        // Update the server if the new title / description is actually different
	        if (this.model.title != title || this.model.description != description) {
		        //console.log('Submitting new title: ' + title + ' and description: ' + description);
		        
		        // Send info to server
				$.post(
					"http://tacocat.com/pictures/main.php?g2_view=json.SaveCaption", 
					{ id: this.model.id, title: title, description: description }
				)
				// On success
				.done(function(data) { 
					// Update the title and description on our internal model
			        _this.model.title = title;
				    _this.model.description = description;
					
					// Show the regular photo UI instead of the edit UI
					_this.render();
				})
				// On error
				.fail(function(data) { 
					alert("error: " + data);
					console.log("Error saving caption", data);
				})
		    }
		    else {
			    console.log("caption / title haven't changed");
		    }
		    
		    // Show the regular caption again
			$("#body .caption").removeClass("hidden");
        },
        
        handleCaptionCancel : function() {
        	// Show the regular photo UI instead of the edit UI
	        this.render();
	        
	        // Show the regular caption again
			$("#body .caption").removeClass("hidden");
        },
        
        /**
         * Utility to resize an image to best fit the HTML element that it 
         * lives inside of.
         */
        resizeImageOnce : function(image, container) {
		
			 // get image width and height
		    var img_w = image.width();
		    var img_h = image.height();
		    
		    if (img_w <= 0 || img_h <= 0) return;
		    
		    // get container width and height
		    var container_w = container.width();
		    var container_h = container.height();
		    
		    if (container_w <=0 || container_h <=0) return;
			
			// calculate image height if we resized to 100% width
			var img_h_new = Math.round(container_w * (img_h / img_w));
			
			// if new image height fits within container, we've got our dimensions
			if (img_h_new <= container_h) {
				//console.log('width based.  container w: ' + container_w + ' > ' + container.parent().width() + ' > ' + container.parent().width());
				image.width(container_w);
				image.height(img_h_new);
			}
			// else if new image height is too tall for container, 
			// make image height 100% of container
			else {
				//console.log('height based');
				image.height(container_h);
				image.width(Math.round(container_h * (img_w / img_h)));
			}
			
			image.css('display', 'block');

		    // update header width to match image
		    //$('.header-container header').width(image.width());
		},
		
		/**
		 * Continuously resize an image to best fit the HTML element that it 
         * lives inside of.
         *
         * @param imageExpression css/jQuery expression targeting the image
         * @param containerExpression css/jQuery expression targeting the container
		 */
		resizeImage : function(imageExpression, containerExpression) {
			var image = $(imageExpression);
			var container = $(containerExpression);
			var _this = this;
			
			image.load(function(){ 
				//console.log('imageUtil.resizeImage(): img loaded'); 
				_this.resizeImageOnce(image, container); 
			});  // on initial image load (won't be called if it's already loaded)
			//$(function(){ _this.resizeImageOnce(image, container); });  // on initial page load
			$(window).resize(function() { _this.resizeImageOnce(image, container); });  // on window resize
		}

    });
