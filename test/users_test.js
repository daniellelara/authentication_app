var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var supertest = require('supertest');
var api = supertest('http://localhost:3000/api');
var mongoose = require('mongoose');
var User = require('../models/user');


afterEach(function(done) {
  mongoose.connect('mongodb://localhost/user-app', function(){
    User.create({ username: "lara", email: "y@gmail.com", password: "password",passwordConfirmation: "password" }, function(err, user){
        userId = user._id.toString();
        
    }); 
    User.create({ username: "abc", email: "test@gmail.com", password: "password", passwordConfirmation: "password"  }, function(err, usertwo){
        secondId = usertwo._id.toString();
        done(err);
    }); 

  });

});





describe('GET /users', function() {
  before(function(done) {
    api.post('/register')
      .set('Accept', 'application/json')
      .send({ username: "danielle", email: "danielle@gmail.com", password: "password", passwordConfirmation: "password" })
      .end(function(err, res){
        done(err);
      });
  });
  it('should return a 200 response', function(done) {
    api.get('/users')
      .set('Accept', 'application/json')
      .expect(200, done);
  });
  it('should return an array', function(done) {
    api.get('/users')
      .set('Accept', 'application/json')
      .end(function(err, res) {
        console.log(res.body);
        expect(res.body).to.be.an('array');
        done();
      });
  });
});  

describe('GET /users/:id', function() {
  it('should return a 200 response', function(done) {
    api.get('/users/' + userId)
      .set('Accept', 'application/json')
      .expect(200, done);
  });
  it('should return an object with a specific id', function(done) {
    api.get('/users/' + userId)
      .set('Accept', 'application/json')
      .end(function(err, res) {
        expect(res.body).to.have.property('_id', userId);
        done();
      });
    });
})

describe('Patch /users/:id', function(){
  it('should return a 200 response', function(done){
    console.log(secondId)
    api.patch('/users/' + secondId)
    .set('Accept', 'application/json')
    .send ({
      friends: userId
    })
    .expect(200, done);
  })
  it('should add an id to friends array', function(done) {
    api.patch('/users/' + secondId)
      .set('Accept', 'application/json')
      .send ({
        friends: userId
      })
      .end(function(err, res) {
        console.log(secondId, userId)
        console.log("whois this", res.body)
        res.body.should.have.property('friends');
        res.body.friends[0].should.equal(userId);
        done();
      });
    });
  it('should add an id to the connection', function(done) {
    api.get('/users/' + userId)
      .set('Accept', 'application/json')
      .end(function(err, res) {
        console.log("this is the other", res.body)
        expect(res.body.friends).to.equal([secondId]);
        done();
      });
    });
})