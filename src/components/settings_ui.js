"use strict";

var App = {};

function init(timeKeeper) {
  App = timeKeeper;

  let projectList = window.localStorage.getItem('settings_ui_project_list');

  if (projectList) {
    document.getElementById('settings_ui_project_list').value = projectList;
  }

  let saveButton = document.getElementById('settings_ui_save');
  saveButton.addEventListener('click', function () {

    let uiSettings = {};
    uiSettings.projectList = document.getElementById('settings_ui_project_list').value;
    window.localStorage.setItem('settings_ui_project_list', uiSettings.projectList);

    // Let main window know settings have been updated.
    var settingsEvent = new CustomEvent('timeKeeperSettingsUiSaved', {'detail': uiSettings});
    document.dispatchEvent(settingsEvent);

    document.getElementsByClassName('settings_ui_result').item(0).innerHTML = 'Settings updated';
  });
}
