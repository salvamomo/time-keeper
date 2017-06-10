/**
 * Main application js file.
 */

// When window is ready, initialise app.
var timeKeeper = timeKeeper || { settings: {}};
timeKeeper.windows = {};

window.onload = init;

/**
 * Main entry point for the application.
 */
function init() {
  process_args();
  const databaseName = 'timeKeeper';

  console.log("Initialising application");
  console.log("Starting local database.");

  timeKeeper.menus = TimeKeeperMenus();

  let jira_u = window.localStorage.getItem('jira_username');
  let jira_p = window.localStorage.getItem('jira_password');
  timeKeeper.jira = Jira(jira_u, jira_p);

  timeKeeper.db = tkDatabase(databaseName);
  timeKeeper.db.init(function() {
    // Add widget to create a new time entry.
    addTimeEntryFormWidget();
    // Add region for time entries and render them. (Time entries manager).
    addTimeEntriesRegion();
    renderTimeEntries();
    // Add bindings.
    addBindings();

    // TimeEntryManager file loaded from index.html.
    timeKeeper.TimeEntryManager = TimeEntryManager();
    timeKeeper.menus.init(timeKeeper.windows);
  });
}

/**
 * Reads command-line arguments and triggers any necessary actions.
 */
function process_args() {
  nw.App.argv.forEach(function(arg, index, args) {
    if (arg === '--enable-devtools=1') {
      console.log('Enabling devtools.');
      nw.Window.get().showDevTools();
    }
  });
}

/**
 * Renders the form to use when adding new time entries.
 */
function addTimeEntryFormWidget() {
  var widgetMarkup = "<div id='new-time-entry-wrapper'>" +
    "<div class='time-entry-form'>" +
    "<input type='text' id='new-time-entry-description' placeholder='Insert a task description'>" +
    "<button type='submit' id='new-time-entry-submit'>Start</button>" +
    "</div>" +
    "</div>";
  document.getElementById('top-widgets').innerHTML += '<div class="widget">' + widgetMarkup + '</div>';
}

/**
 * Renders the region where time entries will be included.
 */
function addTimeEntriesRegion() {
  var regionWrapper = '<div class="widget"><div id="time-entries-wrapper"></div></div>';
  document.getElementById('middle-widgets').innerHTML += regionWrapper;
}

/**
 * Renders existing time entries in the time entries region.
 */
function renderTimeEntries() {
  var timeEntries = (timeKeeper.TimeEntryManager != undefined) ? timeKeeper.TimeEntryManager.getTimeEntries() : [];
  var currentEntryGroupInterval = false;

  if (timeEntries) {
    document.getElementById('time-entries-wrapper').innerHTML = '<ul></ul>';

    var entry_markup = '';
    var entry_list_container = document.getElementById('time-entries-wrapper').getElementsByTagName('ul').item(0);

    var totalTimesByDate = [];
    var weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
        // First item of a given group. Render group heading and remove it from
        // groups array.
        if (totalTimesByDate[timeEntry.date.toDateString()].rendered == undefined) {
          var totalTimeFormatted = formatTimeAsHoursAndMinutes(totalTimesByDate[timeEntry.date.toDateString()].total_time);
          var formattedGroupDate = weekDays[timeEntry.date.getDay()] + ', ' + padTimeComponentString(timeEntry.date.getDate()) + ' ' + monthNames[timeEntry.date.getMonth()];

          var groupNode = document.createElement('div');
          groupNode.dataset['time:entry:group'] = timeEntry.date.toDateString();
          groupNode.id = timeEntry.date.toDateString();
          groupNode.className = 'time-entry-wrapper time-entry-group';
          groupNode.innerHTML = '<div class="time-entry-group-heading">' +
            '<div class="time-entry-group-info">' +
            '<span class="time-entry-group-date">' + formattedGroupDate + '</span>' +
            '</div>' +
            '<div class="time-entry-group-total">' +
            '<span class="time-entry-group-total-spent">' + totalTimeFormatted + '</span>' +
            '</div>' +
            '</div>';


          // Refresh total time every minute for current day (interval set to
          // every second).
          if (currentEntryGroupInterval === false) {
            var currentDayEntryGroupId = timeEntry.date.toDateString();
              currentEntryGroupInterval = setInterval(function() {
                var groupTotalTime = timeKeeper.TimeEntryManager.getTotalTimeForEntryGroup(currentDayEntryGroupId);
                var currentDayGroupElement = document.getElementById(currentDayEntryGroupId);

                // In case there was just one entry, and it was deleted, clear
                // the interval for the current day header update.
                if (currentDayGroupElement === null) {
                  clearInterval(currentEntryGroupInterval);
                  currentEntryGroupInterval = false;
                  return;
                }
                document.getElementById(currentDayEntryGroupId).getElementsByClassName('time-entry-group-total-spent').item(0).innerHTML = groupTotalTime;
            }, 1000);
          }

          entry_list_container.appendChild(document.createElement('li')).appendChild(groupNode);
          totalTimesByDate[timeEntry.date.toDateString()].rendered = true;
        }


        entry_markup = timeEntry.render();
        entry_list_container.appendChild(document.createElement('li')).appendChild(entry_markup);
      }
    });
  }
}

/**
 * Attaches bindings to the addTimeEntryForm widget.
 */
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
