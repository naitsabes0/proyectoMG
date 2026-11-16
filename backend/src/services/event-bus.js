const { EventEmitter } = require('events');

const appointmentEvents = new EventEmitter();
appointmentEvents.setMaxListeners(0);

module.exports = { appointmentEvents };
