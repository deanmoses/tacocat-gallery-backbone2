tacocat-gallery-backbone2
=========================

A HTML5 front end for tacocat.com's photo site using [Backbone.js](http://backbonejs.org/). 
Displays both the dynamic albums served from [Menalto gallery 2](http://galleryproject.org/) 
as well as the static pre-2006 albums that have been parsed to static JSON. 

Made for phones, tablets and desktop browsers.

## How To Work With Project

### Install stuff for working with project
1. [Git](http://git-scm.com/) - *source control tool.  Needed to retrieve this project from github.com*
2. [Node.js](http://nodejs.org/) - *Node.js server.  Needed to manage development tools & run dev webserver.  Not used at runtime*
3. [Compass](http://compass-style.org/) - *SASS CSS processor* 
 * This will require installing Ruby.  I highly recommend using [RVM](https://rvm.io/) instead installing Ruby directly.

### Get project

`cd [parent of desired project directory]`

`git clone https://github.com/deanmoses/tacocat-gallery-backbone2.git` - *gets local copy of this project*

`cd [project root]`

`npm install` - *downloads and installs Node.js packages that project's development system depends on, like Grunt.js*

`./node_modules/.bin/bower install` - *downloads and installs bower packages that the project's runtime depends on, like jQuery*
 * *you can do `bower install` if you already have Bower installed globally*

### Run development server & preview locally

`cd [project root]`

`grunt server` - *starts server and pops up browser with index page.  Autorefreshes browser each time a file changes.*

### Make changes, do development
Simply edit the files.  If you ran `grunt server` and the web browser is tuned to the right page, the changes will show up instantly.

### Build project for production and deploy to tacocat.com

`cd [project root]`

`grunt build` - *compiles production version and sticks in [project root/]dist/*

copy the distribution files at `[project root]dist/*` to `tacocat.com/p/`  - Use rsync or FTP.  Should set it up as a git subtree deployment some day.  If you want it someplace else, you'll have change a few things.  Here's an incomplete list: 
* change a variable in `app/scripts/firsts.js`
* the URL rewriting code in `apps/scripts/main.js`

### Project Structure

   * **/package.json**:  the node.js dependency file
      * this is what specifies all the server tools, like Grunt
      * the actual packages are installed in /node_modules/
   * **/bower.json**:  the bower dependency file
      * this is what specifies all the app dependencies, like backbone and lodash
      * the actual packages are installed in /app/bower_components/
