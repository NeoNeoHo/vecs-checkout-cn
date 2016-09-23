'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var ezshipCtrlStub = {
  index: 'ezshipCtrl.index',
  show: 'ezshipCtrl.show',
  create: 'ezshipCtrl.create',
  update: 'ezshipCtrl.update',
  destroy: 'ezshipCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var ezshipIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './ezship.controller': ezshipCtrlStub
});

describe('Ezship API Router:', function() {

  it('should return an express router instance', function() {
    ezshipIndex.should.equal(routerStub);
  });

  describe('GET /api/ezships', function() {

    it('should route to ezship.controller.index', function() {
      routerStub.get
        .withArgs('/', 'ezshipCtrl.index')
        .should.have.been.calledOnce;
    });

  });

  describe('GET /api/ezships/:id', function() {

    it('should route to ezship.controller.show', function() {
      routerStub.get
        .withArgs('/:id', 'ezshipCtrl.show')
        .should.have.been.calledOnce;
    });

  });

  describe('POST /api/ezships', function() {

    it('should route to ezship.controller.create', function() {
      routerStub.post
        .withArgs('/', 'ezshipCtrl.create')
        .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/ezships/:id', function() {

    it('should route to ezship.controller.update', function() {
      routerStub.put
        .withArgs('/:id', 'ezshipCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/ezships/:id', function() {

    it('should route to ezship.controller.update', function() {
      routerStub.patch
        .withArgs('/:id', 'ezshipCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/ezships/:id', function() {

    it('should route to ezship.controller.destroy', function() {
      routerStub.delete
        .withArgs('/:id', 'ezshipCtrl.destroy')
        .should.have.been.calledOnce;
    });

  });

});
