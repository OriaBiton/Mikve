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
    this.innerHTML = appointmentTableTemplate;
    this.fillDescriptions();
    if (this.deletable) this.addDeleteButton();
    this.addListeners();
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
    this.querySelector('.delete-btn button').addEventListener('click', deleteAppointment);
  }
}

customElements.define('appointment-table', AppointmentTable);
