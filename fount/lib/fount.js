'use strict';
var fs = require('fs');
var _ = require('lodash');
var Q = require('q');
var restify = require('restify');
var frontmatter = require('front-matter');

function Fount () {
  var _self = this;

  // For providing runtime options 
  var OPTS = {
    'posts': './writing',
    'port': 3868
  }

  // Routes are designed to be memorable 
  this.ROUTES = [
    { name: 'posts', endpoint: '/posts/all', method: 'getAllPosts' },
    { name: 'post', endpoint: '/post/:postName', method: 'getPost' } 
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
    var params;
    this.ROUTES.forEach( function (route) {
      SERVER.get(route.endpoint, function (req, res, next) {
        params = _.isEmpty(req.params) ? {} : req.params;
        _self.RouteMethods(route.method)(params).then( 
          function (output) {
          res.setHeader('content-type', 'application/json');
          res.send(output);
        }, function (reason) {
          res.setHeader('content-type', 'application/json');
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

    var output;
    fs.readdir(postsDir, function (err, files) {
      files.forEach(function (file) {
        readDocument(file).then(function (parsed) {
          output = parsed;
          parsed.filename = file;
          posts.push(parsed);
          if (posts.length === files.length) {
            defer.resolve(posts)
          }
        });
      });
    });
    return defer.promise;
  }

  // For peeking inside a markdown doc and returning the frontmatter
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