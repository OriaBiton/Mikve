const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.fn = functions.region('europe-west3').https
  .onCall(async (data, context) => {
  const db = admin.database();
  const uid = context.auth.uid;
  const isAdmin = await checkAdmin();
  const userName = isAdmin ?
    data.admin.forName : context.auth.token.name;
  const phone = isAdmin ?
    data.admin.forPhone : context.auth.token.phone_number;
  const mikveName = data.mikveName;
  const time = new Date(data.time);
  const day = time.getDate();
  const month = time.getMonth() + 1;
  const year = time.getFullYear();
  const hour = data.hour; //value, not text - '0000'
  const key = generateAppointmentKey();
  const maxAppointments = 1;
  const path = `appointments/${mikveName}/${year}/${month}/${day}/${hour}`;
  if (isInThePast()) error('Appointment cannot be set to the past.');
  if (!(await isUserAllowed())) error('Not allowed to set.');
  if (await isTaken()) error('Time already taken.');
  setInAppointments();
  if (!isAdmin) setInUser();

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
      uid, phone, key, name: userName, setByAdmin: isAdmin
    };
    db.ref(path).set(appointment).catch(e => {throw e});
  }
  async function checkAdmin(){
    const claims = (await admin.auth().getUser(uid)).customClaims;
    if (!claims || !claims.admin) return false;
    if (claims.admin) return true;
    else return false;
  }
  function isInThePast(){ return new Date() > time }
  async function isTaken(){
    let taken;
    await db.ref(path).once('value', snap => taken = snap.exists());
    return taken;
  }
  async function isUserAllowed(){
    if (isAdmin) return true;
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
