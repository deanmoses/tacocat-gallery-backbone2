tacocat-gallery-backbone2
=========================

A HTML5 front end for tacocat.com's [Menalto gallery 2](http://galleryproject.org/) photo site using [Backbone.js](http://backbonejs.org/).   Made for phones, tablets and desktop browsers.

## How To Work With Project

### Install stuff for working with project
1. [Git](http://git-scm.com/) - *source control tool.  Needed to retrieve this project from github.com*
2. [Node.js](http://nodejs.org/) - *Node.js server.  Needed to manage development tools & run dev webserver.  Not used at runtime*
3. [Compass](http://compass-style.org/) - *SASS CSS processor* 
 * This will require installing Ruby.  I highly recommend using [RVM](https://rvm.io/) instead installing Ruby directly.
4. [Yeoman 1.0](http://yeoman.io/) - *command-line web development tool suite*
 * This installs the following automatically:
 * [Bower](http://bower.io/) - *javascript package manager*
 * [Grunt](http://gruntjs.com/) - *build and dev task runner*

### Get project

`cd [parent of desired project directory]`

`git clone https://github.com/deanmoses/tacocat-gallery-backbone2.git` - *gets local copy of this project*

`cd [project root]`

`npm install` - *downloads and installs Node.js packages that project depends on, like Grunt.js*

### Run development server & preview locally

`cd [project root]`

`grunt server` - *starts server and pops up browser with index page.  Autorefreshes browser each time a file changes.*

### Make changes, do development
Simply edit the files.  If you ran `grunt server` and the web browser is tuned to the right page, the changes will show up instantly.

### Build project for production and deploy to tacocat.com [WORK IN PROGRESS - HANDLEBAR TEMPLATES AND FIRSTS.PHP ARENT THERE YET]

`cd [project root]`

`grunt build` - *compiles production version and sticks in [project root/]dist/*

ftp the distribution files at `[project root]dist/*` to `tacocat.com/p/`  - if you want it someplace else, you'll have to change some variables in `app/scripts/main.js`
