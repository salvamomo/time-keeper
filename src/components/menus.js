/**
 * Controls menu creation on startup.
 */

// Load required packages.
var nw = window.require('nw.gui');

// Export init function so that it can be called from main app file.
module.exports = {

  init: function(appWindows) {
    createMenus(appWindows);
  }

};

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
        appWindows.aboutWindow = nw.Window.open('about.html', {
          height: 280,
          width: 300,
          fullscreen: false,
          resizable: false,
          toolbar: false
        });
        appWindows.aboutWindow.on('close', function() {
          appWindows.aboutWindow = undefined;
          this.close(true);
        })
      }
    }
  };

  menu.append(new nw.MenuItem(aboutLink));
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

  nw.Window.get().menu = menuBar;
  tray.menu = menu;
}
