const cardTemplate = `
  <img class="card-pic">
  <h3 class="m-0"></h3>
  <div class="stars"></div>
  <p>📍 </p>
`;
class MikveCards extends HTMLElement {
  constructor(){
    super();
  }
  connectedCallback(){
    this.classList.add('flex-row');
    const self = this;
    Database.getMikvaot().then(s => s.forEach(addCard));

    function addCard(m){
      const mikve = m.val();
      const card = document.createElement('div');
      card.classList.add('mikve', 'card');
      card.dataset.key = m.key;
      card.innerHTML = cardTemplate;
      card.querySelector('img').src = mikve.img;
      card.querySelector('h3').innerText = mikve.name;
      card.querySelector('p').innerText += mikve.address;
      MikveCards.showStars(card, mikve.rating);
      MikveCards.addListeners(card);
      self.appendChild(card);
    }
  }

  static addListeners(card){
    card.addEventListener('click', markMikve);
  }

  static showStars(card, rating){
    const starsDiv = card.querySelector('.stars');
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
}
customElements.define('mikve-cards', MikveCards);
