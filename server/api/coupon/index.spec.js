'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var couponCtrlStub = {
  index: 'couponCtrl.index',
  show: 'couponCtrl.show',
  create: 'couponCtrl.create',
  update: 'couponCtrl.update',
  destroy: 'couponCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var couponIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './coupon.controller': couponCtrlStub
});

describe('Coupon API Router:', function() {

  it('should return an express router instance', function() {
    couponIndex.should.equal(routerStub);
  });

  describe('GET /api/coupons', function() {

    it('should route to coupon.controller.index', function() {
      routerStub.get
        .withArgs('/', 'couponCtrl.index')
        .should.have.been.calledOnce;
    });

  });

  describe('GET /api/coupons/:id', function() {

    it('should route to coupon.controller.show', function() {
      routerStub.get
        .withArgs('/:id', 'couponCtrl.show')
        .should.have.been.calledOnce;
    });

  });

  describe('POST /api/coupons', function() {

    it('should route to coupon.controller.create', function() {
      routerStub.post
        .withArgs('/', 'couponCtrl.create')
        .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/coupons/:id', function() {

    it('should route to coupon.controller.update', function() {
      routerStub.put
        .withArgs('/:id', 'couponCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/coupons/:id', function() {

    it('should route to coupon.controller.update', function() {
      routerStub.patch
        .withArgs('/:id', 'couponCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/coupons/:id', function() {

    it('should route to coupon.controller.destroy', function() {
      routerStub.delete
        .withArgs('/:id', 'couponCtrl.destroy')
        .should.have.been.calledOnce;
    });

  });

});
