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

  timeKeeper.time_entries.list = timeKeeper.time_entries.list || [];
  timeKeeper.time_entries.list.push(timeEntry);
}


function addTimeEntryFormWidget() {
  var widgetMarkup = "<div id='new-time-entry-wrapper'>" +
    "<input type='text' id='new-time-entry-description' placeholder='Insert a task description'>" +
    "<button type='submit' id='new-time-entry-submit'>Add</button>" +
    "</div>";
  document.body.innerHTML += widgetMarkup;
}

function addTimeEntriesRegion() {
  var regionWrapper = '<div id="time-entries-wrapper"><ul><li>YES!</li></ul></div>';
  document.body.innerHTML += regionWrapper;
  renderTimeEntries();
}

function renderTimeEntries() {
  document.getElementById('time-entries-wrapper');

  if (timeKeeper.time_entries.list) {
    timeKeeper.time_entries.list.forEach(function(timeEntry, index, entriesList) {
      if (timeEntry instanceof TimeEntry) {
        alert(timeEntry.render());
      }
    });
  }

}

function addBindings() {
  var submitButton = document.getElementById('new-time-entry-submit');
  submitButton.addEventListener('click', function() {

    var newTimeEntryDescription = document.getElementById('new-time-entry-description').value;
    document.getElementById('new-time-entry-description').value = '';
    timeKeeper.addTimeEntry(newTimeEntryDescription);

    // TODO: This should just add a new task, instead of refreshing the whole list.
    renderTimeEntries();
  });
}








