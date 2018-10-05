"use strict";

function init(timeKeeper) {
  this.App = timeKeeper;

  var enabledPlugins = timeKeeper.pluginManager.getEnabledPlugins();

  document.getElementsByName('plugin_jira').item(0).checked = enabledPlugins.hasOwnProperty('jira');
  document.getElementsByName('plugin_custom_endpoint').item(0).checked = enabledPlugins.hasOwnProperty('custom_endpoint');

  let saveButton = document.getElementById('settings_plugins_save');
  saveButton.addEventListener('click', function () {

    let enabledPlugins = {};
    enabledPlugins.jira = document.getElementsByName('plugin_jira').item(0).checked === true;
    enabledPlugins.custom_endpoint = document.getElementsByName('plugin_custom_endpoint').item(0).checked === true;
    timeKeeper.pluginManager.savePluginsConfig(enabledPlugins);

    // Let main window know settings have been updated.
    var settingsEvent = new CustomEvent('timeKeeperPluginSettingsSaved', {'detail': enabledPlugins});
    document.dispatchEvent(settingsEvent);

    document.getElementsByClassName('settings_plugins_result').item(0).innerHTML = 'Settings updated';
  });
}
