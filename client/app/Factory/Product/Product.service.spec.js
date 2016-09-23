'use strict';

describe('Service: Product', function () {

  // load the service's module
  beforeEach(module('webApp'));

  // instantiate service
  var Product;
  beforeEach(inject(function (_Product_) {
    Product = _Product_;
  }));

  it('should do something', function () {
    expect(!!Product).toBe(true);
  });

});
