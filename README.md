tacocat-gallery-backbone2
=========================

Front end for tacocat.com's Menalto gallery using Backbone.   Works on phones, tablets and browsers.

## How To Work With Project

### Install stuff for working with project
1. [Git](http://git-scm.com/) - *needed to retrieve this project from github*
2. [Node.js](http://nodejs.org/) - *needed to manage development tools & run dev webserver.  Not used at runtime*
3. [Compass](http://compass-style.org/) - *SASS CSS processor* 
 * This will require installing Ruby
4. [Yeoman](http://yeoman.io/) - *command-line web development tool suite*
 * This installs the following automatically:
 * [Bower](http://bower.io/) - *javascript package manager*
 * [Grunt](http://gruntjs.com/) - *build and dev task runner*

### Get project
Get local copy of this project
1. `cd [directory that will be parent of project directory]`
2. `git clone [github address of this project]`

### Build project for development & preview locally
1. `cd [project root]`
2. `grunt` *(build project)*
3. `grunt server` *(starts server and pops up browser with index page, and autorefreshes browser each time a file changes)*

### Build project for production and deploy to Tacocat [WORK IN PROGRESS - HANDLEBAR TEMPLATES AND FIRSTS.PHP ARENT THERE YET]
1. `cd [project root]`
2. `grunt build` *(compiles production version and sticks in dist/)*
3. ftp dist/* to wherever you want it on tacocat.com
