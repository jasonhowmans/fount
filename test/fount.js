var http = require('http');
var mocha = require('mocha');
var expect = require('chai').expect;
var Fount = require('../fount/lib/fount');
var app = new Fount();

var newPostsDir = __dirname + '/posts';
var newPort = 8090;
var host = '0.0.0.0';
var endpoints = {
  posts: '/posts/all',
  post: '/post/what-why-when',
  post404: '/post/nothing-here',
  postWithTitle: '/post/this-aint-the-title'
}
var numPosts = endpoints.length;

// Just a lil helper for pulling data from endpoints
var trigger = function (endpoint, callback) {
  var data = '';
  http.get({
    hostname: host,
    path: endpoint,
    port: newPort,
    agent: false
    }, 
    function (res) {
    res.on('data', function (chunk) {
      data += chunk;
    })
    res.on('end', function () {
      if (typeof res === 'object') {
        callback( JSON.parse(data), res );
      }
    })
  })
  .on('error', function (err) { })
}


describe('Fount', function () {


  describe('#Init', function () {
    it('should return true when changing posts directory', function () {
      expect( app.set('posts', newPostsDir) ).to.be.ok;
    })

    it('should have set the posts directory to ' + newPostsDir, function () {
      expect( app.get('posts') ).to.equal(newPostsDir);
    })

    it('should ignore files that arent in format title-2015-01-01.md', function () {
      
    });
  })


  describe('#REST Endpoints', function () {

    before( function () {
      app.boot(newPort);
    })


    describe('All endpoints', function () {
      it('should send content-type: application/json header', function (done) {
        trigger( endpoints.posts, 
          function (data, res) {
          expect( res.headers['content-type'] ).to.equal('application/json');
          done();
        })
      })

      it('should return published_date, title and slug attributes', function (done) {
        trigger( endpoints.posts, 
          function (data, res) {
          expect(data.posts[0]).to.contain.keys( ['published_date', 'slug', 'title'] );
          done();
        })
      })

      it('should return `title` frontmatter attribute instead of generating a title from filename', function (done) {
        trigger( endpoints.postWithTitle, 
          function (data, res) {
          expect(data.post[0].title).to.equal('This is the title');
          done();
        })
      })
    })


    describe('All posts endpoint', function () {
      it(endpoints.posts + ' should return a list of all posts as JSON', function (done) {
        trigger( endpoints.posts, 
          function (data) {
          expect(data.posts).to.be.an('array');
          expect(data.posts).to.have.length(4);
          done();
        }) 
      })

      it('should order posts chronologically', function (done) {
        var last;
        trigger( endpoints.posts, 
          function (data) {
          data.posts.forEach(function (item) {
            if (!last) {
              last = item;
            }
            expect(last.published_date > item.published_date).to.be.false;
            last = item;
          })
          done();
        })
      })
    })


    describe('Single post endpoint', function () {
      it(endpoints.post + ' should return a single post as JSON', function (done) {
        trigger( endpoints.post, 
          function (data) {
          expect(data.post).to.be.an('array');
          expect(data.post).to.have.length(1);
          done();
        }) 
      })

      it(endpoints.post404 + ' should return a 404 when post doesnt exist', function (done) {
        trigger( endpoints.post404, 
          function (data, res) {
          expect(res.statusCode).to.equal(404);
          done();
        }) 
      })
    })
  })
})
