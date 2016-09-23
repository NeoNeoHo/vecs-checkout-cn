'use strict';

describe('Service: Promotion', function () {

  // load the service's module
  beforeEach(module('webApp'));

  // instantiate service
  var Promotion;
  beforeEach(inject(function (_Promotion_) {
    Promotion = _Promotion_;
  }));

  it('should do something', function () {
    expect(!!Promotion).toBe(true);
  });

});
