
"use strict";

window.onload = init;

function init() {
  // App accessible from nw.App;
  // Load existing values.
  document.getElementsByName('jira_url').item(0).value = window.localStorage.getItem('jira_url');
  document.getElementsByName('jira_username').item(0).value = window.localStorage.getItem('jira_username');
  document.getElementsByName('jira_password').item(0).value = window.localStorage.getItem('jira_password');

  let saveButton = document.getElementById('jira_settings_save');
  saveButton.addEventListener('click', function () {
    // Get username and password and store them.
    let url = document.getElementsByName('jira_url').item(0).value;
    let username = document.getElementsByName('jira_username').item(0).value;
    let password = document.getElementsByName('jira_password').item(0).value;
    window.localStorage.setItem('jira_url', url);
    window.localStorage.setItem('jira_username', username);
    window.localStorage.setItem('jira_password', password);

    // Let main window know settings have been updated.
    var settingsEvent = new CustomEvent('jiraSettingsSaved');
    document.dispatchEvent(settingsEvent);

    document.getElementsByClassName('jira_settings_result').item(0).innerHTML = 'Credentials saved';
  });
}
