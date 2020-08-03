class Database {
  static async getLatestStarTimestamp(){
    const uid = Auth.getUser().uid;
    const path = `users/${uid}/latestStarTimestamp`;
    let ts;
    await db.ref(path).once('value', s => ts = s.val());
    return ts;
  }
  static async bindAppointmentList(name, date){
    if (Database.appointmentListRef) Database.appointmentListRef.off('value');
    const path = `appointments/${name}/${date.year}/${date.month}/${date.day}`;
    Database.appointmentListRef = db.ref(path);
    await db.ref(path).on('value', Render.adminAppointmentList);
  }
  static async getMikvaot(){
    let s;
    await firebase.database().ref('mikvaot')
      .once('value', snap => s = snap);
    return s;
  }
  static setPushSubscription(uid, sub){
    const path = `users/${uid}/pushSubscription`;
    db.ref(path).set(sub).catch(e => {throw e});
  }
  static async getCount(path, el){
    let count;
    await db.ref(path).once('value', snapshot => {
      count = snapshot.numChildren();
      if (el) el.innerText = count;
    }, e => {throw e});
    return count;
  }
  static async dataExists(path){
    let exists;
    await db.ref(path).once('value', snapshot => {
      exists = snapshot.exists();
    }, err => {throw err});
    return exists;
  }
  static async useOnVal(path, cb, arg){
    db.ref(path).on('value', snap => cb(snap, arg),
      e => {throw e});
  }
  static async getValOnce(path){
    let v;
    await db.ref(path).once('value', s => v = s.val(),
      e => {throw e});
    return v;
  }
  static async set(path, v){
    await db.ref(path).set(v).catch(e => {throw e});
  }

}
