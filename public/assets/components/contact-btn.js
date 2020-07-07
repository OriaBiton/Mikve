class ContactBtn extends HTMLElement {
  constructor(type, userObj){
    super();
    if (!type || !userObj) throw 'Must provide type of button and user object!';
    this.type = type;
    this.val = userObj[type];
    if (type == 'whatsapp') this.val = userObj.phone;
    this.hide = userObj.hideContact;
    this.userName = userObj.name;
  }
  connectedCallback(){
    const val = this.val;
    const hide = this.hide;
    const a = document.createElement('a');
    const img = document.createElement('img');
    if (this.type == 'email'){
      img.src = 'images/mail.png';
      if (!hide) {
        a.href = 'mailto:' + val;
        this.enable();
      }
    }
    else if (this.type == 'phone'){
      img.src = 'images/phone.png';
      if (!hide) {
        a.href = 'tel:' + val;
        this.enable();
      }
    }
    else if (this.type == 'whatsapp'){
      img.src = 'images/whatsapp.png';
      if (!hide) {
        a.href = 'https://api.whatsapp.com/send?phone=' + formatNumber(val);
        this.enable();
      }
    }
    else throw 'Invalid type of button!';
    if (!this.enabled) this.disable();
    a.appendChild(img);
    this.appendChild(a);
    // this.toggleStarBtn();
    // this.addEventListener('click', this.onClick);
  }
  disable(){
    const msg = `פרטי ההתקשרות של ${this.userName} חסויים`;
    this.title = msg;
    this.addEventListener('click', () => notyf.info(msg));
  }
  enable(){
    this.enabled = true;
    this.classList.add('enabled');
    this.title = `לחצו כדי ליצור קשר עם ${this.userName}`;
  }
}
customElements.define('contact-btn', ContactBtn);
