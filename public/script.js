"use strict";
// Globals
var lastActiveSection;
var subscribedToPush;
var selectedMikve;
const isMobile = checkIsMobile();
const sections = getSections();
const db = firebase.database();
const functions = firebase.app().functions('europe-west3');
const notyf = getNotyf();

// Invokations
if (isMobile) setMobileNav();
Listeners.addAllDocumentListeners();
Render.fullRender();
//serviceWorker();

// Function Definitions
function selectMikve(e){
  const sect = sections.chooseMikve;
  const card = e.target.closest('.card');
  const isActive = card.classList.contains('active');
  markMikve();
  fillDescription();
  setGlobalVar();
  setButton();

  function setGlobalVar(){
    selectedMikve = isActive ? null : card;
  }
  function fillDescription(){
    const txt = `✔️ בחרת במקווה "${card.name}", בכתובת ${card.address}.`;
    sect.querySelector('.description').innerText = isActive ? '' : txt;
  }
  function setButton(){
    sect.querySelector('#set-mikve-btn').disabled = isActive;
  }
  function markMikve(){
    const cardsDiv = card.closest('.mikve-cards');
    const checkmark = card.querySelector('.checkmark');
    if (isActive) return deactivate();
    cardsDiv.querySelectorAll('.card.active').forEach(deactivate);
    card.classList.add('active');
    unhide(checkmark);

    function deactivate(c){
      if (c) {
         c.classList.remove('active');
         hide(c.querySelector('.checkmark'));
      }
      else {
        card.classList.remove('active');
        hide(checkmark);
      }
    }
  }
}

async function subscribeToPushService(){
  if (subscribedToPush) return;
  if (!('Notification' in window))
    return console.log('This browser does not support notifications');
  Notification.requestPermission(status => {
    console.log('Notification permission status:', status);
  });
  const uid = Auth.getUser().uid;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    console.log('Not subscribed. Subscribing...');
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BOVb1ZRstdFCAjsZ7IcusPNen9Em_T7S5FGUJfC2wjL9eU1U8CoXIvxxambU7jDXEYOKYJsBzYtGCzShJK1CZ2E'
    });
  }
  else console.log('Already subscribed! Updating...');
  Database.setPushSubscription(uid, sub.toJSON());
  subscribedToPush = true;
}
function serviceWorker(){
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered!', reg))
      .catch(e => console.log('sw not registered...', e));
  }
}
function getSections(){
  return {
    enterViaSms: byId('enter-via-sms'),
    smsMsg: byId('sms-msg'),
    home: byId('home'),
    chooseMikve: byId('choose-mikve'),
    chooseTime: byId('choose-time'),
    settings: byId('settings')
  };
}
async function applySettings(e){
  e.preventDefault();
  const form = this;
  const newPass = getVal('new-pass');
  const newName = getVal('new-name');
  const hideContactChecked = isChecked('hide-contact');
  const hideContactChanged = hideContactChecked != hideContact;
  const user = Auth.getUser();
  let success;
  if (newPass) success = await Auth.updatePassword(user, newPass);
  if (newName) success = await Auth.setName(user, newName);
  if (hideContactChanged) success = await toggleHideContact(user, hideContactChecked);
  if (!success) return;
  nullVal('new-pass');
  nullVal('new-name');
  Render.Sections.settings();
  notyf.success('השינויים בוצעו בהצלחה.');

  function getVal(id){
    return form.querySelector('#' + id).value;
  }
  function nullVal(id){
    form.querySelector('#' + id).value = null;
  }
  function isChecked(id){
    return form.querySelector('#' + id).checked;
  }
}
function onSignInSubmit(e){
  e.preventDefault();
  let phone = byId('phone').value;
  phone = formatNumber(phone);
  Auth.sendSmsCode(phone);
}
function formatNumber(p){
  p = p.trim();
  if (!p.startsWith('0')) return p;
  return '+972' + p.slice(1);
}
async function registerUser(e){
  e.preventDefault();
  const form = q('#enter-via-sms form');
  const name = getVal('name');
  const phone = getVal('phone');
  console.log(name);

  const user = await Auth.registerUser(name, phone)
    .catch(err => Auth.showErrors(err));

  //Database.writeUserData(name, isSms ? phone : email);

  function getVal(id) {
    try { return form.querySelector('#' + id).value; }
    catch (e) {if (e instanceof TypeError) return null; else throw e;}
  }
}

function checkIsMobile(){
  const div = byId('is-nav');
  if (getComputedStyle(div).display == 'none') return false;
  else return true;
}
function setMobileNav(){
  const nav = byTag('nav')[0];
  let hamburger = {
    navToggle: nav.getElementsByClassName('nav-toggle')[0],
    nav: nav.getElementsByClassName('nav')[0],
    doToggle: function() {
      this.navToggle.classList.toggle('expanded');
      this.nav.classList.toggle('expanded');
    }
  };
  hamburger.navToggle.addEventListener('click', () => hamburger.doToggle());
  hamburger.nav.addEventListener('click', () => hamburger.doToggle());
}
function getActiveSection(){
  return q('section:not(.hidden)');
}
function closeModal(){
  let modals = Array.from(byClass('modal'));
  for (let m of modals) {
    if (!isHidden(m)){
      m.style.display = 'none';
      break;
    }
  }
}
function getNotyf(){
  loadCss('assets/notyf/notyf.min.css');
  return new Notyf({
    duration: 8000,
    position: {x: 'right', y: 'top'},
    dismissible: true,
    types: [{
      type: 'info',
      background: 'var(--secondary)',
      icon: false
    }]
  });
}
