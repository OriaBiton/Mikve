const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.fn = functions.region('europe-west3').https
  .onCall(async (data, context) => {
  const uid = context.auth.uid;
  const score = data.score;
  const name = data.name;
  const db = admin.database();
  const latestStarTimePath = `users/${uid}/latestStarTimestamp`;
  let errorMsg;
  if (await isAllowed()) await star();
  else throw new functions.https
    .HttpsError('permission-denied', errorMsg);

  async function star(){
    const ref = db.ref(`mikvaot/${name}/rating`);
    const timeStamp = admin.database.ServerValue.TIMESTAMP;
    let rating;
    await ref.once('value', snap => rating = snap.val());
    rating.stars = calcNewRating();
    rating.voters++;
    await ref.set(rating).catch(e => {throw e});
    db.ref(latestStarTimePath).set(timeStamp).catch(e => {throw e});

    function calcNewRating(){
      const stars = rating.stars;
      const voters = rating.voters;
      return (stars * voters + score) / (voters + 1);
    }
  }

  async function isAllowed(){
    if (await isAllowedYet()) {
      if (isValidScore()) return true;
      else {
        errorMsg = score + ' is not a valid score. 1-5 int only.';
        return false;
      }
    }
    else {
      errorMsg = 'Not allowed to star yet.';
      return false;
    }

    function isValidScore(){
      if (score < 1 || score > 5) return false;
      if (!Number.isInteger(score)) return false;
      return true;
    }
    async function isAllowedYet(){
      let allowed = false;
      await db.ref(latestStarTimePath).once('value', snap => {
        const latestTimeStamp = snap.val();
        if (!latestTimeStamp) allowed = true;
        const halfDay = 60000; //should be 3 weeks
        if (new Date() - latestTimeStamp > halfDay) allowed = true;
      }).catch(e => {throw e});
      return allowed;
    }
  }
});
