/**
 * Main application js file.
 */

// Load required packages.
var menus = require('./components/menus');
// var timeEntries = require('./components/time-entry');

// When window is ready, initialise app.
var timeKeeper = timeKeeper || { settings: {}};

window.onload = init;

/**
 * Main entry point for the application.
 */
function init() {
  console.log("Initialising application");

  timeKeeper.TimeEntryManager = TimeEntryManager();

  menus.init();

  // Add widget to create a new time entry.
  addTimeEntryFormWidget();
  // Add region for time entries. (Time entries manager).
  addTimeEntriesRegion();

  // Add bindings.
  addBindings();
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

  // TODO: All these events should be probably set on the TimeEntryManager.
  document.addEventListener('timeEntryStopped', function(e) {
    timeKeeper.TimeEntryManager.unsetActiveEntry();
  });

  document.addEventListener('timeEntryResumed', function(e) {
    // If there's a time entry running, stop it.
    var activeEntry = timeKeeper.TimeEntryManager.getActiveEntry();
    if (activeEntry) {
      activeEntry.stopTimer();
    }
    var resumedTimeEntry = e.detail;
    timeKeeper.TimeEntryManager.setActiveEntry(resumedTimeEntry);
  });

  document.addEventListener('timeEntryDeleted', function(e) {
    var deletedTimeEntry = e.detail;

    // CHECKME: Could do with a dispose() method on tasks to encapsulate some logic before destroying?
    // e.g detaching events.
    deletedTimeEntry.stopTimer();

    var activeEntry = timeKeeper.TimeEntryManager.getActiveEntry();
    if (activeEntry === deletedTimeEntry) {
      timeKeeper.TimeEntryManager.unsetActiveEntry();
    }
    timeKeeper.TimeEntryManager.deleteTimeEntry(deletedTimeEntry);
    renderTimeEntries();
  });

}

function addBindings() {
  var submitButton = document.getElementById('new-time-entry-submit');
  submitButton.addEventListener('click', function() {
    var newTimeEntryDescription = document.getElementById('new-time-entry-description').value;
    if (newTimeEntryDescription) {
      document.getElementById('new-time-entry-description').value = '';
      timeKeeper.TimeEntryManager.addTimeEntry(newTimeEntryDescription);
      // TODO: This should just add a new task, instead of refreshing the whole list.
      renderTimeEntries();
    }
  });
}
