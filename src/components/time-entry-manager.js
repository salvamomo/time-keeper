/**
 *  Time entry manager.
 */

"use strict";

function TimeEntryManager() {

  var active_entry;
  var time_entries = [];
  var last_entry_id = 0;

  // TODO: Finish this, and decide where to place it and how to call it.
  // Although IIFE doesn't look too bad.
  (function getTimeEntriesFromDb() {
    var timeEntryFromDb = null;

    // All this should be probably an exposed "loadTimeEntries" method.
    timeKeeper.db.getAllTimeEntries(function(timeEntries) {
      for (var i = 0; i < timeEntries.length; i++) {
        // Any other better way of loading this as an actual TimeEntry object?
        timeEntryFromDb = TimeEntry.createFromDBObject(timeEntries[i])
        if (timeEntryFromDb) {
          time_entries.push(timeEntryFromDb);
        }
      }
      renderTimeEntries();
    });
  })();

  // This should rely on the internal db.
  function getNextTimeEntryId() {
    last_entry_id++;
    return last_entry_id;
  }

  function addTimeEntry(description) {
    var timeEntry = new TimeEntry(description);

    // Get current active entry, and stop it.
    if (active_entry != null) {
      active_entry.stopTimer();
    }
    timeEntry.startTimer();
    time_entries.push(timeEntry);

    // TODO: Add error handling here. seriously. Add it!
    timeKeeper.db.createTimeEntry(timeEntry);
    active_entry = timeEntry;
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
  })();


  var publicAPI = {
    addTimeEntry: addTimeEntry,
    getNextTimeEntryId: getNextTimeEntryId,
    getTimeEntries: getTimeEntries,
    getActiveEntry: getActiveEntry,
    setActiveEntry: setActiveEntry,
    unsetActiveEntry: unsetActiveEntry,
    deleteTimeEntry: deleteTimeEntry
  };
  return publicAPI;
}
