
"use strict";

window.onload = init;

function init() {
  // App accessible from nw.App;
  // Load existing values.
  document.getElementsByName('jira_username').item(0).value = window.localStorage.getItem('jira_username');
  document.getElementsByName('jira_password').item(0).value = window.localStorage.getItem('jira_password');

  let saveButton = document.getElementById('jira_settings_save');
  saveButton.addEventListener('click', function () {
    // Get username and password and store them.
    let username = document.getElementsByName('jira_username').item(0).value;
    let password = document.getElementsByName('jira_password').item(0).value;
    window.localStorage.setItem('jira_username', username);
    window.localStorage.setItem('jira_password', password);

    let success = document.createElement('span');
    success.innerText = 'Credentials saved';
    document.getElementById('jira-authentication').appendChild(success);
  });
}
