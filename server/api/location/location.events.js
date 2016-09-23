/**
 * Location model events
 */

'use strict';

import {EventEmitter} from 'events';
var Location = require('./location.model');
var LocationEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
LocationEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Location.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    LocationEvents.emit(event + ':' + doc._id, doc);
    LocationEvents.emit(event, doc);
  }
}

export default LocationEvents;
