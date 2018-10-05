"use strict";

var App = {};

function init(timeKeeper) {
  App = timeKeeper;

  var pluginsPlaceholder = document.getElementsByClassName('form').item(0);
  pluginsPlaceholder.innerHTML = renderPluginsForm();

  let saveButton = document.getElementById('settings_plugins_save');
  saveButton.addEventListener('click', function () {

    let enabledPlugins = {};
    let availablePlugins = App.pluginManager.getAvailablePlugins();
    for (var plugin in availablePlugins.plugins) {
      enabledPlugins[plugin] = document.getElementsByName('plugin_' + plugin).item(0).checked === true;
    }

    timeKeeper.pluginManager.savePluginsConfig(enabledPlugins);

    // Let main window know settings have been updated.
    var settingsEvent = new CustomEvent('timeKeeperPluginSettingsSaved', {'detail': enabledPlugins});
    document.dispatchEvent(settingsEvent);

    document.getElementsByClassName('settings_plugins_result').item(0).innerHTML = 'Settings updated';
  });
}

function renderPluginsForm() {
  var availablePlugins = App.pluginManager.getAvailablePlugins();
  var enabledPlugins = App.pluginManager.getEnabledPlugins();

  var pluginOptions = '';
  for (var plugin in availablePlugins.plugins) {
    let formName = 'plugin_' + plugin;
    let label = plugin.charAt(0).toUpperCase() + plugin.slice(1);
    label = label.replace('_', ' ');
    let checked = enabledPlugins.hasOwnProperty(plugin) ? 'checked="checked"' : '';

    pluginOptions += `<span>${label}</span><input type="checkbox" name="${formName}" value="${plugin}" ${checked}><br>`;
  }
  return pluginOptions;
}
