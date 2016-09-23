'use strict';

describe('Service: Megamenu', function () {

  // load the service's module
  beforeEach(module('webApp'));

  // instantiate service
  var Megamenu;
  beforeEach(inject(function (_Discover_) {
    Megamenu = _Discover_;
  }));

  it('should do something', function () {
    expect(!!Megamenu).toBe(true);
  });

});
