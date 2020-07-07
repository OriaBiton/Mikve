"use strict";
// Globals
var activeAppartmentNode;
var lastActiveSection;
var searchFilterArray;
var hideContact;
var subscribedToPush;
const isMobile = checkIsMobile();
const sections = getSections();
const db = firebase.database();
const functions = firebase.app().functions('europe-west3');
const notyf = getNotyf();

// Invokations
if (isMobile) setMobileNav();
Listeners.addAllDocumentListeners();
//serviceWorker();

// Function Definitions
function markMikve(e){
  const card = e.target.closest('.mikve');
  const cardsDiv = card.closest('mikve-cards');
  if (card.classList.contains('active')){
    card.classList.remove('active');
    return;
  }
  cardsDiv.querySelectorAll('.mikve.card.active').forEach(
    c => c.classList.remove('active'));
  card.classList.add('active');
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
async function toggleHideContact(user, isChecked){
  const path = `users/${user.uid}/hideContact`;
  await Database.set(path, isChecked);
  hideContact = isChecked;
  if (isChecked)
    notyf.info('ביטלתם את האפשרות ליצור איתכם קשר דרך האפליקציה.');
  else notyf.success('סימנתם שמותר לדיירים ליצור איתכם קשר דרך האפליקציה.');
  return true;
}
function filterBySearch(e){
  if (e.target.value.length < 2) return unfilterBySearch();
  const search = e.target.value;
  const filtered = searchFilterArray
    .filter(pair => pair.text.includes(search));
  const apBtns = sections.lobby.getElementsByTagName('appartment-button');
  for (const btn of apBtns) {
    let toHide = true;
    const btnNum = btn.dataset.num;
    for (const pair of filtered) {
      if (btnNum == pair.num) toHide = false;
    }
    if (toHide) hide(btn);
    else unhide(btn);
  }
  unhide(byId('filter-warning'));
}
function unfilterBySearch(){
  const apBtns = sections.lobby.getElementsByTagName('appartment-button');
  for (const btn of apBtns) unhide(btn);
  hide(byId('filter-warning'));
}
function getSearchFilterObj(){
  if (searchFilterArray) return;
  let pairs = [];
  for (const apInfo of byTag('appartment-info')) {
    let pair = { text: [] };
    pair.num = apInfo.dataset.num;
    const lis = apInfo.getElementsByTagName('li');
    for (const li of lis) pair.text.push(getCleanText(li));
    pair.text.push(apInfo.querySelector('.appartment-name').innerText);
    pairs.push(pair);
  }
  searchFilterArray = pairs;

  function getCleanText(li){
    const clone = li.cloneNode(true);
    const btns = clone.querySelector('.buttons');
    clone.querySelector('p').remove();
    if (btns) btns.remove();
    return clone.innerText.trim();
  }
}
async function updateAppartmentName(e){
  e.preventDefault();
  const div = this.closest('.head-msg');
  const name = div.querySelector('input').value;
  if (!name || name.length < 2)
    return notyf.error('אנא בחרו שם בן 2 תווים לפחות.');
  const lobbyKey = sections.lobby.dataset.key;
  const num = sections.lobby.dataset.num;
  await Database.setAppartmentName(lobbyKey, num, name);
  notyf.success(`שם הדירה שונה בהצלחה ל"${name}".
    כעת יהיה לשאר הדיירים קל יותר לזהות אתכם בלובי הדיגיטלי.`);
  hide(div);
}
function closePromptFill(){
  const div = this.closest('.head-msg');
  hide(div);
}

async function addItem(e){
  e.preventDefault();
  const type = this.dataset.type;
  const input = this.querySelector(`#${type}-description`);
  const btn = this.querySelector('button');
  disable();
  const sect = sections.lobby;
  const lobbyKey = sect.dataset.key;
  const num = sect.dataset.num;
  const name = Auth.getUser().displayName;
  const text = this.querySelector(`#${type}-description`).value;
  if (!verify()) return enable();
  await Database.addItem(type, text, lobbyKey, num, name);
  Render.userItemLists();
  notyf.success(`הוספתם "${text}" לרשימה.`);
  enable();

  function enable(){
    input.disabled = false;
    btn.disabled = false;
  }
  function disable(){
    input.disabled = true;
    btn.disabled = true;
  }
  function verify(){
    if (text == '' || text.length < 2) {
      notyf.error('התוכן ריק או קצר מדי.');
      return false;
    }
    return true;
  }
}
async function enterLobby(btn){
  const tr = btn.closest('tr');
  const placeId = tr.dataset.placeId;
  let entry = tr.querySelector('[data-entry]').innerText;
  entry = Validate.entryToEnglish(entry);
  const num = tr.querySelector('[data-appartment-num]').innerText;
  await Render.Sections.lobby(placeId, entry, num);
  Database.bindLobby(placeId, entry);
  subscribeToPushService();
}
async function deleteAddress(btn){
  const uid = Auth.getUser().uid;
  const tr = btn.closest('tr');
  const pushKey = tr.dataset.key;
  await Database.deleteAppartmentFromUser(uid, pushKey);

  const placeId = tr.dataset.placeId;
  let entry = tr.entry;
  let num = tr.appartmentNum;
  entry = Validate.entryToEnglish(entry);
  num = Validate.formatAppartment(num);

  notyf.info('הכתובת נמחקה.');
  Render.addressTable(uid);
}
async function addAddress(){
  const uid = Auth.getUser().uid;
  const addressName = byId('map').dataset.name;
  const entryEng = getVal('select-entry');
  let entryHeb;
  let appart = getVal('select-appartment');
  const placeId = byId('map').dataset.placeId;
  if (!validate()) return;
  await Database.writeAddressToUser(placeId, uid, addressName, entryHeb, appart);

  notyf.success('הכתובת נוספה. לחצו על הכפתור "לובי" כדי להיכנס.');
  Render.addressTable(uid);
  setVal('address-input', null);

  function validate(){
    if (!placeId) return error('נא להזין כתובת מחדש.', clear);
    if (addressName == 'undefined' || !addressName)
      return error('הכתובת אינה תקינה.', clear);

    const totalAppartments = qAll('tr[data-key]').length;
    const maxAppartmentsPerUser = 3;
    if (totalAppartments >= maxAppartmentsPerUser)
      return error('הגעתם למגבלת הדירות שברשותכם לנהל.');

    entryHeb = Validate.entryToHebrew(entryEng);
    appart = Validate.formatAppartment(appart);
    return true;

    function error(msg, cb){
      notyf.error(msg); if (cb) cb();
      return false;
    }
    function clear(){setVal('address-input', '')}
  }
  function getVal(id){
    return sections.address.querySelector('#' + id).value;
  }
  function setVal(id, v){
    sections.address.querySelector('#' + id).value = v;
  }
}

function toggleAddAddressBtn(){
  const addBtn = byId('add-address');
  const inputs = sections.address.querySelectorAll('input, select');
  for (const inp of inputs) if (!inp.value) return disable();
  enable();

  function enable(){
    if (addBtn.disabled) addBtn.disabled = false;
  }
  function disable(){
    if (addBtn.disabled) return;
    addBtn.disabled = true;
  }
}

function getSections(){
  return {
    enterViaSms: byId('enter-via-sms'),
    smsMsg: byId('sms-msg'),
    home: byId('home'),
    chooseMikve: byId('choose-mikve'),
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
function sendPassReset(e){
  e.preventDefault();
  const email = byId('recovery-email').value;
  Auth.sendPassReset(email);
}
function logUserIn(e){
  e.preventDefault();
  const form = this;
  const email = getVal('email');
  const pass = getVal('pass');
  Auth.logUserIn(email, pass);

  function getVal(id){
    return form.querySelector('#' + id).value;
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
function removeAppartmentActive(event){
  const closeBtn = this.querySelector('.close');
  if (event.target == closeBtn || event.target == this){
    activeAppartmentNode.classList.remove('active');
    activeAppartmentNode = null;
  }
}
function setAppartmentActive(e){
  let numNode;
  if (e.target.hasClass('number')) numNode = this;
  else
    numNode = this.closest('appartment-button').querySelector('.number');
  numNode.classList.add('active');
  activeAppartmentNode = numNode;
}
function filterAppartmentsByType(){
  byId('search').value = null; unfilterBySearch();
  const className = this.hasClass('ask') ? 'ask' : 'give';
  let appartments = unfilterAppartmentsByType();
  if (this.hasClass('active')){
    this.classList.remove('active');
    removeActiveFromButtons(this);
    return;
  }
  removeActiveFromButtons(this);
  this.classList.add('active');
  const appartmentsWithoutAsk = appartments.filter(a => {
    return a.querySelector('span.' + className).hasClass('hidden');
  });
  appartmentsWithoutAsk.forEach(appart => hide(appart));

  function removeActiveFromButtons(span){
    const spans = Array.from(span.parentNode.getElementsByTagName('span'));
    spans.forEach(s => s.classList.remove('active'));
  }
}
function unfilterAppartmentsByType(){
  const appartments = Array.from(byTag('appartment-button'));
  for (const appar of appartments) unhide(appar);
  return appartments;
}

function switchSignType(e){
  const id = e.target.id;
  if (id.includes('email'))
    Render.Sections.activate('signup')
  else if (id.includes('sms'))
    Render.Sections.activate('enterViaSms')
}

function switchSignForms(){
  toggleHide(sections.signup);
  toggleHide(sections.login);
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




//initiateGematriya();
//setTable();

function setTable(){
  const table = document.querySelector('table');
  const todaysDate = new Date();
  const dayOfWeek = todaysDate.getDay();
  let hDate = new Hebcal.HDate(todaysDate/*deletable*/).before(0); //Start from last Sunday
  const visibleWeeks = 3;
  const clickableFutureDays = 7;
  let isInThePast = true;
  let daysToTheFuture = 0;

  for (let i = 0; i < visibleWeeks; i++) {
    const tr = document.createElement('tr');
    for (let j = 0; j < 7; j++) {
      const isToday = hDate.greg().getDate() == todaysDate.getDate();
      const td = document.createElement('td');
      td.innerText = gematriya(hDate.day, {punctuate: false});
      if (isToday) {
        td.classList.add('today');
        isInThePast = false;
      }
      if (!isInThePast && daysToTheFuture <= clickableFutureDays) {
        td.classList.add('allowed');
        daysToTheFuture++;
      }
      tr.appendChild(td);
      hDate = hDate.next();
    }
    table.appendChild(tr);
  }
  document.body.appendChild(table);
  //document.querySelector('h1').innerText
}


// Gematriya
function initiateGematriya(){
	let letters = {}, numbers = {
		'': 0,
		א: 1,
		ב: 2,
		ג: 3,
		ד: 4,
		ה: 5,
		ו: 6,
		ז: 7,
		ח: 8,
		ט: 9,
		י: 10,
		כ: 20,
		ל: 30,
		מ: 40,
		נ: 50,
		ס: 60,
		ע: 70,
		פ: 80,
		צ: 90,
		ק: 100,
		ר: 200,
		ש: 300,
		ת: 400,
		תק: 500,
		תר: 600,
		תש: 700,
		תת: 800,
		תתק: 900,
		תתר: 1000
	}, i;
	for (i in numbers) {
		letters[numbers[i]] = i;
	}

	function gematriya(num, options) {
		if (options === undefined) {
			let options = {limit: false, punctuate: true, order: false, geresh: true};
		}

		if (typeof num !== 'number' && typeof num !== 'string') {
			throw new TypeError('non-number or string given to gematriya()');
		}

		if (typeof options !== 'object' || options === null){
			throw new TypeError('An object was not given as second argument')
		}

		let limit = options.limit;
		let order = options.order;
		let punctuate = typeof options.punctuate === 'undefined' ? true : options.punctuate;
		let geresh = typeof options.geresh === 'undefined' && punctuate ? true : options.geresh;

		let str = typeof num === 'string';

		if (str) {
			num = num.replace(/('|")/g,'');
		}
		num = num.toString().split('').reverse();
		if (!str && limit) {
			num = num.slice(0, limit);
		}

		num = num.map(function g(n,i){
			if (str) {
				return order && numbers[n] < numbers[num[i - 1]] && numbers[n] < 100 ? numbers[n] * 1000 : numbers[n];
			} else {
				if (parseInt(n, 10) * Math.pow(10, i) > 1000) {
					return g(n, i-3);
				}
				return letters[parseInt(n, 10) * Math.pow(10, i)];
			}
		});

		if (str) {
			return num.reduce(function(o,t){
				return o + t;
			}, 0);
		} else {
			num = num.reverse().join('').replace(/יה/g,'טו').replace(/יו/g,'טז').split('');

			if (punctuate || geresh)	{
				if (num.length === 1) {
					num.push(geresh ? '׳' : "'");
				} else if (num.length > 1) {
					num.splice(-1, 0, geresh ? '״' : '"');
				}
			}

			return num.join('');
		}
	}

	if (typeof module !== 'undefined') {
		module.exports = gematriya;
	} else {
		window.gematriya = gematriya;
	}
}
