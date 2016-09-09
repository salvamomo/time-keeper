/**
 * Main application js file.
 */

// Load required packages.
var menus = require('./components/menus');
// var db = require('./components/db');
// var timeEntries = require('./components/time-entry');

// When window is ready, initialise app.
var timeKeeper = timeKeeper || { settings: {}};

window.onload = init;

/**
 * Main entry point for the application.
 */
function init() {
  console.log("Initialising application");

  console.log("Starting local database.");
  // TODO: db name should be kept in a list of constants.
  timeKeeper.db = new Database('timeKeeper', function() {
    // TimeEntryManager file loaded from index.html.
    timeKeeper.TimeEntryManager = TimeEntryManager();

    menus.init();
    // Add widget to create a new time entry.
    addTimeEntryFormWidget();
    // Add region for time entries. (Time entries manager).
    addTimeEntriesRegion();
    // Add bindings.
    addBindings();
  });
}

function addTimeEntryFormWidget() {
  var widgetMarkup = "<div id='new-time-entry-wrapper'>" +
    "<input type='text' id='new-time-entry-description' placeholder='Insert a task description'>" +
    "<button type='submit' id='new-time-entry-submit'>Start</button>" +
    "</div>";
  document.getElementById('top-widgets').innerHTML += '<div class="widget">' + widgetMarkup + '</div>';
}

function addTimeEntriesRegion() {
  var regionWrapper = '<div class="widget"><div id="time-entries-wrapper"></div></div>';
  document.getElementById('middle-widgets').innerHTML += regionWrapper;
  renderTimeEntries();
}

function renderTimeEntries() {
  var timeEntries = timeKeeper.TimeEntryManager.getTimeEntries();
  if (timeEntries) {
    document.getElementById('time-entries-wrapper').innerHTML = '<ul></ul>';

    var entry_markup = '';
    var entry_list_container = document.getElementById('time-entries-wrapper').getElementsByTagName('ul').item(0);

    timeEntries.forEach(function(timeEntry, index, entriesList) {
      if (timeEntry instanceof TimeEntry) {
        entry_markup = timeEntry.render();
        entry_list_container.appendChild(document.createElement('li')).appendChild(entry_markup);
      }
    });
  }
}

function addBindings() {
  var submitButton = document.getElementById('new-time-entry-submit');
  submitButton.addEventListener('click', function() {
    var newTimeEntryDescription = document.getElementById('new-time-entry-description').value;
    if (newTimeEntryDescription) {
      document.getElementById('new-time-entry-description').value = '';
      timeKeeper.TimeEntryManager.addTimeEntry(newTimeEntryDescription);
    }
  });
}
