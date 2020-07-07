const appartmentButtonTemplate = `
  <span class="number"></span>
  <span class="ask"></span>
  <span class="give"></span>
  <div class="stars" title="מספר הכוכבים שהדירה קיבלה">
    <img src="images/star.svg">
    <span></span>
  </div>
`;
class AppartmentButton extends HTMLElement {
  constructor(num){
    super();
    if (!num) throw 'Number of appartment must be provided!';
    this.num = num;
    this.modal = byId('appartment-modal');
  }
  connectedCallback(){
    this.innerHTML = appartmentButtonTemplate;
    this.dataset.num = this.num;
    this.querySelector('span').innerText = this.num;
    if (sections.lobby.dataset.num == this.num)
      this.classList.add('my-appartment');
    AppartmentButton.bindItemCounters(this);
    AppartmentButton.bindStarCounter(this);
    this.querySelectorAll('span').forEach(s => {
      Listeners.bindModalBySelectors(s, this.modal);
      s.addEventListener('click', setAppartmentActive);
      s.addEventListener('click', Render.showItemModalByNum);
    });
  }
  set ask(n) {
    this._ask = n;
    const node = this.querySelector('.ask');
    node.innerText = n;
    AppartmentButton.hideZeroHandler(node);
  }
  set give(n) {
    this._give = n;
    const node = this.querySelector('.give');
    node.innerText = n;
    AppartmentButton.hideZeroHandler(node);
  }
  set stars(n){
    this._stars = n;
    const node = this.querySelector('.stars span');
    node.innerText = n;
    AppartmentButton.hideParentZeroHandler(node);
  }
  static hideZeroHandler(el){
    if (el.innerText < 1) hide(el); else unhide(el);
  }
  static hideParentZeroHandler(el){
    if (el.innerText < 1) hide(el.parentNode);
    else unhide(el.parentNode);
  }

  static bindStarCounter(aBtn){
    const lobbyId = sections.lobby.dataset.key;
    const num = aBtn.num;
    const path = `lobbies/${lobbyId}/appartments/${num}/stars`;
    Database.bindCount(path, aBtn, 'stars', 'count');
  }

  static bindItemCounters(aBtn){
    const lobbyId = sections.lobby.dataset.key;
    const num = aBtn.num;
    const types = ['ask', 'give'];
    for (const type of types) {
      const path = `lobbies/${lobbyId}/appartments/${num}/${type}`;
      Database.bindCount(path, aBtn, type);
    }
  }
}
customElements.define('appartment-button', AppartmentButton);
