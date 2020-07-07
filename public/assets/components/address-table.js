const addressTableTemplate = `
  <tbody>
    <tr>
      <th>כתובת</th>
      <th>כניסה</th>
      <th>דירה</th>
      <th>פעולות</th>
    </tr>
  </tbody>
`;
const addressRowTemplate = `
  <td data-address-name></td>
  <td data-entry></td>
  <td data-appartment-num></td>
  <td class="table-btns">
    <button type="button" onclick="enterLobby(this)">לובי</button>
    <button type="button" onclick="deleteAddress(this)" class="danger">מחק</button>
  </td>
`;
class AddressTable extends HTMLElement {
  constructor(){
    super();
  }
  connectedCallback(){
    const table = document.createElement('table');
    table.classList.add('center', 'float-up', 'soft-brd');
    table.innerHTML = addressTableTemplate;
    this.appendChild(table);
    this.tbody = table.tBodies[0];
    this.count = 0;
  }
  addRow(props){
    const tr = document.createElement('tr');
    tr.innerHTML = addressRowTemplate;
    tr.classList.add('float-up');
    tr.querySelector('[data-address-name]').innerText = props.name;
    tr.querySelector('[data-entry]').innerText = props.entry || '-';
    tr.querySelector('[data-appartment-num]').innerText = props.num;
    tr.dataset.placeId = props.placeId;
    tr.dataset.key = props.key;
    this.tbody.appendChild(tr);
    this.count = this.tbody.rows.length - 1;
  }
  removeRows(){
    const rows = this.tbody.rows;
    for (let i = rows.length - 1; i >= 1; i--)
      rows[i].remove();
    this.count = 0;
  }
  set count(v){
    if (!v) hide(this);
    else unhide(this);
    AddressTable.count = v;
  }
  getName(i) {
    return this.tbody.rows[i + 1]
      .querySelector('[data-address-name]').innerText;
  }
  getEntry(i) {
    return this.tbody.rows[i + 1]
      .querySelector('[data-entry]').innerText;
  }
  getAppartmentNum(i){
    return this.tbody.rows[i + 1]
      .querySelector('[data-appartment-num]').innerText;
  }
  getPlaceId(i){
    return this.tbody.rows[i + 1].dataset.placeId;
  }
  getKey(i){
    return this.tbody.rows[i + 1].dataset.key;
  }
}
customElements.define('address-table', AddressTable);
