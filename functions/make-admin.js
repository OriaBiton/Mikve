const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.fn = functions.region('europe-west3')
  .auth.user().onCreate(async user => {
  const uid = user.uid;
  const db = admin.database();
  const phone = formatNumber(user.phoneNumber);
  if (await isAdmin(phone))
    await admin.auth().setCustomUserClaims(uid, {admin: true});

  async function isAdmin(p){
    let admin = false;
    await db.ref('admins').once('value', snap => {
      const phones = Object.keys(snap.val());
      if (phones.includes(p)) admin = true;
    }); 
    return admin;
  }
  function formatNumber(n){ return n.replace('+972', '0') }

});
