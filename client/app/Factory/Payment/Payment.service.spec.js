'use strict';

describe('Service: Payment', function () {

  // load the service's module
  beforeEach(module('webApp'));

  // instantiate service
  var Payment;
  beforeEach(inject(function (_Payment_) {
    Payment = _Payment_;
  }));

  it('should do something', function () {
    expect(!!Payment).toBe(true);
  });

});
