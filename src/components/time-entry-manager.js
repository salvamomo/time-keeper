/**
 *  Time entry manager.
 */

"use strict";

function TimeEntryManager() {
  var active_entry;
  var time_entries = [];

  // Set up entries in the UI.
  (function loadTimeEntriesFromDb() {
    var dbEntryHolder = null;

    timeKeeper.db.getAllTimeEntriesSortedByDate(function(timeEntries) {
      for (var i = 0; i < timeEntries.length; i++) {

        dbEntryHolder = TimeEntry.createFromDBObject(timeEntries[i]);
        if (dbEntryHolder) {
          time_entries.push(dbEntryHolder);

          // Worth having a separate control variable to track what's the actual
          // active entry, instead of relying on the time entry itself?
          if (dbEntryHolder.active) {
            timeKeeper.TimeEntryManager.setActiveEntry(dbEntryHolder);
          }
        }
      }
      renderTimeEntries();
    });
  })();

  function addTimeEntry(description) {
    var timeEntry = new TimeEntry(description);

    // Get current active entry, and stop it.
    if (active_entry != null) {
      active_entry.stopTimer();
      // timeKeeper.db.updateTimeEntry(active_entry);
    }

    timeEntry.startTimer();
    time_entries.unshift(timeEntry);

    // TODO: Add error handling here. seriously. Add it!
    timeKeeper.db.createTimeEntry(timeEntry, function(time_entry_id) {
      timeEntry.setTimeEntryId(time_entry_id);
      renderTimeEntries();
    });
    timeKeeper.TimeEntryManager.setActiveEntry(timeEntry);
  }

  function resumeTimeEntry(resumedTimeEntry) {
    resumedTimeEntry.startTimer();
    timeKeeper.TimeEntryManager.setActiveEntry(resumedTimeEntry);
    timeKeeper.db.updateTimeEntry(resumedTimeEntry);
  }

  // CHECKME: would removeTimeEntry() be a better name?
  function deleteTimeEntry(timeEntry) {
    for(var index in time_entries) {
      if (time_entries[index].time_entry_id == timeEntry.time_entry_id) {
        time_entries.splice(index, 1);
        break;
      }
    }
  }

  function getTimeEntries() {
    return time_entries;
  }

  function getActiveEntry() {
    return active_entry;
  }

  function getTotalTimeForEntryGroup(groupDateString) {
    var totalTimeByDate = 0;

    time_entries.forEach(function(timeEntry, index, timeEntries) {
      if (timeEntry.date.toDateString() == groupDateString) {
        totalTimeByDate += timeEntry.total_time;
      }
    });
    return formatTimeAsHoursAndMinuted(totalTimeByDate);
  }

  function setActiveEntry(timeEntry) {
    // CHECKME: Need further checks here?
    active_entry = timeEntry;
  }

  function unsetActiveEntry() {
    active_entry = null;
  }


  // TODO: These event listeners need improving.
  // Not sure of what to do with them and how to make that smooth between tasks
  // and the manager, so just ditching them here for the time being.
  // NOTE: Placed here and not in main renderEntries() function, as that's
  // called every time a new entry is added (or deleted), and will cause
  // events to be binded more than once.
  (function addEventListeners() {
    document.addEventListener('timeEntryStopped', function(e) {
      var stoppedEntry = e.detail;
      // Check the task stopped is the active one, before assuming it is. It
      // could be that a 'stopped' event is triggered when the task is going to
      // be deleted.
      if (stoppedEntry === timeKeeper.TimeEntryManager.getActiveEntry()) {
        timeKeeper.TimeEntryManager.unsetActiveEntry();
      }
      timeKeeper.db.updateTimeEntry(stoppedEntry, function() {
        // Check me: Want to add anything here?
      });
    });

    document.addEventListener('timeEntryResumed', function(e) {
      // If there's a time entry running, stop it.
      var activeEntry = timeKeeper.TimeEntryManager.getActiveEntry();
      if (activeEntry) {
        activeEntry.stopTimer();
      }
      var resumedTimeEntry = e.detail;

      // If entry was created in a day previous to today. Resume as a new one.
      var today = new Date();

      if (today.getDate() > resumedTimeEntry.date.getDate()
        || today.getMonth() > resumedTimeEntry.date.getMonth()
        || today.getFullYear() > resumedTimeEntry.date.getFullYear()) {
          timeKeeper.TimeEntryManager.addTimeEntry(resumedTimeEntry.description);
      }
      // Else, just resume timer.
      else {
        resumeTimeEntry(resumedTimeEntry);
      }
    });

    document.addEventListener('timeEntryUpdated', function(e) {
      var updatedEntry = e.detail;
      timeKeeper.db.updateTimeEntry(updatedEntry, function(success) {
        if (success === false) {
          alert('Oops. An error happened when updating the TimeEntry in the database.');
        }
      });
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
      timeKeeper.db.deleteTimeEntry(deletedTimeEntry.time_entry_id, function(success) {
        if (success) {
          timeKeeper.TimeEntryManager.deleteTimeEntry(deletedTimeEntry);
          renderTimeEntries();
        }
        else {
          alert("Oops. There was an error deleting this time entry. Please try again.");
        }
      });
    });
  })();


  var publicAPI = {
    addTimeEntry: addTimeEntry,
    getTimeEntries: getTimeEntries,
    getTotalTimeForEntryGroup: getTotalTimeForEntryGroup,
    getActiveEntry: getActiveEntry,
    setActiveEntry: setActiveEntry,
    unsetActiveEntry: unsetActiveEntry,
    deleteTimeEntry: deleteTimeEntry
  };
  return publicAPI;
}
