const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.fn = functions.region('europe-west3').https
  .onCall(async (data, context) => {
  const db = admin.database();
  const dates = data.dates; // array of "allowed" datasets
  const paths = getNeededPaths();
  const taken = {};
  /* eslint-disable no-await-in-loop */
  for (const path of paths) {
    await db.ref(path).once('value', snap => snap.forEach(day => {
      const dayNum = day.key;
      taken[dayNum] = [];
      for (const hour in day.val())
      taken[dayNum].push(hour);
    }));
  }
  return taken;// Object of days in month, each is array of taken hours.

  function getNeededPaths(){
    const months = []; // 7, 8...
    const paths = [];
    for (const date of dates) {
      const month = date.gregMonthInt;
      if (!months.includes(month)) {
        const year = date.gregYear;
        months.push(month);
        paths.push(`appointments/${data.mikveName}/${year}/${month}`);
      }
    }
    return paths;
  }
});
