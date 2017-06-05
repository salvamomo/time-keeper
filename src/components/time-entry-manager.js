/**
 *  Time entry manager.
 */

"use strict";

function TimeEntryManager() {
  var active_entry;
  var time_entries = [];

  // TODO: Finish this, and decide where to place it and how to call it.
  // Although IIFE doesn't look too bad.
  (function getTimeEntriesFromDb() {
    var timeEntryFromDb = null;

    // TODO: When preferences are implemented, or a widget to show more entries,
    // Make this show only entries for the last week / month by default.
    // CHECKME: All this should be probably an exposed "loadTimeEntries" method.
    timeKeeper.db.getAllTimeEntriesSortedByDate(function(timeEntries) {
      for (var i = 0; i < timeEntries.length; i++) {
        // Any other better way of loading this as an actual TimeEntry object?
        timeEntryFromDb = TimeEntry.createFromDBObject(timeEntries[i])
        if (timeEntryFromDb) {
          time_entries.push(timeEntryFromDb);

          // Worth having a separate control variable to track what's the actual
          // active entry, instead of relying on the time entry itself?
          if (timeEntryFromDb.active) {
            timeKeeper.TimeEntryManager.setActiveEntry(timeEntryFromDb);
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
      // TODO: This should just add a new task to the list, rather than
      // refreshing the whole list.
      renderTimeEntries();
    });
    timeKeeper.TimeEntryManager.setActiveEntry(timeEntry);
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
    // TODO: Statically cache this? Don't want to update every time, but might
    // need to be that way to tackle all scenarios.
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
        // At the moment, this is the same than starting from 0.
        // TODO: Do away with these 3 lines and place them in setActiveEntry?
        resumedTimeEntry.startTimer();
        timeKeeper.TimeEntryManager.setActiveEntry(resumedTimeEntry);
        timeKeeper.db.updateTimeEntry(resumedTimeEntry);
      }
    });

    document.addEventListener('timeEntryUpdated', function(e) {
      var updatedEntry = e.detail;
      timeKeeper.db.updateTimeEntry(updatedEntry, function(success) {
        if (success) {
          // TODO: This could be used to leverage volatile state flags on the
          // task. (e.g: "updateError", so that a visual hint can be placed when
          // rendering it).
        }
        else {
          alert('TODO: Oops. Error found when updating TimeEntry in the database.');
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
          alert("TODO: Better handling for when a time entry can't be deleted");
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
