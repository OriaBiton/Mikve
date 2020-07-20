const admin = require('firebase-admin');

const getTakenHours = require('./get-taken-hours.js');
const setAppointment = require('./set-appointment.js');
const deleteAppointment = require('./delete-appointment.js');
const makeAdmin = require('./make-admin.js');
const phoneAppointment = require('./phone-appointment.js');

admin.initializeApp();

exports.getTakenHours = getTakenHours.fn;
exports.setAppointment = setAppointment.fn;
exports.deleteAppointment = deleteAppointment.fn;
exports.makeAdmin = makeAdmin.fn;
exports.phoneAppointment = phoneAppointment.fn;
