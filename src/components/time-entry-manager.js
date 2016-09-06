/**
 *  Time entry manager.
 */

"use strict";

function TimeEntryManager() {

  var active_entry;
  var time_entries = [];
  var last_entry_id = 0;

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
