const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.fn = functions.region('europe-west3').https
  .onCall(async (data, context) => {
  const db = admin.database();
  const uid = context.auth.uid;
  const phone = context.auth.token.phone_number;
  const mikveName = data.mikveName;
  const day = data.day;
  const month = data.month;
  const year = data.year;
  const hour = data.hour;
  const key = generateAppointmentKey();
  const maxAppointments = 1;
  const path = `appointments/${mikveName}/${day}/${hour}`;
  if (!(await isUserAllowed())) error('Not allowed to set.');
  if (await isTaken()) error('Time already taken.');
  setInAppointments();
  setInUser();

  function setInUser(){
    const appointment = {
      mikve: mikveName, day, month, year, hour, data: data.obj
    };
    const userPath = `users/${uid}/appointments/${key}`;
    const countPath = `users/${uid}/stats/totalAppointments`;
    db.ref(userPath).set(appointment).catch(e => {throw e});
    db.ref(countPath).transaction(val => { return (val || 0) + 1 });
  }
  function setInAppointments(){
    const appointment = {
      uid, phone, key, name: context.auth.token.name
    };
    db.ref(path).set(appointment).catch(e => {throw e});
  }
  async function isTaken(){
    let taken;
    await db.ref(path).once('value', snap => taken = snap.exists());
    return taken;
  }
  async function isUserAllowed(){
    let allowed;
    await db.ref(`users/${uid}/appointments`).once('value', snap =>
      allowed = snap.numChildren() < maxAppointments);
    return allowed;
  }
  function generateAppointmentKey(){
    return `${mikveName}-${day}-${month}-${year}-${hour}-${uid}`;
  }
  function error(t){
    throw new functions.https.HttpsError('permission-denied', t);
  }
});
