class Render {
  static setUI(){
    Render.h1Background();
    Render.listMikvaot();
    Render.setScheduleTable();
  }
  static async setAdminUI(user, isRetry){
    const idTokenResult = await user.getIdTokenResult(true);
    if (!idTokenResult.claims.admin){
      console.log('not admin');
      if (!isRetry) setTimeout(() => Render.setAdminUI(user, true), 5000);
      return;
    }
    qAll('[data-admin-ui]').forEach(el => el.style.display = 'initial');
    qAll('[data-client-ui]').forEach(el => el.style.display = 'none');
    console.log('admin!');
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
    const sect = sections.chooseMikve;
    const cardsDiv = sect.querySelector('.mikve-cards');
    Database.getMikvaot().then(s => s.forEach(addCard));

    function addCard(m){
      const card = new MikveCard(m);
      cardsDiv.appendChild(card);
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

        td.classList.add('date')
        td.dataset.hebDay = gematriya(hDate.day);
        td.dataset.hebMonth = hDate.getMonthName('h');
        td.dataset.gregDay = gregDay;
        td.dataset.gregMonthInt = gregMonthInt;
        td.dataset.gregMonthString = gregMonthString;
        td.dataset.gregYear = greg.getFullYear();
        td.dataset.dayOfWeek = dayOfWeek;
        td.dataset.sunset = getSunset(hDate);

        td.innerHTML = `<span class="date-heb">${td.dataset.hebDay}</span>
          <span class="date-greg hidden">${gregDay}</span>`;
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
          td.classList.add('allowed');
          td.addEventListener('click', setDate);
          daysToTheFuture++;
          addShabbat();

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
        tr.appendChild(td);
        hDate = hDate.next();
      }
      tbody.appendChild(tr);
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
      hide(lastActiveSection);
      unhide(loading);
    }
    function off(){
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
      const taken = (await getTakenHours({mikveName})).data;
      const allowed = sect.querySelectorAll('td.allowed');
      for (const td of allowed) {
        let hours;
        const dayData = td.dataset;
        const gregDay = dayData.gregDay;
        const candles = dayData.candles;
        const havdala = dayData.havdala;
        let dayType = 'weekdays';
        if (candles) dayType = 'friday';
        else if (havdala) dayType = 'saturday';
        hours = spread(ranges[dayType].from, ranges[dayType].until, dayData);
        dayData.allowedHours = hours;
        if (taken[gregDay]) dayData.takenHours = taken[gregDay];
        td.dataset.ready = true;
        td.addEventListener('click', setDate);
      }
      if (tdToClick) tdToClick.click();

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
        const step = 5;
        let iM = from.minutes;
        let arr = [];
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
    if (!sect.hasClass('hidden')) return back();
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
