tacocat-gallery-backbone2
=========================

Front end for tacocat.com's Menalto gallery using Backbone.   Works on phones, tablets and browsers.

## How To Work With Project

### Install stuff for working with project
1. [Git](http://git-scm.com/) - *Source control tool.  Needed to retrieve this project from github.com*
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

`npm install` - *downloads and installs Node.js packages that project depends on, like Grunt*

### Run development server & preview locally
1. `cd [project root]`
3. `grunt server` *(starts server and pops up browser with index page.  This autorefreshes browser each time a file changes)*

### Build project for production and deploy to tacocat.com [WORK IN PROGRESS - HANDLEBAR TEMPLATES AND FIRSTS.PHP ARENT THERE YET]
1. `cd [project root]`
2. `grunt build` *(compiles production version and sticks in [project root/]dist/)*
3. ftp dist/* to wherever you want it on tacocat.com
