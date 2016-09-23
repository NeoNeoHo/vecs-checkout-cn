'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var rewardCtrlStub = {
  index: 'rewardCtrl.index',
  show: 'rewardCtrl.show',
  create: 'rewardCtrl.create',
  update: 'rewardCtrl.update',
  destroy: 'rewardCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var rewardIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './reward.controller': rewardCtrlStub
});

describe('Customer API Router:', function() {

  it('should return an express router instance', function() {
    rewardIndex.should.equal(routerStub);
  });

  describe('GET /api/rewards', function() {

    it('should route to reward.controller.index', function() {
      routerStub.get
        .withArgs('/', 'rewardCtrl.index')
        .should.have.been.calledOnce;
    });

  });

  describe('GET /api/rewards/:id', function() {

    it('should route to reward.controller.show', function() {
      routerStub.get
        .withArgs('/:id', 'rewardCtrl.show')
        .should.have.been.calledOnce;
    });

  });

  describe('POST /api/rewards', function() {

    it('should route to reward.controller.create', function() {
      routerStub.post
        .withArgs('/', 'rewardCtrl.create')
        .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/rewards/:id', function() {

    it('should route to reward.controller.update', function() {
      routerStub.put
        .withArgs('/:id', 'rewardCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/rewards/:id', function() {

    it('should route to reward.controller.update', function() {
      routerStub.patch
        .withArgs('/:id', 'rewardCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/rewards/:id', function() {

    it('should route to reward.controller.destroy', function() {
      routerStub.delete
        .withArgs('/:id', 'rewardCtrl.destroy')
        .should.have.been.calledOnce;
    });

  });

});
