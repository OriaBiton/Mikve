class Render {

}

Render.Sections = class Sections {
  static async renderSections(){
    const loading = byId('loading');
    const user = Auth.getUser();
    if (user) {
      await Render.Sections.home();
    }
    else {
      Render.Sections.login();
    }
    hide(loading);
  }

  static async wasLobby(placeId, entry, num){
    const lobbyObj = await Database.getLobby(placeId, entry);
    const lobby = lobbyObj.val();
    const sect = sections.lobby;
    const lobbyKey = placeId + entry;
    sect.dataset.key = lobbyKey;
    sect.dataset.num = num;
    sect.querySelector('h1').innerText = lobby.name;

    deletePreviouslyRenderedAppartments();
    deletePreviouslyRenderedInfo();

    await renderAppartments();

    Render.addAllAppartmentInfo(lobbyObj);
    Render.userItemLists();
    Render.Sections.activate('lobby');
    promptAppartmentName();

    function promptAppartmentName(){
      const name = lobby.appartments[num].name;
      if (name) return;
      else unhide(sect.querySelector('.head-msg'));
    }
    async function renderAppartments(){
      const appartments = lobby.appartments;
      for (const number in appartments){
        const apBtn = new AppartmentButton(number);
        sect.querySelector('.appartments').appendChild(apBtn);
      }
    }
    function deletePreviouslyRenderedInfo(){
      const aps = sect.getElementsByTagName('appartment-info');
      for (let i = aps.length - 1; i >= 0; i--) aps[i].remove();
    }
    function deletePreviouslyRenderedAppartments(){
      const aps = sect.getElementsByTagName('appartment-button');
      for (let i = aps.length - 1; i >= 0; i--) aps[i].remove();
    }
  }

  static chooseMikve(e){
    e.preventDefault();
    Render.Sections.activate('chooseMikve');
  }

  static async home(e){
    if (e) e.preventDefault();
    greet();

    Render.Sections.activate('home');

    function greet(){
      const user = Auth.getUser();
      const name = user.displayName;
      const greeting = `היי, ${name}`;
      byId('greeting').innerText = greeting;
    }
  }
  static login(){
    Render.Sections.activate('enterViaSms');
  }
  static sms(){
    Render.Sections.activate('smsMsg');
  }
  static async settings(){
    const user = Auth.getUser();
    if (!user) return notyf.error('אינכם מחוברים למערכת עדיין.');

    const sect = sections.settings;
    if (!sect.hasClass('hidden')) return back();
    await setHideContactBox();
    show();

    async function setHideContactBox(){
      const hideContactBox = sect.querySelector('#hide-contact');
      if (!Render.Sections.checkedHideContactInDb) {
        const path = `users/${user.uid}/hideContact`;
        hideContact = await Database.getValOnce(path);
        Render.Sections.checkedHideContactInDb = true;
      }
      hideContactBox.checked = hideContact;
    }
    function show(){
      const shownSection = getActiveSection();
      lastActiveSection = shownSection;
      toggleHide(shownSection);
      toggleHide(sect);
    }
    function back(){
      toggleHide(sect);
      toggleHide(lastActiveSection);
      lastActiveSection = sect;
    }
  }

  static activate(n){
    const active = getActiveSection();
    if (active) toggleHide(active);
    toggleHide(sections[n]);
  }
}
