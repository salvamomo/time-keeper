var fs = require('fs');

function pluginManager(App) {
  this.App = App;

  function getAvailablePlugins() {
    var availablePluginsFile = fs.readFileSync('plugins.json', 'utf8');
    return JSON.parse(availablePluginsFile);
  }

  function getEnabledPlugins() {
    if (fs.existsSync(nw.App.dataPath + '/' + 'enabled_plugins.json')) {
      var enabledPluginsFile = fs.readFileSync(nw.App.dataPath + '/' + 'enabled_plugins.json', 'utf8');
      var enabledPlugins = JSON.parse(enabledPluginsFile);
      return enabledPlugins;
    }
    return {};
  }

  function loadPlugins() {
    var availablePlugins = getAvailablePlugins();
    App.enabled_plugins = getEnabledPlugins();

    for (var pluginName in availablePlugins.plugins) {
      if (App.enabled_plugins.hasOwnProperty(pluginName)) {
        let plugin = require('./plugins/' + pluginName + '/' + pluginName);
        var loadedPlugin = plugin.load(App);
        console.log('Plugin initialized: ' + loadedPlugin.info.name);
        console.log('Plugin version: ' + loadedPlugin.info.version);
        // This info.name and other meta should be moved into a .json file.
        App.plugins[loadedPlugin.info.name] = loadedPlugin;
        App.plugins[loadedPlugin.info.name].hookInit();
        // timeKeeper.addPlugin(loadedPlugin);
      }
    }
  }

  /**
   * @param enabledPlugins
   */
  function savePluginsConfig(enabledPlugins) {
    var availablePlugins = getAvailablePlugins();

    var config = {};
    for (var pluginName in availablePlugins.plugins) {
      if (enabledPlugins.hasOwnProperty(pluginName) && (enabledPlugins[pluginName] === true)) {
        config[pluginName] = enabledPlugins[pluginName];

        // Can probably get rid of this, and provide a isPluginEnabled() function.
        App.enabled_plugins[pluginName] = true;
      }
    }
    var configJSON = JSON.stringify(config);

    fs.writeFile(nw.App.dataPath + '/' + 'enabled_plugins.json', configJSON, (err) => {
      if (err) {
        console.log('There was a problem saving the plugins config.');
        throw err;
      }
      console.log('Plugins config saved.');
    });
  }

  function invokeSettingsMenuLinks() {
    var menuLinks = [];

    for (var property in App.plugins) {
      if (App.plugins.hasOwnProperty(property)) {
        // TODO: Need a registry of *hooks* implemented, before calling them
        // blindly.
        let menuLink = App.plugins[property].hookSettingsMenuLink();
        menuLinks.push(menuLink);
      }
    }

    return menuLinks;
  }

  function invokeRenderTimeEntryEditable(timeEntry) {
    var widgetAdditions = [];

    for (var property in App.plugins) {
      if (App.plugins.hasOwnProperty(property)) {
        let widgetAlter = App.plugins[property].invokeRenderTimeEntryEditable(timeEntry);
        widgetAdditions.push(widgetAlter);
      }
    }
    return widgetAdditions;
  }

  function invokeTimeEntrySaved(timeEntry) {
    for (var property in App.plugins) {
      if (App.plugins.hasOwnProperty(property)) {
        App.plugins[property].invokeTimeEntrySaved(timeEntry);
      }
    }
  }

  function invokeTimeEntryInit(timeEntry) {
    for (var property in App.plugins) {
      if (App.plugins.hasOwnProperty(property)) {
        App.plugins[property].invokeTimeEntryInit(timeEntry);
      }
    }
  }

  return {
    loadPlugins: loadPlugins,
    invokeSettingsMenuLinks: invokeSettingsMenuLinks,
    invokeTimeEntryInit: invokeTimeEntryInit,
    invokeRenderTimeEntryEditable: invokeRenderTimeEntryEditable,
    invokeTimeEntrySaved: invokeTimeEntrySaved,
    savePluginsConfig: savePluginsConfig,
    getEnabledPlugins: getEnabledPlugins,
  }
}


module.exports = {
  init: pluginManager,
};
