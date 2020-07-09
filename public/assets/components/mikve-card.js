const mikveCardTemplate = `
  <img class="card-pic">
  <h3 class="m-0"></h3>
  <div class="stars"></div>
  <p></p>
  <svg class="checkmark hidden" viewBox="0 0 52 52">
    <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
    <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
  </svg>
`;
class MikveCard extends HTMLElement {
  constructor(m){
    super();
    const mikve = m.val();
    this.name = mikve.name;
    this.address = mikve.address;
    this.img = mikve.img;
    this.rating = mikve.rating;
    this.key = m.key;
  }
  connectedCallback(){
    this.render();
    this.addListeners();
  }
  render(){
    this.classList.add('card');
    this.dataset.key = this.key;
    this.innerHTML = mikveCardTemplate;
    this.querySelector('img').src = this.img;
    this.querySelector('h3').innerText = this.name;
    this.querySelector('p').innerText = '📍 ' + this.address;
    this.showStars();
  }
  showStars(){
    const rating = this.rating;
    const starsDiv = this.querySelector('.stars');
    const score = Math.round(rating.stars * 2) / 2;
    starsDiv.title = `המקווה דורג ${rating.stars} כוכבים ע"י ${rating.voters} הצבעות`;
    //subtract 0.5 so 'i' will reach limit and go one more time.
    for (let i = 0; i < score - 0.5; i++)
      addStar(starsDiv);
    if (!isInt(score)) addHalfStar(starsDiv);

    function addStar(div){
      const star = document.createElement('img');
      star.src = "images/star-mini.png";
      div.appendChild(star);
    }
    function addHalfStar(div){
      const star = document.createElement('img');
      star.src = "images/half-star-mini.png";
      div.appendChild(star);
    }
  }
  addListeners(){
    this.addEventListener('click', selectMikve);
  }
}

customElements.define('mikve-card', MikveCard);
