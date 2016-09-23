'use strict';

describe('Service: Customer', function () {

  // load the service's module
  beforeEach(module('webApp'));

  // instantiate service
  var Customer;
  beforeEach(inject(function (_Customer_) {
    Customer = _Customer_;
  }));

  it('should do something', function () {
    expect(!!Customer).toBe(true);
  });

});
