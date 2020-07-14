const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.fn = functions.region('europe-west3').https
  .onCall(async (data, context) => {
  const db = admin.database();
  //const hourRanges = await getRanges(mikveName);
  return await getTakenHours(data.mikveName);

  async function getTakenHours(name){
    const path = `appointments/${name}`;
    const taken = {};
    await db.ref(path).once('value',
      snap => snap.forEach(day => {
        const dayNum = day.key;
        taken[dayNum] = [];
        for (const hour in day.val())
          taken[dayNum].push(hour);
      }));
    return taken;
  }
  // Not used:
  async function getRanges(name){
    const path = `mikvaot/${name}/hours/${getSeason()}`;
    let ranges;
    await db.ref(path).once('value', snap => ranges = snap.val());
    return ranges;

    function getSeason(){
      const seasons = ['winter', 'summer'];
      return seasons[Math.floor(new Date().getMonth() / 12 * 2) % 2];
    }
  }
});
