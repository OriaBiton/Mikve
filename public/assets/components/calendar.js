Hebcal.defaultCity = 'Jerusalem';
const calendarTemplate = `
  <table class="mb-2">
    <thead>
      <tr>
        <th>ראשון</th>
        <th>שני</th>
        <th>שלישי</th>
        <th>רביעי</th>
        <th>חמישי</th>
        <th>שישי</th>
        <th>שבת</th>
      </tr>
    </thead>
    <tbody>
    </tbody>
  </table>
`;
class Calendar extends HTMLElement {
  constructor(){
    super();
  }
  connectedCallback(){
    this.innerHTML = calendarTemplate;
    const tbody = this.querySelector('tbody');
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
      if (holidays.length && !holidays[0].desc[2].includes('ראש חודש')) {
        td.classList.add('holiday');
        td.dataset.holiday = holidays[0].desc[2]
          .replace('שבת ', '').replace('צום ', '');
      }
      if (!isInThePast && daysToTheFuture <= clickableFutureDays) {
        if (!isOffDay()) {
          td.classList.add('allowed');
          td.addEventListener('click', Calendar.setDate);
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

  static setDate(e){
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
          if (!hour) continue;
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
  static async addHours(){
    const getTakenHours = functions.httpsCallable('getTakenHours');
    const mikveName = selectedMikve.key;
    const ranges = getRanges(mikveName);
    const allowed = qAll('calendar-table td.allowed');
    const datasetsOfAllowed = Array.from(allowed).map(a => a.dataset);
    const takenPayload = {mikveName, dates: datasetsOfAllowed};
    const taken = (await getTakenHours(takenPayload)).data;
    for (const td of allowed) {
      const isToday = td.hasClass('today');
      const dayData = clearPreviousHours(td.dataset);
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
        td.removeEventListener('click', Calendar.setDate);
        continue;
      }
      if (taken[gregDay]) dayData.takenHours =
        isToday ? removePastHours(taken[gregDay]) : taken[gregDay];
      td.dataset.ready = true;
    }
    if (tdToClick) tdToClick.click();

    function clearPreviousHours(data){
      if (data.allowedHours) data.allowedHours = '';
      if (data.takenHours) data.takenHours = '';
      return data;
    }
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

customElements.define('calendar-table', Calendar);
