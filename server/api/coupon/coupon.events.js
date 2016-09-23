/**
 * Coupon model events
 */

'use strict';

import {EventEmitter} from 'events';
var Coupon = require('./coupon.model');
var CouponEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
CouponEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Coupon.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    CouponEvents.emit(event + ':' + doc._id, doc);
    CouponEvents.emit(event, doc);
  }
}

export default CouponEvents;
