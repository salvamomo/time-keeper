
"use strict";

window.onload = init;

function init() {
  // App accessible from nw.App;
  // Load existing values.
  document.getElementsByName('custom_endpoint_url').item(0).value = window.localStorage.getItem('custom_endpoint_url');
  document.getElementsByName('custom_endpoint_username').item(0).value = window.localStorage.getItem('custom_endpoint_username');
  document.getElementsByName('custom_endpoint_password').item(0).value = window.localStorage.getItem('custom_endpoint_password');

  let saveButton = document.getElementById('custom_endpoint_settings_save');
  saveButton.addEventListener('click', function () {
    // Get username and password and store them.
    let url = document.getElementsByName('custom_endpoint_url').item(0).value;
    let username = document.getElementsByName('custom_endpoint_username').item(0).value;
    let password = document.getElementsByName('custom_endpoint_password').item(0).value;
    window.localStorage.setItem('custom_endpoint_url', url);
    window.localStorage.setItem('custom_endpoint_username', username);
    window.localStorage.setItem('custom_endpoint_password', password);

    // Let main window know settings have been updated.
    var settingsEvent = new CustomEvent('customEndpointSettingsSaved');
    document.dispatchEvent(settingsEvent);

    document.getElementsByClassName('custom_endpoint_settings_result').item(0).innerHTML = 'Credentials saved';
  });
}
