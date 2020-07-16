class Listeners {

  static addAllDocumentListeners(){
    Listeners.addListenersToLoginSection();
    Listeners.addListenersToHomeSection();
    Listeners.addListenersToChooseMikveSection();
    Listeners.addListenersToChooseTimeSection();
    Listeners.addListenersToConfirmSection();
    Listeners.addListenersToSettingsSection();
    // window.onbeforeunload = function() {
    //   return "בטוחים שברצונכם לצאת מהאפליקציה?"};
  }

  // Listeners
  // TODO: Query from relevant section for performance.
  static addListenersToLoginSection(){
    q('#enter-via-sms form').addEventListener('submit', onSignInSubmit);
    byId('logout').addEventListener('click', Auth.signOut);
    q('#sms-msg form').addEventListener('submit', registerUser);
  }

  static addListenersToHomeSection(){
    byId('set-appointment-btn').addEventListener('click', Render.Sections.chooseMikve);
  }

  static addListenersToChooseMikveSection(){
    byId('set-mikve-btn').addEventListener('click', Render.Sections.chooseTime);
  }
  static addListenersToChooseTimeSection(){
    qAll('input[name="schedule-type"]').forEach(i =>
      i.addEventListener('change', Render.shiftScheduleType));
    byId('select-hour').addEventListener('change', setHour);
    byId('set-time-btn').addEventListener('click', Render.Sections.confirm);
  }
  static addListenersToConfirmSection(){
    byId('confirm-btn').addEventListener('click', setAppointment);
  }
  static addListenersToSettingsSection(){
    byId('settings-btn').addEventListener('click', Render.Sections.settings);
    byId('cancel-settings').addEventListener('click', Render.Sections.settings);
    q('#settings form').addEventListener('submit', applySettings);
  }

  static bindModalBySelectors(btns, modal){
    if (btns.length) for (const btn of btns)
      btn.addEventListener('click', showModal);
    else btns.addEventListener('click', showModal);
    // When the user clicks anywhere outside of the box, close it
    modal.addEventListener('click', closeModal);

    function closeModal(event){
      const closeBtn = modal.querySelector('.close');
      if (event.target == modal || event.target == closeBtn)
        modal.style.display = "none";
    }
    function showModal(){ modal.style.display = "block"; }
  }

}
