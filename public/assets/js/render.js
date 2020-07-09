class Render {
  static fullRender(){
    Render.listMikvaot();
    Render.setScheduleTable();
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
    const todaysDate = new Date();
    const dayOfWeek = todaysDate.getDay();
    let hDate = new Hebcal.HDate().before(0); //Start from last Sunday
    const visibleWeeks = 3;
    const clickableFutureDays = 7;
    let isInThePast = true;
    let daysToTheFuture = 0;

    for (let i = 0; i < visibleWeeks; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < 7; j++) {
        const greg = hDate.greg();
        const gregDay = greg.getDate();
        const gregMonthInt = greg.getMonth() + 1;
        const gregMonthString = greg.toLocaleString('he', { month: 'long' });
        const isToday = gregDay == todaysDate.getDate();
        const isFirstInHebMonth = hDate.day === 1;
        const isFirstInGregMonth = gregDay === 1;
        const holidays = hDate.holidays();
        const td = document.createElement('td');

        td.dataset.hebDay = gematriya(hDate.day);
        td.dataset.hebMonth = hDate.getMonthName('h');
        td.dataset.gregDay = gregDay;
        td.dataset.gregMonthInt = gregMonthInt;
        td.dataset.gregMonthString = gregMonthString;
        td.dataset.gregYear = greg.getFullYear();
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
          td.dataset.holiday = holidays[0].desc[2].replace('שבת ', '')
            .replace('צום ', '');
        }
        if (!isInThePast && daysToTheFuture <= clickableFutureDays) {
          td.classList.add('allowed');
          td.addEventListener('click', setDate);
          daysToTheFuture++;
        }
        tr.appendChild(td);
        hDate = hDate.next();
      }
      tbody.appendChild(tr);
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
  static async listHours(){
    const data = await (await fetch('https://www.hebcal.com/shabbat/?cfg=json&geonameid=295548&m=50')).json();
    const items = data.items;
    let hour;
    let minutes;
    for (const item of items){
      if (item.category == 'candles'){
        hour = getHour(item.date);
        minutes = getMinutes(item.date);
      }
      else if (item.category == 'havdalah'){
        const time = ConvertToHourString(item.date);
      }
    }
    console.log(hour, minutes);
    //LIST...
    const start = {h: hour, m: roundMin(minutes)};
    const end = {h: 22, m: 0};
    const step = 5;
    let iM = start.m;
    for (let iH = start.h; iH <= end.h; iH++) {
      while (iM < 60) {
        if (iH == end.h && iM > end.m) break;
        console.log(iH, iM);
        iM += step;
      }
      iM -= 60;
    }

    function roundMin(m){
      return Math.ceil(m / 5) * 5;
    }
    function getHour(date){
      const dt = new Date(date);
      return dt.getHours();
    }
    function getMinutes(date){
      const dt = new Date(date);
      return dt.getMinutes();
    }
    function ConvertToHourString(date){
      const dt = new Date(date);
      return dt.getHours() + ':' + dt.getMinutes();
    }
  }
}

Render.Sections = class Sections {
  static async renderSections(){
    const loading = byId('loading');
    const user = Auth.getUser();
    if (user) {
      await Render.Sections.home();
    }
    else {
      Render.Sections.login();
    }
    hide(loading);
  }

  static chooseTime(e){
    e.preventDefault();
    Render.Sections.activate('chooseTime');
  }

  static chooseMikve(e){
    e.preventDefault();
    Render.Sections.activate('chooseMikve');
  }

  static async home(e){
    if (e) e.preventDefault();
    greet();

    Render.Sections.activate('home');

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
    const active = getActiveSection();
    if (active) toggleHide(active);
    toggleHide(sections[n]);
  }
}
