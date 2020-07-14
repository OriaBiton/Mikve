const admin = require('firebase-admin');

const getTakenHours = require('./get-taken-hours.js');
const setAppointment = require('./set-appointment.js');

admin.initializeApp();

exports.getTakenHours = getTakenHours.fn;
exports.setAppointment = setAppointment.fn;
