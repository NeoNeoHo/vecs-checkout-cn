'use strict';

var app = require('../..');
import request from 'supertest';

var newReward;

describe('Reward API:', function() {

  describe('GET /api/rewards', function() {
    var rewards;

    beforeEach(function(done) {
      request(app)
        .get('/api/rewards')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          rewards = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      rewards.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/rewards', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/rewards')
        .send({
          name: 'New Reward',
          info: 'This is the brand new reward!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newReward = res.body;
          done();
        });
    });

    it('should respond with the newly created reward', function() {
      newReward.name.should.equal('New Reward');
      newReward.info.should.equal('This is the brand new reward!!!');
    });

  });

  describe('GET /api/rewards/:id', function() {
    var reward;

    beforeEach(function(done) {
      request(app)
        .get('/api/rewards/' + newReward._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          reward = res.body;
          done();
        });
    });

    afterEach(function() {
      reward = {};
    });

    it('should respond with the requested reward', function() {
      reward.name.should.equal('New Reward');
      reward.info.should.equal('This is the brand new reward!!!');
    });

  });

  describe('PUT /api/rewards/:id', function() {
    var updatedReward;

    beforeEach(function(done) {
      request(app)
        .put('/api/rewards/' + newReward._id)
        .send({
          name: 'Updated Reward',
          info: 'This is the updated reward!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedReward = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedReward = {};
    });

    it('should respond with the updated reward', function() {
      updatedReward.name.should.equal('Updated Reward');
      updatedReward.info.should.equal('This is the updated reward!!!');
    });

  });

  describe('DELETE /api/rewards/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/rewards/' + newReward._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when reward does not exist', function(done) {
      request(app)
        .delete('/api/rewards/' + newReward._id)
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
