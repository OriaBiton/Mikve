const admin = require('firebase-admin');

const getTakenHours = require('./get-taken-hours.js');
const setAppointment = require('./set-appointment.js');
const deleteAppointment = require('./delete-appointment.js');
const makeAdmin = require('./make-admin.js');
const starMikve = require('./star-mikve.js');
admin.initializeApp();

exports.getTakenHours = getTakenHours.fn;
exports.setAppointment = setAppointment.fn;
exports.deleteAppointment = deleteAppointment.fn;
exports.makeAdmin = makeAdmin.fn;
exports.starMikve = starMikve.fn;
