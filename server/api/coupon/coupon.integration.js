'use strict';

var app = require('../..');
import request from 'supertest';

var newCoupon;

describe('Coupon API:', function() {

  describe('GET /api/coupons', function() {
    var coupons;

    beforeEach(function(done) {
      request(app)
        .get('/api/coupons')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          coupons = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      coupons.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/coupons', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/coupons')
        .send({
          name: 'New Coupon',
          info: 'This is the brand new coupon!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newCoupon = res.body;
          done();
        });
    });

    it('should respond with the newly created coupon', function() {
      newCoupon.name.should.equal('New Coupon');
      newCoupon.info.should.equal('This is the brand new coupon!!!');
    });

  });

  describe('GET /api/coupons/:id', function() {
    var coupon;

    beforeEach(function(done) {
      request(app)
        .get('/api/coupons/' + newCoupon._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          coupon = res.body;
          done();
        });
    });

    afterEach(function() {
      coupon = {};
    });

    it('should respond with the requested coupon', function() {
      coupon.name.should.equal('New Coupon');
      coupon.info.should.equal('This is the brand new coupon!!!');
    });

  });

  describe('PUT /api/coupons/:id', function() {
    var updatedCoupon;

    beforeEach(function(done) {
      request(app)
        .put('/api/coupons/' + newCoupon._id)
        .send({
          name: 'Updated Coupon',
          info: 'This is the updated coupon!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedCoupon = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedCoupon = {};
    });

    it('should respond with the updated coupon', function() {
      updatedCoupon.name.should.equal('Updated Coupon');
      updatedCoupon.info.should.equal('This is the updated coupon!!!');
    });

  });

  describe('DELETE /api/coupons/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/coupons/' + newCoupon._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when coupon does not exist', function(done) {
      request(app)
        .delete('/api/coupons/' + newCoupon._id)
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
