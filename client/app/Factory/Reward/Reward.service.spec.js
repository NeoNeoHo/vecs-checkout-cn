'use strict';

describe('Service: Reward', function () {

  // load the service's module
  beforeEach(module('webApp'));

  // instantiate service
  var Reward;
  beforeEach(inject(function (_Reward_) {
    Reward = _Reward_;
  }));

  it('should do something', function () {
    expect(!!Reward).toBe(true);
  });

});
