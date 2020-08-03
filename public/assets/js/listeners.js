class Listeners {

  static addAllDocumentListeners(){
    Listeners.addListenersToLoginSection();
    Listeners.addListenersToHomeSection();
    Listeners.addListenersToChooseMikveSection();
    Listeners.addListenersToChooseTimeSection();
    Listeners.addListenersToConfirmSection();
    Listeners.addListenersToSettingsSection();
    Listeners.addListenersToAppointmentsSection();
    Listeners.addModalCloseListeners();
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
    byId('show-appointments-btn').addEventListener('click', Render.Sections.appointments);
    byId('star-mikve-btn').addEventListener('click', starMikve);
    byId('dont-star-btn').addEventListener('click', Render.closeAskToStar);
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
  static addListenersToAppointmentsSection(){
    byId('load-appointment-list-btn').addEventListener('click', loadAppointments);
    qAll('[name="load-appointments-date"]').forEach(i =>
      i.addEventListener('change', enableLoadappointmentListBtn));
    byId('print-appointments-btn').addEventListener('click', printAppointments);
  }
  static addListenersToSettingsSection(){
    byId('settings-btn').addEventListener('click', Render.Sections.settings);
    byId('cancel-settings').addEventListener('click', Render.Sections.settings);
    q('#settings form').addEventListener('submit', applySettings);
  }
  static addModalCloseListeners(){
    const modals = byClass('modal');
    for (const m of modals) bindModalBySelectors(m);

    function bindModalBySelectors(modal){
      // When the user clicks anywhere outside of the box, close it
      modal.addEventListener('click', closeModal);

      function closeModal(event){
        const closeBtn = modal.querySelector('.close');
        if (event.target == modal || event.target == closeBtn)
          hide(modal);
      }
      function showModal(){ unhide(modal); }
    }
  }

}
