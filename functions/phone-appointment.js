const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.fn = functions.region('europe-west3').https
.onRequest(async (req, res) => {
  const name = req.query.name;
  res.status(200).send('ok\n' + name);
});
