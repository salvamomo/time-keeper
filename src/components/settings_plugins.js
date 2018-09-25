"use strict";

window.onload = init;

function init() {
  // App accessible from nw.App;
  // Load existing values.
  document.getElementsByName('plugin_jira').item(0).checked = window.localStorage.getItem('config.enabled_plugins.jira') == true
    ? "checked"
    : false;
  document.getElementsByName('plugin_custom_endpoint').item(0).checked = window.localStorage.getItem('config.enabled_plugins.custom_endpoint') == true
    ? "checked"
    : false;

  let saveButton = document.getElementById('settings_plugins_save');
  saveButton.addEventListener('click', function () {

    let enabledPlugins = {};
    enabledPlugins.jira = document.getElementsByName('plugin_jira').item(0).checked === true;
    enabledPlugins.custom_endpoint = document.getElementsByName('plugin_custom_endpoint').item(0).checked === true;

    enabledPlugins.jira = enabledPlugins.jira ? 1 : 0;
    enabledPlugins.custom_endpoint = enabledPlugins.custom_endpoint ? 1 : 0;

    window.localStorage.setItem('config.enabled_plugins.jira', enabledPlugins.jira);
    window.localStorage.setItem('config.enabled_plugins.custom_endpoint', enabledPlugins.custom_endpoint);

    // Let main window know settings have been updated.
    var settingsEvent = new CustomEvent('timeKeeperPluginSettingsSaved');
    document.dispatchEvent(settingsEvent);

    document.getElementsByClassName('settings_plugins_result').item(0).innerHTML = 'Settings updated';
  });
}
