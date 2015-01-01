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
  post404: '/post/nothing-here'
}

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
    });
    res.on('end', function () {
      if (typeof res === 'object') {
        callback(data, res);
      }
    })
  })
  .on('error', function (err) { });
}


describe('Fount', function () {

  describe('#Init', function () {
    it('should return true when changing posts directory', function () {
      expect( app.set('posts', newPostsDir) ).to.be.ok;
    })

    it('should have set the posts directory to ' + newPostsDir, function () {
      expect( app.get('posts') ).to.equal(newPostsDir);
    })
  })


  describe('#REST Output', function () {
    before( function () {
      app.boot(newPort);
    });

    it('should send content-type: application/json header', function (done) {
      trigger( endpoints.posts, 
        function (data, res) {
        expect( res.headers['content-type'] ).to.equal('application/json');
        done();
      })
    })

    describe('All posts endpoint', function () {
      it(endpoints.posts + ' should return a list of all posts as JSON', function (done) {
        trigger( endpoints.posts, 
          function (data) {
          var dataJSON = JSON.parse(data);
          expect(dataJSON).to.be.an('array');
          expect(dataJSON).to.have.length(3);
          done();
        }); 
      });
    })

    describe('Single post endpoint', function () {
      it(endpoints.post + ' should return a single post as JSON', function (done) {
        trigger( endpoints.post, 
          function (data) {
          var dataJSON = JSON.parse(data);
          expect(dataJSON).to.be.an('array');
          expect(dataJSON).to.have.length(1);
          done();
        }); 
      })

      it(endpoints.post404 + ' should return a 404 when post doesnt exist', function (done) {
        trigger( endpoints.post404, 
          function (data, res) {
          expect(res.statusCode).to.equal(404);
          done();
        }); 
      });
    });
  })
})
