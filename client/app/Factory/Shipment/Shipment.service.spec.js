'use strict';

describe('Service: Shipment', function () {

  // load the service's module
  beforeEach(module('webApp'));

  // instantiate service
  var Shipment;
  beforeEach(inject(function (_Shipment_) {
    Shipment = _Shipment_;
  }));

  it('should do something', function () {
    expect(!!Shipment).toBe(true);
  });

});
