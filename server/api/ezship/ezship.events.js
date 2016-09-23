/**
 * Ezship model events
 */

'use strict';

import {EventEmitter} from 'events';
var Ezship = require('./ezship.model');
var EzshipEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
EzshipEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Ezship.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    EzshipEvents.emit(event + ':' + doc._id, doc);
    EzshipEvents.emit(event, doc);
  }
}

export default EzshipEvents;
