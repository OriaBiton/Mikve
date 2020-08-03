class Render {
  static closeAskToStar(e){
    if (e) {
      e.preventDefault();
      e.target.closest('.modal').querySelector('.close').click();
    }
    else q('#star-mikve-modal .close').click();
  }
  static async askToStarMikve(){
    const name = selectedMikve.name;
    const modal = byId('star-mikve-modal');
    const desc = q('#star-mikve strong');
    if (!(await isAllowed())) return;
    modal.hidden = false;
    desc.innerText = `את מוזמנת לדרג את מקווה "${name}" כדי שנדע להשתפר לעתיד:`;

    async function isAllowed(){
      const ts = await Database.getLatestStarTimestamp();
      if (!ts) return true;
      const threeWeeks = 1814400000;
      if (new Date() - ts > threeWeeks) return true;
      return false;
    }
  }
  static setUI(){
    Render.h1Background();
    Render.listMikvaot();
    Render.setScheduleTable();
  }
  static adminAppointmentList(snap){
    const sect = sections.appointments;
    const tbody = sect.querySelector('tbody');
    const loadBtn = sect.querySelector('#load-appointment-list-btn');
    const hours = snap.val();
    const checked = getCheckedHours();
    hide(sect.querySelector('.to-hide'));
    tbody.innerHTML = null;
    loadBtn.disabled = true;

    for (const hour in hours) {
      const ap = hours[hour];
      const tr = document.createElement('tr');
      addTd(Format.addColon(hour));
      addTd(ap.name);
      addTd(ap.phone);
      addTd(null, `<input type="checkbox" class="big-checkbox"></input>`);
      tbody.appendChild(tr);

      function addTd(txt, html){
        const td = document.createElement('td');
        if (html) td.innerHTML = html;
        if (txt) td.innerText = txt;
        tr.appendChild(td);
      }
    }
    recheck(checked);

    function recheck(hours){
      for (const tr of tbody.rows) {
        const box = tr.querySelector('input');
        const hour = tr.cells[0].innerText;
        if (hours.includes(hour)) box.checked = true;
      }
    }
    function getCheckedHours(){
      const checked = [];
      for (const tr of tbody.rows) {
        const box = tr.querySelector('input');
        if (box.checked) checked.push(tr.cells[0].innerText);
      }
      return checked;
    }
  }
  static async setAdminUI(user){
    await Auth.setAdminGlobalVar(user);
    if (!isAdmin) return;
    qAll('[data-admin-ui]').forEach(el => el.style.display = 'initial');
    qAll('[data-client-ui]').forEach(el => el.style.display = 'none');
  }
  static showSetAppartmentButton(){
    hide(byId('my-appointment'));
    unhide(byId('set-appointment-btn'));
  }
  static async h1Background(){
    const h1s = qAll('h1');
    const svg = await (await fetch('../../images/h1bg.svg')).text();
    for (const h1 of h1s) {
      const div = document.createElement('div');
      div.classList.add('h1-wave');
      div.innerHTML = svg;
      h1.after(div);
    }
  }
  static shiftScheduleType(e){
    const sect = sections.chooseTime;
    const hebSpan = sect.querySelectorAll('table .date-heb');
    const gregSpans = sect.querySelectorAll('table .date-greg');
    if (e.target.value == 'heb') {
      for (const s of gregSpans) hide(s);
      for (const s of hebSpan) unhide(s);
    }
    else {
      for (const s of hebSpan) hide(s);
      for (const s of gregSpans) unhide(s);
    }
  }
  static listMikvaot(){
    const cardsDivs = byClass('mikve-cards');
    Database.getMikvaot().then(s => s.forEach(addCard));

    function addCard(m){
      for (const div of cardsDivs){
        const card = new MikveCard(m);
        div.appendChild(card);
      }
    }
  }
  static setScheduleTable(){
    const sect = sections.chooseTime;
    const tbody = sect.querySelector('tbody');
    let hDate = new Hebcal.HDate().before(0); //Start from last Sunday
    const visibleWeeks = 3;
    const clickableFutureDays = 7;
    let isInThePast = true;
    let daysToTheFuture = 0;

    for (let i = 0; i < visibleWeeks; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < 7; j++) {
        const td = setTd();
        tr.appendChild(td);
        hDate = hDate.next();
      }
      tbody.appendChild(tr);
    }

    function setTd(){
      const greg = hDate.greg();
      const dayOfWeek = greg.getDay();
      const gregDay = greg.getDate();
      const gregMonthInt = greg.getMonth() + 1;
      const gregMonthString = greg.toLocaleString('he', { month: 'long' });
      const isToday = gregDay == new Date().getDate();
      const isFirstInHebMonth = hDate.day === 1;
      const isFirstInGregMonth = gregDay === 1;
      const holidays = hDate.holidays();
      const td = document.createElement('td');
      td.classList.add('date');
      //td.dataset.time = greg.getTime();
      td.dataset.hebDay = gematriya(hDate.day);
      td.dataset.hebMonth = hDate.getMonthName('h');
      td.dataset.gregDay = gregDay;
      td.dataset.gregMonthInt = gregMonthInt;
      td.dataset.gregMonthString = gregMonthString;
      td.dataset.gregYear = greg.getFullYear();
      td.dataset.dayOfWeek = dayOfWeek;
      td.dataset.sunset = getSunset(hDate);
      td.innerHTML = `<span class="date-heb">${td.dataset.hebDay}</span>
        <span class="date-greg" hidden>${gregDay}</span>`;
      if (isToday) {
        td.classList.add('today');
        isInThePast = false;
      }
      if (isFirstInHebMonth) td.classList.add('first-in-heb-month');
      if (isFirstInGregMonth) td.classList.add('first-in-greg-month');
      if (holidays.length && holidays[0].desc[2] != 'ראש חודש') {
        td.classList.add('holiday');
        td.dataset.holiday = holidays[0].desc[2]
          .replace('שבת ', '').replace('צום ', '');
      }
      if (!isInThePast && daysToTheFuture <= clickableFutureDays) {
        if (!isOffDay()) {
          td.classList.add('allowed');
          td.addEventListener('click', setDate);
          addShabbat();
        }
        daysToTheFuture++;
      }
      return td;

      function isOffDay(){
        if (!holidays.length) return false;
        const txt = holidays[0].desc[2];
        const offDays = ['כיפור', 'תשעה באב'];
        for (const day of offDays)
          if (txt.includes(day)) return true;
        return false;
      }
      function addShabbat(){
        let time;
        let timeName;
        const candles = hDate.candleLighting();
        const havdala = hDate.havdalah();
        if (candles) {
          timeName = 'candles';
          time = candles;
        }
        else if (havdala) {
          timeName = 'havdala';
          time = havdala;
        }
        else return;
        td.dataset[timeName] = `${time.getHours()}:${time.getMinutes()}`;
      }
    }
    function getSunset(d){
      const eve = d.gregEve();
      return `${eve.getHours()}:${eve.getMinutes()}`;
    }
    function gematriya(n){
      const letters = [
        'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'יג',
        'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ', 'כא', 'כב', 'כג', 'כד',
        'כה', 'כו', 'כז', 'כח', 'כט', 'ל', 'לא'
      ];
      return letters[--n];
    }
  }
  static loading(isOn){
    const loading = byId('loading');
    if (isOn) return on();
    off();

    function on(){
      lastActiveSection = getActiveSection();
      if (!lastActiveSection) return; // none, so loader's probably visible.
      hide(lastActiveSection);
      unhide(loading);
    }
    function off(){
      if (!lastActiveSection) return;
      hide(loading);
      unhide(lastActiveSection);
    }
  }
}

