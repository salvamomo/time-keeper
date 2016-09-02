/**
 * Main application js file.
 */

// Load required packages.
var menus = require('./components/menus');
// var time_entries = require('./components/time-entry');

// When window is ready, initialise app.
var timeKeeper = timeKeeper || { time_entries: {}, settings: {}};

window.onload = init;

/**
 * Main entry point for the application.
 */
function init() {
  console.log("Initialising application");

  menus.init();

  // Add widget to create a new time entry.
  addTimeEntryFormWidget();
  // Add region for time entries. (Time entries manager).
  addTimeEntriesRegion();

  // Add bindings.
  addBindings();
}

timeKeeper.addTimeEntry = function(description) {
  var timeEntry = new TimeEntry(description);

  // Get current active entry, and stop it.
  if (timeKeeper.time_entries.active_entry !== undefined) {
    var currentActiveEntry = timeKeeper.time_entries.active_entry;
    currentActiveEntry.stopTimer();
  }
  timeEntry.startTimer();

  timeKeeper.time_entries.list = timeKeeper.time_entries.list || [];
  timeKeeper.time_entries.list.push(timeEntry);
  timeKeeper.time_entries.active_entry = timeEntry;
}

// This should rely on the internal db.
timeKeeper.getNextTimeEntryId = function() {
  timeKeeper.time_entries.last_id = timeKeeper.time_entries.last_id || 0;
  timeKeeper.time_entries.last_id++;
  return timeKeeper.time_entries.last_id;
}


function addTimeEntryFormWidget() {
  var widgetMarkup = "<div id='new-time-entry-wrapper'>" +
    "<input type='text' id='new-time-entry-description' placeholder='Insert a task description'>" +
    "<button type='submit' id='new-time-entry-submit'>Add</button>" +
    "</div>";
  document.body.innerHTML += widgetMarkup;
}

function addTimeEntriesRegion() {
  var regionWrapper = '<div id="time-entries-wrapper"></div>';
  document.body.innerHTML += regionWrapper;
  renderTimeEntries();
}

function renderTimeEntries() {
  if (timeKeeper.time_entries.list) {
    document.getElementById('time-entries-wrapper').innerHTML = '<ul></ul>';

    var entry_markup = '';
    var entry_list_container = document.getElementById('time-entries-wrapper').getElementsByTagName('ul').item(0);

    timeKeeper.time_entries.list.forEach(function(timeEntry, index, entriesList) {
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
      timeKeeper.addTimeEntry(newTimeEntryDescription);
    }
    // TODO: This should just add a new task, instead of refreshing the whole list.
    renderTimeEntries();
  });
}








