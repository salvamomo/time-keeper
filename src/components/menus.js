/**
 * Controls menu creation on startup.
 */

"use strict";

/**
 * Module to group functions related to UI and menu-related elements.
 */
function TimeKeeperMenus() {

  /**
   * Creates the tray icon (OSX) and the OSX built-in menu bar items.
   */
  function createMenus(appWindows) {
    // Create a tray icon and give it a menu.
    // http://stackoverflow.com/questions/12714923/os-x-icons-size/24702329#24702329

    var os = require('os');
    var win = nw.Window.get();
    var tray = new nw.Tray({ icon: 'assets/img/tray-icon.png' });
    var menu = new nw.Menu();

    var aboutLink = {
      type: 'normal',
      label: 'About',
      click: function() {
        // Use a marker to forbid opening several instancies of the same window.
        if (appWindows.aboutWindow === undefined) {
          appWindows.aboutWindow = true;
          // Create a new window and store it.
          appWindows.aboutWindow = nw.Window.open('src/about.html', {
            id: "about",
            height: 280,
            width: 300,
            focus: true,
            fullscreen: false,
            resizable: false
          });
          appWindows.aboutWindow.on('close', function(aboutWindow) {
            appWindows.aboutWindow = undefined;
            this.close(true);
          })
        }
      }
    };

    var pluginsLink = {
      type: 'normal',
      label: 'Plugins',
      click: function () {
        appWindows.pluginsWindow = nw.Window.open('src/settings_plugins.html', {
          id: "plugins",
          height: 280,
          width: 300,
          focus: true,
          fullscreen: false,
          resizable: false
        }, function(new_window) {
          new_window.on('loaded', function() {
            // Might want to remove menu entries when disabling plugins.
            // Use document.addEventListener() for that.
            // var document = new_window.window.document;
            new_window.window.init(timeKeeper);
          });
        });
      }
    };

    menu.append(new nw.MenuItem(aboutLink));
    menu.append(new nw.MenuItem({ type: 'separator' }));

    var pluginsSettingsLinks = timeKeeper.pluginManager.invokeSettingsMenuLinks();
    for (let i = 0; i < pluginsSettingsLinks.length; i++) {
      menu.append(new nw.MenuItem(pluginsSettingsLinks[i]));
      menu.append(new nw.MenuItem({ type: 'separator' }));
    }

    menu.append(new nw.MenuItem({
      type: 'normal',
      label: 'Quit',
      key: 'q',
      click: function() {
        nw.App.quit();
      }
    }));
    tray.menu = menu;

    var menuBar = new nw.Menu({type: 'menubar'});

    if (os.platform() === "darwin") {
      menuBar.createMacBuiltin("Time Keeper", {
        hideEdit: false,
        hideWindow: true
      });
      // Remove OSX's default 'about...' link and insert our custom one.
      menuBar.items[0].submenu.removeAt(0);
      aboutLink.label = 'About Time Keeper';
      menuBar.items[0].submenu.insert(new nw.MenuItem(aboutLink));
    }

    var settingsMenu = new nw.Menu();
    settingsMenu.append(new nw.MenuItem(pluginsLink));

    for (let i = 0; i < pluginsSettingsLinks.length; i++) {
      settingsMenu.append(new nw.MenuItem(pluginsSettingsLinks[i]));
    }

    menuBar.append(new nw.MenuItem({
      label: 'Settings',
      submenu: settingsMenu
    }));


    if (os.platform() !== "darwin") {
      let helpMenu = new nw.Menu();

      aboutLink.label = 'About Time Keeper';
      helpMenu.append(new nw.MenuItem(aboutLink));
      menuBar.append(new nw.MenuItem({
        label: 'Help',
        submenu: helpMenu
      }));
    }

    // Make sure menu is assigned at the very end, or else items added after
    // assigning it to win.menu, might not appear in all systems (e.g: it's fine
    // on OSX, but not Ubuntu).
    win.menu = menuBar;
  }

  var publicAPI = {
    init: createMenus
  };
  return publicAPI;
}
