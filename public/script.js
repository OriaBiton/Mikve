"use strict";
// Globals
var lastActiveSection;
var subscribedToPush;
var isAdmin;
var selectedMikve;
var selectedTime = {};
var isAppointmentSet;
var tdToClick;
const isMobile = checkIsMobile();
const sections = getSections();
const db = firebase.database();
const functions = firebase.app().functions('europe-west3');
const notyf = getNotyf();
Hebcal.defaultCity = 'Jerusalem';

// Invokations
if (isMobile) setMobileNav();
Listeners.addAllDocumentListeners();
Render.setUI();
//serviceWorker();

// Function Definitions
function enableLoadappointmentListBtn(){
  byId('load-appointment-list-btn').disabled = false;
}
async function loadAppointments(){
  Render.loading(true);
  const name = selectedMikve.key;
  const date = getDate();
  await Database.bindAppointmentList(name, date);
  Render.loading();
  notyf.success('הרשימה נטענה בהצלחה ותתעדכן בעמוד אוטומטית');

  function getDate(){
    const obj = {};
    const dateInputs = qAll('input[name="load-appointments-date"]');
    for (const i of dateInputs) {
      const part = i.dataset.part;
      obj[part] = i.value;
    }
    return obj;
  }
}
async function deleteAppointment(){
  Render.loading(true);
  const del = functions.httpsCallable('deleteAppointment');
  const data = {
    mikveName: selectedMikve.key,
    time: getSelectedTime(),
    hour: selectedTime.hour.value
  };
  await del(data).catch(e => {throw e});
  resetUI();
  Render.loading();

  function resetUI(){
    isAppointmentSet = false;
    selectedTime = {};
    selectedMikve = null;
    const activeMikve = q('mikve-card.active');
    const activeDate = q('td.date.active');
    const confirmTable = q('#confirm appointment-table');
    Render.showSetAppartmentButton();
    if (activeMikve) activeMikve.click();
    if (activeDate) activeDate.click();
    if (confirmTable) confirmTable.removeSelf();
  }
}
async function setAppointment(){
  Render.loading(true);
  const set = functions.httpsCallable('setAppointment');
  const obj = {time: selectedTime, mikve: selectedMikve};
  const adminObj = {
    forName: byId('admin-appointment-name-input').value,
    forPhone: byId('admin-appointment-phone-input').value
  };
  const data = {
    mikveName: selectedMikve.key,
    time: getSelectedTime(),
    hour: selectedTime.hour.value,
    obj: JSON.stringify(obj),
    admin: isAdmin ? adminObj : null
  };
  await set(data).catch(e => {throw e});
  isAppointmentSet = true;
  Render.Sections.home();
  notyf.success('התור שלך נרשם בהצלחה!');
}
function getSelectedTime(){
  const d = selectedTime.date;
  const h = selectedTime.hour;
  return new Date(`${d.gregYear}-${d.gregMonthInt}-${d.gregDay} ${h.text}`).getTime();
}
function setHour(){
  const sect = sections.chooseTime;
  const td = sect.querySelector('td.active');
  const data = td.dataset;
  const select = sect.querySelector('select');
  const selected = select.options[select.selectedIndex];
  const hour = selected.text
  const hasValue = selected.value;

  fillDescription();
  setButton();
  setGlobalVar();

  function setGlobalVar(){
    selectedTime.date = data;
    selectedTime.hour = {value: hasValue, text: hour};
  }
  function setButton(){
    sect.querySelector('#set-time-btn').disabled = !hasValue;
  }
  function fillDescription() {
    const p = sect.querySelector('.description');
    const txt = `✔️ בחרת ביום ${Format.toWeekday(data.dayOfWeek)}, ${data.hebDay} ב${data.hebMonth}\
      (${data.gregDay}/${data.gregMonthInt}/${data.gregYear}), בשעה ${hour}.`;
    p.innerText = hasValue ? txt : '';
  }
}
function setDate(e){
  const td = e.target.nodeName == 'TD' ?
    e.target : e.target.closest('td');
  const isActive = td.classList.contains('active');
  const sect = sections.chooseTime;
  const data = td.dataset;
  if (!data.ready) {
    notyf.info('טוען לוח שעות. כמה רגעים בבקשה...');
    tdToClick = td;
    return;
  }
  if (tdToClick && tdToClick.isSameNode(td)){
    tdToClick = null;
    notyf.success('לוח השעות מוכן! את מוזמנת לבחור שעה.');
  }

  markDate();
  fillHourSelect();
  clearDescription();
  disableButton();

  function disableButton(){
    sect.querySelector('#set-time-btn').disabled = true;
  }
  function clearDescription(){
    sect.querySelector('.description').innerText = '';
  }
  function fillHourSelect(){
    const select = byId('select-hour');
    select.disabled = isActive;
    clear();
    addAllowed();
    disableTaken();

    function disableTaken(){
      let taken = data.takenHours;
      if (!taken) return;
      taken = taken.split(',');
      for (const t of taken){
        const o = select.querySelector(`[value="${t}"]`);
        o.disabled = true;
        o.innerText += ' ❌';

      }
    }
    function addAllowed(){
      const allowedHours = data.allowedHours.split(',');
      for (const hour of allowedHours) {
        const opt = document.createElement('option');
        opt.value = hour;
        opt.innerText = Format.addColon(hour);
        select.add(opt);
      }
    }
    function clear(){
      for (let i = select.length; i > 0; i--) select.remove(i);
    }
  }
  function markDate(){
    const tbody = td.closest('tbody');
    if (isActive) return deactivate();
    const currentlyActive = tbody.querySelector('td.active');
    deactivate(currentlyActive);
    td.classList.add('active');

    function deactivate(c){
      if (c) c.classList.remove('active');
      else td.classList.remove('active');
    }
  }
}
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
    const currentlyActive = cardsDiv.querySelector('.card.active');
    if (isActive) return deactivate();
    deactivate(currentlyActive);
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
    confirm: byId('confirm'),
    appointments: byId('appointments'),
    settings: byId('settings')
  };
}
async function applySettings(e){
  e.preventDefault();
  const form = this;
  const newName = getVal('new-name');
  const user = Auth.getUser();
  if (newName) await Auth.setName(user, newName);
  nullVal('new-name');
  Render.Sections.settings();
  notyf.success('השינויים בוצעו בהצלחה.');

  function getVal(id){
    return form.querySelector('#' + id).value;
  }
  function nullVal(id){
    form.querySelector('#' + id).value = null;
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
