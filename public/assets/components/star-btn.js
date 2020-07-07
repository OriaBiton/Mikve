class StarBtn extends HTMLElement {
  constructor(num){
    super();
    this.num = num;
  }
  connectedCallback(){
    this.dataset.num = this.num;
    const img = document.createElement('img');
    img.src = 'images/star.png';
    this.appendChild(img);
    this.toggleStarBtn();
    this.addEventListener('click', this.onClick);
  }

  setTitle(){
    if (this.hasClass('lit'))
      this.title = 'פירגנתם בכוכב לדירה זו';
    else this.title = 'לחצו כדי לפרגן לדירה זו';
  }

  async toggleStarBtn(){
    const sameBtns = this.getSameBtns();
    const lobbyId = sections.lobby.dataset.key;
    const uid = Auth.getUser().uid;
    const num = this.num;
    if (await isAllowedToStarYet(this)) this.lit('remove');
    else this.lit('add');
    this.setTitle();

    async function isAllowedToStarYet(self){
      let allowed = false;
      for (const btn of sameBtns){ // Check other instances in doc
        if (btn.isSameNode(self)) continue;
        if (btn.hasClass('lit')) return allowed = false;
        else return allowed = true;
      } // Check in DB -->
      const path = `lobbies/${lobbyId}/appartments/${num}/stars/${uid}/timeStamp`;
      await db.ref(path).once('value', snap => {
        const latestTimeStamp = snap.val();
        if (!latestTimeStamp) allowed = true;
        const halfDay = 43200000;
        if (new Date() - latestTimeStamp >= halfDay) allowed = true;
      }).catch(e => {throw e});
      return allowed;
    }
  }

  async onClick(){
    this.classList.add('disabled');
    if (this.lit('has')){
      notyf.info('יש להמתין 12 שעות כדי להוסיף כוכב לאותה הדירה.');
      this.classList.remove('disabled');
      return;
    }
    const lobbyId = sections.lobby.dataset.key;
    const num = this.num;
    const addStar = functions.httpsCallable('addStar');
    await addStar({lobbyId, num}).catch(e => {throw e});
    notyf.success('הוספתם כוכב לדירה!');
    this.classList.add('lit');
    this.classList.remove('disabled');
  }

  lit(action, btn){
    if (action == 'add' || action == 'remove'){
      const btns = this.getSameBtns();
      for (const btn of btns) btn.classList[action]('lit');
    }
    else if (action == 'has') return this.hasClass('lit');
  }
  getSameBtns(){
    return qAll(`star-btn[data-num="${this.num}"]`);
  }

}
customElements.define('star-btn', StarBtn);
