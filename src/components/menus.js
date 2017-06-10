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
    var tray = new nw.Tray({ icon: 'assets/img/tray-icon.png' });
    var menu = new nw.Menu({type: 'menubar'});

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

    // Create and append the 1st level menu to the menubar
    var jiraLink = {
      type: 'normal',
      label: 'Jira Integration',
      click: function () {
        appWindows.jiraWindow = nw.Window.open('src/jira.html', {
          id: "jira",
          height: 280,
          width: 300,
          focus: true,
          fullscreen: false,
          resizable: false
        }, function(new_window) {
          new_window.on('close', function() {
            this.hide();
            let jira_url = window.localStorage.getItem('jira_url');
            let jira_u = window.localStorage.getItem('jira_username');
            let jira_p = window.localStorage.getItem('jira_password');
            timeKeeper.jira = new Jira(jira_url, jira_u, jira_p);
            this.close(true);
          });
        });
      }
    };

    menu.append(new nw.MenuItem(aboutLink));
    menu.append(new nw.MenuItem({ type: 'separator' }));
    menu.append(new nw.MenuItem(jiraLink));
    menu.append(new nw.MenuItem({ type: 'separator' }));
    menu.append(new nw.MenuItem({
      type: 'normal',
      label: 'Quit',
      key: 'q',
      click: function() {
        nw.App.quit();
      }
    }));

    var menuBar = new nw.Menu({type: 'menubar'});
    menuBar.createMacBuiltin("Time Keeper", {
      hideEdit: true,
      hideWindow: true
    });

    // Remove OSX's default 'about...' link and insert our custom one.
    menuBar.items[0].submenu.removeAt(0);
    aboutLink.label = 'About Time Keeper';
    menuBar.items[0].submenu.insert(new nw.MenuItem(aboutLink));

    var settingsMenu = new nw.Menu();
    settingsMenu.append(new nw.MenuItem(jiraLink));

    menuBar.append(new nw.MenuItem({
      label: 'Settings',
      submenu: settingsMenu
    }));


    nw.Window.get().menu = menuBar;
    tray.menu = menu;
  }

  var publicAPI = {
    init: createMenus
  };
  return publicAPI;
}
