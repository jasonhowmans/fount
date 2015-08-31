'use strict';
var fs = require('fs');
var _ = require('lodash');
var Q = require('q');
var restify = require('restify');
var frontmatter = require('front-matter');
var titleCase = require('to-title-case');

function Fount () {
  var _self = this;

  // For providing runtime options
  var OPTS = {
    'posts': './posts',
    'port': 3868
  }

  // Routes are designed to be memorable
  this.ROUTES = [
    { name: 'posts', endpoint: '/posts/all', method: 'getAllPosts' },
    { name: 'post', endpoint: '/posts/:postName', method: 'getPost' }
  ]

  // We're using restify to handle all the rest
  var SERVER = restify.createServer();


  // For getting a global preference from the OPTS object
  //
  // @param key {String}
  var propGetter = function (key) {
    if ( !_.isString(key) ) {
      console.error('key must be a String');
      return false;
    }
    if (key in OPTS) {
      return OPTS[key];
    } else {
      console.error(key + 'doesn\'t exist in OPTS');
      return null;
    }
  }


  // For setting a new global preference in the OPTS object
  //
  // @param key {String}
  // @param value
  var propSetter = function (key, value) {
    if ( !_.isString(key) && !_.isempty(value) ) {
      console.error('key must be a String and value must be set');
      return false;
    }
    OPTS[key] = value;
    return true;
  }


  // Used for bootstrapping Fount
  var boot = function (port) {
    var port = port || OPTS['port'];

    // Set up routes
    var params, output;
    this.ROUTES.forEach( function (route) {
      SERVER.get(route.endpoint, function (req, res, next) {
        output = {};
        params = _.isEmpty(req.params) ? {} : req.params;
        res.setHeader('content-type', 'application/json');
        _self.RouteMethods(route.method)(params).then(
          function (data) {
          output[route.name] = data;
          res.send(output);
        }, function (reason) {
          res.send(404, reason);
        });
        return next();
      });
    });

    SERVER.listen(port);
  }

  // Public stuff
  this.boot = boot;
  this.get = propGetter;
  this.set = propSetter;
  this._options = OPTS;
}


// Where all the data comes together ready to be sent in the response
Fount.prototype.RouteMethods = function (method) {
  var _self = this;

  // Return data for all posts
  var getAllPosts = function () {
    var defer = Q.defer();
    _self.Parser().listPosts().then(defer.resolve, defer.reject);
    return defer.promise;
  }

  var getPost = function (params) {
    var defer = Q.defer();
    var postName = params.postName;
    _self.Parser().findPost(postName).then(function (post) {
      defer.resolve([post]);
    }, defer.reject);
    return defer.promise;
  }

  var methodIndex = {
    getAllPosts: getAllPosts,
    getPost: getPost
  }

  if (_.isString(method) && (method in methodIndex)) {
    return methodIndex[method];
  } else {
    return methodIndex;
  }
}



// The parser is used for extracting data from post
// documents and exposing it nicely
Fount.prototype.Parser = function () {
  var _self = this;
  var postsDir = _self.get('posts');
  var posts = [];

  // For testing a filename string
  var filenameRegex = /(.*)-(\d{4}-\d{1,2}-\d{1,2})$/
  var testFilename = function (filename) {
    var filename = filename.replace('.md', '');
    if ( filename.match(filenameRegex) ) {
      return true;
    }
    return false;
  }

  // For taking a filename and returning publish date, slug, and title
  //
  // @param filename {String}
  // @returns {Object} {date {Date}, slug {String}, title {String}}
  var parseFilename = function (filename) {
    if (!_.isString(filename)) {
      console.error('filename must be a string');
      return null;
    }
    var date, slug, title;
    var filename = filename.replace('.md', '');
    var parsed = filename.match(filenameRegex);
    if (!parsed) {
      return null;
    }
    // convert title into a real string
    slug = parsed[1];
    title = parsed[1].replace(/-/gi, ' ');
    title = titleCase(title);
    // convert date string to a date object
    date = new Date(parsed[2]);
    return { slug: slug, date: date, title: title };
  }


  // Used for sorting posts by time
  //
  // @param posts {Object}
  var sortPostsChrono = function (posts) {
    if (!_.isObject(posts)) {
      console.error('Posts should be Object');
      return null;
    }
    posts.sort(function (a, b) {
      if (a.published_date > b.published_date) {
        return 1;
      } else if (a.published_date < b.published_date) {
        return -1
      }
      return 0;
    });
    return posts;
  }


  // For returning an array of posts from the posts directory.
  // Will first look to see if posts have been stored in momory before
  // actually looking inside the folder and using fs.
  //
  // @returns promise
  var listPosts = function () {
    var defer = Q.defer();
    if (!_.isEmpty(posts)) {
      defer.resolve(posts);
      return defer.promise;
    }
    var output, parsed, title, filesLength;
    fs.readdir(postsDir, function (err, files) {
      files = _.filter(files, testFilename)
      files.forEach(function (filename) {
        readDocument(filename).then(function (doc) {
          parsed = parseFilename(filename);
          title = doc.attributes.title || parsed.title;
          output = {
            frontmatter: doc.attributes,
            body: doc.body,
            slug: parsed.slug,
            title: title,
            published_date: parsed.date.toString(),
            filename: filename
          };
          posts.push(output);
          if (posts.length === files.length) {
            defer.resolve( sortPostsChrono(posts) )
          }
        });
      });
    });
    return defer.promise;
  }


  // For looking inside a markdown document and returning the frontmatter
  // and raw markdown
  //
  // @param filename {String} The name of the markdown file
  // @returns promise
  var readDocument = function (filename) {
    var defer = Q.defer();
    fs.readFile(postsDir + '/' + filename, 'utf8',
    function (err, file) {
      if (err) {
        console.error(err);
        defer.reject()
        return defer.promise;
      }
      defer.resolve( frontmatter(file) );
    });
    return defer.promise;
  }

  // Do a search based on post slug
  var findPost = function (query) {
    var defer = Q.defer();
    listPosts().then(
    function (posts) {
      posts.forEach( function (post, i) {
        if (post.filename.indexOf(query) !== -1) {
          defer.resolve(post);
        } else if (i >= posts.length-1) {
          defer.reject('Could not find post: ' + query);
        }
      });
    });
    return defer.promise;
  }


  return {
    listPosts: listPosts,
    findPost: findPost
  }
}

module.exports = Fount;
