const userItemLiTemplate = `
  <div class="buttons">
    <button>טופל</button>
    <span class="delete-item">×</span>
  </div>
`;
class UserItemsOl extends HTMLElement {
  constructor(type){
    super();
    this.type = type;
  }
  connectedCallback(){
    const ol = document.createElement('ol');
    ol.classList.add(`${this.type == 'ask' ?
      'danger' : 'good'}-txt`, 'deletable-li', 'float-up');
    this.appendChild(ol);
    this.ol = ol;
    UserItemsOl.modal = byId('star-helpers-modal');
  }
  clear(){ this.ol.innerHTML = null; }
  addItem(key, text, p){
    const li = document.createElement('li');
    li.innerHTML = userItemLiTemplate + text;
    li.dataset.key = key;
    li.dataset.text = text;
    if (p) li.appendChild(p);
    li.querySelector('.delete-item')
      .addEventListener('click', UserItemsOl.deleteItem);
    this.ol.appendChild(li);
    const btn = li.querySelector('button');
    if (this.type == 'give') {
      btn.remove(); return;
    }
    btn.addEventListener('click', UserItemsOl.showAppartmentsToStar);
    Listeners.bindModalBySelectors(btn, UserItemsOl.modal);
  }
  static async deleteItem(e){
    const li = this.nodeName ? this.closest('li') : e;
    const itemKey = li.dataset.key;
    const sect = sections.lobby;
    const lobbyKey = sect.dataset.key;
    const num = sect.dataset.num;
    const type = li.closest('user-items-ol').type;
    await Database.deleteItem(lobbyKey, num, type, itemKey);
    const text = li.dataset.text;
    Render.userItemLists();
    notyf.info(`מחקתם "${text}" מהרשימה.`);
  }
  static showAppartmentsToStar(e){
    const li = e.target.closest('li');
    const div = UserItemsOl.modal.querySelector('.middle');
    div.innerHTML = null;
    const apInfos = Array.from(byTag('appartment-info'));
    for (const ap of apInfos){
      const num = ap.num;
      if (num == sections.lobby.dataset.num) continue;
      const name = ap.querySelector('.appartment-name').innerText;
      const starBtn = new StarBtn(num);
      const liDiv = document.createElement('div');
      const h2 = document.createElement('h2');
      h2.classList.add('mb-1');
      h2.innerText = `דירה ${num}`;
      if (name) h2.innerText += ` (${name})`;
      liDiv.appendChild(h2);
      liDiv.appendChild(starBtn);
      div.appendChild(liDiv);
    }
    const middleDiv = document.createElement('div');
    middleDiv.classList.add('middle');
    const btn = document.createElement('button');
    btn.innerText = 'סיום';
    btn.addEventListener('click', async () => {
      await UserItemsOl.deleteItem(li);
      UserItemsOl.modal.querySelector('.close').click();
    });
    middleDiv.appendChild(btn);
    div.appendChild(middleDiv);
    skipIfNone();

    function skipIfNone(){
      const count = byTag('appartment-button').length;
      if (count <= 1) btn.click();
    }
  }
}
customElements.define('user-items-ol', UserItemsOl);
