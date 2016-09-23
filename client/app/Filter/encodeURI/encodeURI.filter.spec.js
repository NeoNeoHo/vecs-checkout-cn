'use strict';

describe('Filter: encodeURI', function () {

  // load the filter's module
  beforeEach(module('webApp'));

  // initialize a new instance of the filter before each test
  var encodeURI;
  beforeEach(inject(function ($filter) {
    encodeURI = $filter('encodeURI');
  }));

  it('should return the input prefixed with "encodeURI filter:"', function () {
    var text = 'angularjs';
    expect(encodeURI(text)).toBe('encodeURI filter: ' + text);
  });

});
