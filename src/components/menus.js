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
  var tray = new gui.Tray({ icon: 'assets/img/tray-icon.png' });

  var menu = new gui.Menu();
  menu.append(new gui.MenuItem({
    type: 'checkbox',
    label: 'Preferences',
    click: function() {
      alert('TODO: Show the preferences pane / page.');
    }
  }));
  menu.append(new gui.MenuItem({ type: 'separator' }));
  menu.append(new gui.MenuItem({
    type: 'checkbox',
    label: 'About',
    click: function() {
      alert('TODO: Trigger a small window with basic info about the app.');
    }
  }));
  menu.append(new gui.MenuItem({
    type: 'checkbox',
    label: 'Quit',
    click: function() {
      alert('TODO: Close application when this is clicked.');
    }
  }));
  tray.menu = menu;
}
