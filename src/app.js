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
  if (timeKeeper.time_entries.active_entry != null) {
    var currentActiveEntry = timeKeeper.time_entries.active_entry;
    currentActiveEntry.stopTimer();
  }
  timeEntry.startTimer();

  timeKeeper.time_entries.list = timeKeeper.time_entries.list || [];
  // timeKeeper.time_entries.list[timeEntry.time_entry_id] = timeEntry;
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

  document.addEventListener('timeEntryStopped', function(e) {
    timeKeeper.time_entries.active_entry = null;
  });

  document.addEventListener('timeEntryResumed', function(e) {
    // If there's a time entry running, stop it.
    if (timeKeeper.time_entries.active_entry) {
      var currentTimeEntry = timeKeeper.time_entries.active_entry;
      currentTimeEntry.stopTimer();
    }
    var resumedTimeEntry = e.detail;
    timeKeeper.time_entries.active_entry = resumedTimeEntry;
  });

  document.addEventListener('timeEntryDeleted', function(e) {
    var deletedTimeEntry = e.detail;

    // TODO: this would call taskManager.deleteEntry(entryId).
    // delete timeKeeper.time_entries.list[deletedTimeEntry.time_entry_id];
    // CHECKME: Could do with a dispose() method on tasks to encapsulate some logic before destroying?
    // e.g detaching events.
    deletedTimeEntry.stopTimer();

    if (timeKeeper.time_entries.active_entry === deletedTimeEntry) {
      timeKeeper.time_entries.active_entry = null;
    }

    for(var index in timeKeeper.time_entries.list) {
      if (timeKeeper.time_entries.list[index].time_entry_id == deletedTimeEntry.time_entry_id) {
        timeKeeper.time_entries.list.splice(index, 1);
        break;
      }
    }
    renderTimeEntries();
  });

}

function addBindings() {
  var submitButton = document.getElementById('new-time-entry-submit');
  submitButton.addEventListener('click', function() {

    var newTimeEntryDescription = document.getElementById('new-time-entry-description').value;
    if (newTimeEntryDescription) {
      document.getElementById('new-time-entry-description').value = '';
      timeKeeper.addTimeEntry(newTimeEntryDescription);
      // TODO: This should just add a new task, instead of refreshing the whole list.
      renderTimeEntries();
    }
  });
}

// function taskManager() {
//
//   var active_entry;
//   var entries_list;
//   return api;
// }
//
//
//