Render.Sections = class Sections {
  static async first(user){
    const loading = byId('loading');
    if (user) {
      Render.setAdminUI(user);
      await Render.Sections.home();
    }
    else Render.Sections.login();
    hide(loading);
  }
  static appointments(e){
    e.preventDefault();
    setDateValues();

    Render.Sections.activate('appointments');

    function setDateValues(){
      const inputs = qAll('input[name="load-appointments-date"]');
      const date = new Date();
      for (const i of inputs) {
        const part = i.dataset.part;
        if (part == 'day') i.value = date.getDate();
        else if (part == 'month') i.value = date.getMonth() + 1;
        else if (part == 'year') i.value = date.getFullYear();
      }
    }
  }
  static confirm(e){
    e.preventDefault();
    addTable();
    Render.Sections.activate('confirm');

    function addTable(){
      const div = byId('confirm-appointment-table');
      const table = new AppointmentTable();
      div.appendChild(table);
    }
  }

  static async chooseTime(e){
    e.preventDefault();
    const sect = sections.chooseTime;
    listHours();
    Render.Sections.activate('chooseTime');

    async function listHours(){
      const getTakenHours = functions.httpsCallable('getTakenHours');
      const mikveName = selectedMikve.key;
      const ranges = getRanges(mikveName);
      const allowed = sect.querySelectorAll('td.allowed');
      const datasetsOfAllowed = Array.from(allowed).map(a => a.dataset);
      const takenPayload = {mikveName, dates: datasetsOfAllowed};
      const taken = (await getTakenHours(takenPayload)).data;
      for (const td of allowed) {
        const isToday = td.hasClass('today');
        const dayData = td.dataset;
        const gregDay = dayData.gregDay;
        const candles = dayData.candles;
        const havdala = dayData.havdala;
        let dayType = 'weekdays';
        if (candles) dayType = 'friday';
        else if (havdala) dayType = 'saturday';
        let hours = spread(ranges[dayType].from, ranges[dayType].until, dayData);
        if (isToday) hours = removePastHours(hours);
        dayData.allowedHours = hours;
        if (!dayData.allowedHours) {
          td.classList.remove('allowed');
          td.removeEventListener('click', setDate);
          continue;
        }
        if (taken[gregDay]) dayData.takenHours =
          isToday ? removePastHours(taken[gregDay]) : taken[gregDay];
        td.dataset.ready = true;
      }
      if (tdToClick) tdToClick.click();

      function removePastHours(hours){
        let now = new Date();
        now = Format.to4Chars(now.getHours(), now.getMinutes());
        for (let i = hours.length; i >= 0; i--) {
          if (hours[i] < now) hours.splice(i, 1);
        }
        return hours;
      }
      function getRanges(mikve){
        const card = q(`mikve-card[data-key="${mikve}"]`);
        return card.hours[getSeason()];

        function getSeason(){
          const seasons = ['winter', 'summer'];
          return seasons[Math.floor(new Date().getMonth() / 12 * 2) % 2];
        }
      }
      function spread(from, until, dayData){
        from = Format.toHourMinutesObject(from, dayData);
        until = Format.toHourMinutesObject(until, dayData);
        const step = 5; // Interval in minutes
        let iM = from.minutes;
        const arr = [];
        for (let iH = from.hour; iH <= until.hour; iH++) {
          while (iM < 60) {
            if (iH == until.hour && iM > until.minutes) break;
            arr.push(Format.to4Chars(iH, iM));
            iM += step;
          }
          iM -= 60;
        }
        return arr;

        function ConvertToHourString(date){
          const dt = new Date(date);
          return dt.getHours() + ':' + dt.getMinutes();
        }
      }

    }
  }

  static chooseMikve(e){
    e.preventDefault();
    Render.Sections.activate('chooseMikve');
  }

  static async home(){
    await renderAppointment();
    greet();
    Render.Sections.activate('home');

    async function renderAppointment(){
      if (isAdmin) return;
      const btn = byId('set-appointment-btn');
      if (!(await getAppointmentGlobalVars())) return unhide(btn);
      const table = new AppointmentTable(true);
      const div = byId('my-appointment');
      div.appendChild(table);
      hide(btn);
      unhide(div);

      async function getAppointmentGlobalVars(){
        if (selectedMikve && selectedTime && isAppointmentSet) return true;
        const data = await getData();
        if (!data) return false;
        selectedMikve = data.mikve;
        selectedTime = data.time;
        isAppointmentSet = true;
        return true;

        async function getData(){
          const uid = Auth.getUser().uid;
          const path = `users/${uid}/appointments`;
          let data;
          await db.ref(path).once('value', snap => {
            if (snap.exists()) {
              const obj = Object.values(snap.val())[0];
              data = JSON.parse(obj.data);
            }
          });
          return data;
        }
      }
    }
    function greet(){
      const user = Auth.getUser();
      const name = user.displayName;
      const greeting = `היי, ${name}`;
      byId('greeting').innerText = greeting;
    }
  }
  static login(){
    Render.Sections.activate('enterViaSms');
  }
  static sms(){
    Render.Sections.activate('smsMsg');
  }
  static async settings(){
    const user = Auth.getUser();
    if (!user) return notyf.error('אינכם מחוברים למערכת עדיין.');

    const sect = sections.settings;
    if (!sect.hidden) return back();
    show();

    function show(){
      const shownSection = getActiveSection();
      lastActiveSection = shownSection;
      toggleHide(shownSection);
      toggleHide(sect);
    }
    function back(){
      toggleHide(sect);
      toggleHide(lastActiveSection);
      lastActiveSection = sect;
    }
  }

  static activate(n){
    const loading = byId('loading');
    const active = getActiveSection();
    hide(loading);
    if (active) toggleHide(active);
    toggleHide(sections[n]);
  }
}
