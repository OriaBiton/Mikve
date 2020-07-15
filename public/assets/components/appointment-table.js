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
        <td class="delete-btn hidden">
          <button class="danger">מחיקה</button>
        </td>
      </tr>
    </tbody>
  </table>
`;
class AppointmentTable extends HTMLElement {
  constructor(deletable){
    super();
    this.deletable = deletable;
  }
  connectedCallback(){
    const dataset = this.closest('section').dataset;
    if (dataset.connectedAppointmentTable) this.overwrite();
    this.innerHTML = appointmentTableTemplate;
    this.fillDescriptions();
    if (this.deletable) this.addDeleteButton();
    this.addListeners();
    dataset.connectedAppointmentTable = true;
  }
  overwrite(){
    const first = this.closest('section').querySelector('appointment-table');
    first.removeSelf();
  }
  addDeleteButton(){
    const th = this.querySelector('.actions');
    const td = this.querySelector('.delete-btn');

    unhide(th);
    unhide(td);
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
  addListeners(){
    this.querySelector('.delete-btn button').addEventListener('click', this.delete);
  }
  delete(){
    const dataset = this.closest('section').dataset;
    dataset.connectedAppointmentTable = '';
    deleteAppointment();
    this.closest('appointment-table').remove();
  }
  removeSelf(){
    const dataset = this.closest('section').dataset;
    dataset.connectedAppointmentTable = '';
    this.remove();
  }
}

customElements.define('appointment-table', AppointmentTable);
