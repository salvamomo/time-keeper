/**
 * Controls menu creation on startup.
 */

// Load required packages.
var gui = window.require('nw.gui');

module.exports = {

  init: function() {
    createTrayIcon();
  }

};

function createTrayIcon() {
  // Create a tray icon and give it a menu.
  // http://stackoverflow.com/questions/12714923/os-x-icons-size/24702329#24702329
  var tray = new gui.Tray({ icon: 'assets/img/tray-icon.png' });
  var menu = new gui.Menu({type: 'menubar'});

  var aboutLink = {
    type: 'normal',
    label: 'About',
    click: function() {
      // Create a new window and get it
      gui.Window.open('about.html', {}, function(new_win) {
        // And listen to new window's focus event
        new_win.on('focus', function () {
          console.log('New window is focused');
        });
      });
    }
  };

  menu.append(new gui.MenuItem(aboutLink));
  menu.append(new gui.MenuItem({
    type: 'normal',
    label: 'Quit',
    key: 'q',
    click: function() {
      window.alert('TODO: Close application when this is clicked.');
    }
  }));

  var menuBar = new gui.Menu({type: 'menubar'});
  menuBar.createMacBuiltin("Time Keeper", {
    hideEdit: true,
    hideWindow: true
  });

  // Remove OSX's default 'about...' link and insert our custom one.
  menuBar.items[0].submenu.removeAt(0);
  aboutLink.label = 'About Time Keeper';
  menuBar.items[0].submenu.insert(new gui.MenuItem(aboutLink));

  gui.Window.get().menu = menuBar;
  tray.menu = menu;
}
