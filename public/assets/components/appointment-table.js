const appointmentTableTemplate = `
  <table class="mb-2">
    <thead class="large-txt align-r">
      <tr>
        <th>💧 מקווה</th>
        <th>🕒 זמן</th>
        <th class="actions hidden">🔧 פעולות</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="mikve-desc"></td>
        <td class="time-desc"></td>
        <td class="actions-td hidden">
          <a class="waze-btn" target="_blank">
            <button><img src="images/waze.png">ניווט</button>
          </a>
          <button class="danger delete-btn">מחיקה</button>
        </td>
      </tr>
    </tbody>
  </table>
`;
class AppointmentTable extends HTMLElement {
  constructor(hasActions){
    super();
    this.hasActions = hasActions;
    this.hasPast = hasPast();
    function hasPast(){ return new Date() > selectedTime.time }
  }
  connectedCallback(){
    if (this.hasPast) return this.delete();
    const dataset = this.closest('section').dataset;
    if (dataset.connectedAppointmentTable) this.overwrite();
    this.innerHTML = appointmentTableTemplate;
    this.fillDescriptions();
    if (this.hasActions) this.addActions();
    dataset.connectedAppointmentTable = true;
  }
  overwrite(){
    const first = this.closest('section').querySelector('appointment-table');
    first.removeSelf();
  }
  addActions(){
    const th = this.querySelector('.actions');
    const td = this.querySelector('.actions-td');
    unhide(th);
    unhide(td);
    setWazeButton(this)
    addListeners(this);

    function setWazeButton(self){
      const a = self.querySelector('.waze-btn');
      const llParam = selectedMikve.waze;
      a.href = `https://www.waze.com/ul?ll=${llParam}&navigate=yes`;
    }
    function addListeners(self){
      self.querySelector('.delete-btn').addEventListener('click', self.delete);
    }
  }
  fillDescriptions(){
    mikve(this);
    time(this);

    function time(self){
      const d = selectedTime.date;
      const txt = `${d.hebDay} ב${d.hebMonth}
        ${d.gregDay} ב${d.gregMonthString} ${d.gregYear}
        בשעה ${selectedTime.hour.text}`;
      self.querySelector('.time-desc').innerText = txt;
    }
    function mikve(self){
      const txt = `"${selectedMikve.name}"
        ${selectedMikve.address}, בת ים`;
      self.querySelector('.mikve-desc').innerText = txt;
    }
  }
  delete(e){
    byId('star-mikve-modal').dataset.key = selectedMikve.key;
    deleteAppointment(e);
    if (e) this.closest('appointment-table').removeSelf();
    else this.removeSelf();
  }
  removeSelf(){
    const dataset = this.closest('section').dataset;
    dataset.connectedAppointmentTable = '';
    if (this.hasPast) Render.askToStarMikve();
    this.remove();
  }
}

customElements.define('appointment-table', AppointmentTable);
