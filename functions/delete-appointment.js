const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.fn = functions.region('europe-west3').https
  .onCall(async (data, context) => {
  const db = admin.database();
  const uid = context.auth.uid;
  const mikveName = data.mikveName;
  const day = data.day;
  const hour = data.hour;
  const path = `appointments/${mikveName}/${day}/${hour}`;
  remove();

  async function remove(){
    const key = await getKey();
    db.ref(path).remove().catch(e => {throw e});
    db.ref(`users/${uid}/appointments/${key}`).remove()
      .catch(e => {throw e});

    async function getKey(){
      let k;
      await db.ref(path + '/key').once('value', snap => k = snap.val())
        .catch(e => {throw e});
      return k;
    }
  }
});
