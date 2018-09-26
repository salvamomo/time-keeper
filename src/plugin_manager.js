function pluginManager(App) {
  this.App = App;

  function loadPlugins() {
    App.enabled_plugins.jira = window.localStorage.getItem('config.enabled_plugins.jira') == true;
    App.enabled_plugins.custom_endpoint = window.localStorage.getItem('config.enabled_plugins.custom_endpoint') == true;

    for (var pluginName in App.enabled_plugins) {
      if (App.enabled_plugins[pluginName] === true) {
        let plugin = require('./plugins/' + pluginName + '/' + pluginName);
        var loadedPlugin = plugin.load(App);
        console.log('Plugin initialized: ' + loadedPlugin.info.name);
        console.log('Plugin version: ' + loadedPlugin.info.version);

        App.plugins[loadedPlugin.info.name] = loadedPlugin;
        App.plugins[loadedPlugin.info.name].hookInit();
        // timeKeeper.addPlugin(loadedPlugin);
      }
    }
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
  }
}


module.exports = {
  init: pluginManager,
};