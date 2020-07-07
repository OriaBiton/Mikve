firebase.auth().languageCode = 'he';
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('signup-submit', {
  size: 'invisible',
  callback: response => {
    // reCAPTCHA solved, allow signInWithPhoneNumber.
    console.log('reCAPTCHA solved');
    onSignInSubmit();
  }
});
firebase.auth().onAuthStateChanged(user => {
  if (user) console.log('Welcome, ' + user.displayName);
  else console.log('No user is signed in.');
  Render.Sections.renderSections();
});

class Auth {

  static sendSmsCode(phone){
    const appVerifier = window.recaptchaVerifier;
    firebase.auth().signInWithPhoneNumber(phone, appVerifier)
    .then(confirmationResult => {
      // SMS sent. Prompt user to type the code from the message, then sign the
      // user in with confirmationResult.confirm(code).
      Render.Sections.activate('smsMsg');
      window.confirmationResult = confirmationResult;
    }).catch(e => {
      console.error(e);
      window.recaptchaVerifier.render().then(widgetId =>
        grecaptcha.reset(widgetId));
    });
  }

  static async registerUser(name, phone){
    const code = byId('sms-code').value;
    const result = await confirmationResult.confirm(code)
      .catch(e => Auth.showErrors(e));
    // User signed in successfully.
    await Auth.setName(result.user, name, true)
      .catch(e => { throw e });
    return result.user;
  }

  static signOut(){
    const user = Auth.getUser();
    if (!user){console.log('no one is logged in!'); return;}
    const name = user.displayName;
    firebase.auth().signOut().then(() =>
      console.log(name + ' logged out.'))
      .catch(err => Auth.showErrors(err));
    location.reload();
  }

  static getUser(){
    return firebase.auth().currentUser;
  }

  static async setName(u, n, notDb){
    await u.updateProfile({ displayName: n })
    .catch(err => { Auth.showErrors(err); throw err; });
    console.log('The name is: ' + u.displayName);
    if (notDb) return;
    await Database.changeUserName(u.uid, u.displayName);
    return true;
  }

  static authProvider(){return Auth.getUser().providerData[0].providerId;}

  static showErrors(err){
    let notification;
    const msg = err.message;
    console.log(msg);
    const handlers = [{
      identifier: 'SMS verification code used to create the phone auth credential is invalid',
      notif: 'הקוד שהזנתם שגוי. אנא נסו שנית.',
      action: null
    }];
    for (const handler of handlers){
      if (msg.includes(handler.identifier)){
        notification = handler.notif;
        if (handler.action) handler.action();
        notyf.error(notification);
        break;
      }
    }
    throw new Error(msg);
  }
}
