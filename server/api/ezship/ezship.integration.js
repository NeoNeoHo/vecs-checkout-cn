'use strict';

var app = require('../..');
import request from 'supertest';

var newEzship;

describe('Ezship API:', function() {

  describe('GET /api/ezships', function() {
    var ezships;

    beforeEach(function(done) {
      request(app)
        .get('/api/ezships')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          ezships = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      ezships.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/ezships', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/ezships')
        .send({
          name: 'New Ezship',
          info: 'This is the brand new ezship!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newEzship = res.body;
          done();
        });
    });

    it('should respond with the newly created ezship', function() {
      newEzship.name.should.equal('New Ezship');
      newEzship.info.should.equal('This is the brand new ezship!!!');
    });

  });

  describe('GET /api/ezships/:id', function() {
    var ezship;

    beforeEach(function(done) {
      request(app)
        .get('/api/ezships/' + newEzship._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          ezship = res.body;
          done();
        });
    });

    afterEach(function() {
      ezship = {};
    });

    it('should respond with the requested ezship', function() {
      ezship.name.should.equal('New Ezship');
      ezship.info.should.equal('This is the brand new ezship!!!');
    });

  });

  describe('PUT /api/ezships/:id', function() {
    var updatedEzship;

    beforeEach(function(done) {
      request(app)
        .put('/api/ezships/' + newEzship._id)
        .send({
          name: 'Updated Ezship',
          info: 'This is the updated ezship!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedEzship = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedEzship = {};
    });

    it('should respond with the updated ezship', function() {
      updatedEzship.name.should.equal('Updated Ezship');
      updatedEzship.info.should.equal('This is the updated ezship!!!');
    });

  });

  describe('DELETE /api/ezships/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/ezships/' + newEzship._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when ezship does not exist', function(done) {
      request(app)
        .delete('/api/ezships/' + newEzship._id)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
