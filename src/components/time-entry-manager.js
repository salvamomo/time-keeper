/**
 *  Time entry manager.
 */

"use strict";

/**
 * Initialises the Time Entry Manager.
 */
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

  /**
   * Given a description text, creates a new time entry and adds it to the db.
   *
   * The new task will be set as the active one.
   *
   * @param description
   *  The description for the new task.
   */
  function addTimeEntry(description) {
    var timeEntry = new TimeEntry(description);

    // Get current active entry, and stop it.
    if (active_entry != null) {
      active_entry.stopTimer();
      // timeKeeper.db.updateTimeEntry(active_entry);
    }

    timeEntry.startTimer();
    time_entries.unshift(timeEntry);

    timeKeeper.db.createTimeEntry(timeEntry, function(time_entry_id) {
      if (Number.isInteger(time_entry_id)) {
        timeEntry.setTimeEntryId(time_entry_id);
        renderTimeEntries();
      }
      else if (time_entry_id === false) {
        alert('Oops. There was an error creating the new time entry. Please try again.');
      }
    });
    timeKeeper.TimeEntryManager.setActiveEntry(timeEntry);
  }

  /**
   * Resumes the given timeEntry, setting it as the active one.
   *
   * @param resumedTimeEntry
   *  The entry for which to resume work.
   */
  function resumeTimeEntry(resumedTimeEntry) {
    resumedTimeEntry.startTimer();
    timeKeeper.TimeEntryManager.setActiveEntry(resumedTimeEntry);
    timeKeeper.db.updateTimeEntry(resumedTimeEntry);
  }

  /**
   * Deletes a given timeEntry permanently from the database.
   *
   * @param timeEntry
   *  The time entry to remove from the system.
   */
  function deleteTimeEntry(timeEntry) {
    for(var index in time_entries) {
      if (time_entries[index].time_entry_id === timeEntry.time_entry_id) {
        time_entries.splice(index, 1);
        break;
      }
    }
  }

  /**
   * Returns the time entries loaded by the TimeEntryManager.
   *
   * @return {Array}
   *  An array of TimeEntry objects.
   */
  function getTimeEntries() {
    return time_entries;
  }

  /**
   * Returns the currently active entry.
   * @return
   *  The active_entry value (null, or an instance of TimeEntry).
   */
  function getActiveEntry() {
    return active_entry;
  }

  /**
   * Calculates and returns the total time for a group of entries (date group).
   *
   * @param groupDateString
   *  The string of the date for which to calculate the total time.
   *
   * @return
   *  The formatted time for the date group.
   */
  function getTotalTimeForEntryGroup(groupDateString) {
    var totalTimeByDate = 0;

    time_entries.forEach(function(timeEntry, index, timeEntries) {
      if (timeEntry.date.toDateString() == groupDateString) {
        totalTimeByDate += timeEntry.total_time;
      }
    });
    return formatTimeAsHoursAndMinutes(totalTimeByDate);
  }

  /**
   * Sets the active_entry.
   *
   * @param timeEntry
   *  The timeEntry to set as the active one in the manager.
   */
  function setActiveEntry(timeEntry) {
    active_entry = timeEntry;
  }

  /**
   * Unsets the current active_entry, leaving it to null.
   */
  function unsetActiveEntry() {
    active_entry = null;
  }

  // NOTE: Event listeners placed here and not in main renderEntries() function,
  // as that's called every time a new entry is added (or deleted), and will
  // cause events to be bound more than once.

  /**
   * Sets up the event listeners to respond to events from individual entries.
   */
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

  // exposed API of the TimeEntryManager module.
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
