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
    "<div class='time-entry-form'>" +
    "<input type='text' id='new-time-entry-description' placeholder='Insert a task description'>" +
    "<button type='submit' id='new-time-entry-submit'>Start</button>" +
    "</div>" +
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

  // Add a '0' before a time element if it has only 1 digit.
  function padTimeComponentString(timeComp) {
    if (timeComp.toString().length == 1) {
      timeComp = '0' + timeComp;
    }
    return timeComp;
  }

  if (timeEntries) {
    document.getElementById('time-entries-wrapper').innerHTML = '<ul></ul>';

    var entry_markup = '';
    var entry_list_container = document.getElementById('time-entries-wrapper').getElementsByTagName('ul').item(0);

    var totalTimesByDate = [];
    var weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // TODO: Optimize this and the loop below in a single loop.
    timeEntries.forEach(function(timeEntry, index, entriesList) {
      if (timeEntry instanceof TimeEntry) {
        if (totalTimesByDate[timeEntry.date.toDateString()] == undefined) {
          totalTimesByDate[timeEntry.date.toDateString()] = {};
          totalTimesByDate[timeEntry.date.toDateString()].total_time = 0;
        }
        totalTimesByDate[timeEntry.date.toDateString()].total_time += timeEntry.total_time;
      }
    });

    timeEntries.forEach(function(timeEntry, index, entriesList) {
      if (timeEntry instanceof TimeEntry) {
        // TODO: Clunky. Written in a rush. clean it up!
        // First item of a given group. Render group heading and remove it from
        // groups array.
        if (totalTimesByDate[timeEntry.date.toDateString()].rendered == undefined) {
          var totalTimeFormattedHours = Math.floor(totalTimesByDate[timeEntry.date.toDateString()].total_time / (60 * 60));
          var totalTimeFormattedMinutes = padTimeComponentString(Math.floor((totalTimesByDate[timeEntry.date.toDateString()].total_time % (60 * 60)) / 60));
          var formattedGroupDate = weekDays[timeEntry.date.getDay()] + ', ' + padTimeComponentString(timeEntry.date.getDate()) + ' ' + monthNames[timeEntry.date.getMonth()];

          var groupNode = document.createElement('div');
          groupNode.className = 'time-entry-wrapper time-entry-group';
          groupNode.innerHTML = '<div class="time-entry-group-heading">' +
            '<div class="time-entry-group-info">' +
            '<span class="time-entry-group-date">' + formattedGroupDate + '</span>' +
            '</div>' +
            '<div class="time-entry-group-total">' +
            '<span class="time-entry-group-total-spent">' + totalTimeFormattedHours + ' h ' + totalTimeFormattedMinutes + ' min</span>' +
            '</div>' +
            '</div>';

          entry_list_container.appendChild(document.createElement('li')).appendChild(groupNode);
          totalTimesByDate[timeEntry.date.toDateString()].rendered = true;
        }


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
