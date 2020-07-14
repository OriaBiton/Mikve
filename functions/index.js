const admin = require('firebase-admin');

const getTakenHours = require('./get-taken-hours.js');

admin.initializeApp();

exports.getTakenHours = getTakenHours.fn;
