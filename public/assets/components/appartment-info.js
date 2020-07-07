const appartmentInfoTemplate = `
  <div class="modal-header">
    <h1>דירה <b class="appartment-num"></b></h1>
  </div>
  <div class="modal-body">
    <h2 class="appartment-name middle"></h2>
    <div class="mb-2">
      <div class="ask-listing" class="hidden float-up">
        <h3 class="danger soft-edge inline p-side-3">צריכים:</h3>
        <ol class="danger-txt float-up"></ol>
      </div>
      <div class="give-listing" class="hidden float-up">
        <h3 class="good soft-edge inline p-side-3">מציעים:</h3>
        <ol class="good-txt float-up"></ol>
      </div>
    </div>
    <div class="flex">
    <div class="contact-btns"></div>
    </div>
  </div>
`;
const liActivityTemplate = `
  <small class="faded">
    לפני <span data-time></span> ע"י <span data-username></span>.
  </small>
`;
class AppartmentInfo extends HTMLElement {
  constructor(num){
    super();
    if (!num) throw 'Number of appartment must be provided!';
    this.num = num;
  }
  connectedCallback(){
    this.innerHTML = appartmentInfoTemplate;
    this.dataset.num = this.num;
    this.dataset.latest = 0;
    this.querySelector('.appartment-num').innerText = this.num;
    this.bindAppartmentName();
    this.bindItemList();
    this.querySelector('.flex').appendChild(new StarBtn(this.num));
    this.addContactBtns();
  }

  async addContactBtns(){
    const lobbyKey = sections.lobby.dataset.key;
    const num = this.num;
    const path = `lobbies/${lobbyKey}/appartments/${num}/people`;
    const people = await Database.getValOnce(path);
    const div = this.querySelector('.contact-btns');
    for (const uid in people){
      const userObj = await Database.getValOnce(`users/${uid}`);
      if (userObj.email){
        div.appendChild(new ContactBtn('email', userObj));
      }
      else if (userObj.phone){
        div.appendChild(new ContactBtn('phone', userObj));
        div.appendChild(new ContactBtn('whatsapp', userObj));
      }
    }
  }

  bindItemList(){
    const lobbyId = sections.lobby.dataset.key;
    const types = ['ask', 'give'];
    for (const type of types){
      const itemsPath = `lobbies/${lobbyId}/appartments/${this.num}/${type}`;
      Database.useOnVal(itemsPath, this.update, this);
    }
  }

  bindAppartmentName(){
    const lobbyId = sections.lobby.dataset.key;
    const namePath = `lobbies/${lobbyId}/appartments/${this.num}/name`;
    const nameNode = this.querySelector('.appartment-name');
    Database.bindValue(nameNode, namePath);
  }

  update(itemsOfType, self){
    const belongsToUser = self.num == sections.lobby.dataset.num;
    const type = itemsOfType.key;
    const div = self.querySelector(`.${type}-listing`);
    let ol = div.querySelector('ol');
    if (belongsToUser){
      hide(ol);
      const connectedOl = div.querySelector('user-items-ol');
      ol = connectedOl || new UserItemsOl(type);
      if (connectedOl) ol.clear();
      else div.appendChild(ol);
    }
    else ol.innerHTML = null;
    itemsOfType.forEach(item => {
      const text = item.val().text;
      const p = document.createElement('p');
      p.innerHTML = liActivityTemplate;
      fillLatestActivity(p, item.val());
      if (belongsToUser) ol.addItem(item.key, text, p);
      else {
        const li = document.createElement('li');
        li.innerText = text;
        li.appendChild(p);
        ol.appendChild(li, type);
      }
    });
    if (itemsOfType.numChildren()) unhide(div);
    else hide(div);

    function fillLatestActivity(p, item){
      const timeNode = p.querySelector('[data-time]');
      const nameNode = p.querySelector('[data-username]');
      const timeStr = timeSince(item.timeStamp);
      const name = item.byUser.name;
      timeNode.innerText = timeStr;
      nameNode.innerText = name;
    }
  }

}
customElements.define('appartment-info', AppartmentInfo);
