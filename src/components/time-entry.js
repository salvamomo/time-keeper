/**
 *  Time entries logic.
 */

"use strict";

// CHECKME: There's certainly a need for some more controller logic for db
// interactions. time_entry_id can't be defined through Object.defineProperty,
// because it'll work for entity creation, but not on update, as the db logic
// can't figure out what entry is being updated (since it can't enum time_entry
// id as being provided.

/**
 * TimeEntry "Class" constructor.
 *
 * @param description
 *  The description of the Time Entry.
 *
 * @constructor
 */
function TimeEntry(description) {
  // Declare time_entry_id, but set no value. It'll be populated when saving the
  // time entry into the database.
  this.time_entry_id;

  this.description = description;
  this.longDescription = null;
  this.project = null;
  this.date = new Date();
  this.active = false;

  // start_time of the current session of work on the task.
  this.start_time = null;

  // Marker to track the last time at which the entry was saved on db. This is
  // used as a lightweight way to control the time not tracked, in case of app
  // crashes, or the app getting closed without stopping a task, so that the
  // time spent in the meantime, can be recovered upon restarting.
  this.last_time_update = 0;

  // Total accumulated time on this task.
  this.total_time = 0;
  this.updateIntervalId = null;
  this.editFormUpdateIntervalId;
  this.renderedNode = null;
  // Make renderedNode non-enumerable, so that the clone algorithm doesn't try
  // to clone it when updating the time entry in the DB. This is because DOMNode
  // properties cannot be cloned.
  Object.defineProperty(this, 'renderedNode', { writable: true, enumerable: false });
  // updateIntervalId could be stored without problems, but it's a session-dependent
  // flag, as it related to events attached to the DOM. Storing it will prevent
  // the proper interval callbacks from being set up when restarting the app.
  Object.defineProperty(this, 'updateIntervalId', { writable: true, enumerable: false });

  // Display state.
  this.displayMode = 'default';

  // Extended attributes (This should be moved into other objects / plugins.
  this.jira_already_synced = false;
  this.jira_task_id = null;
  this.jira_ready_for_sync = false;
}

/**
 * Sets the timeEntryId of the Time Entry.
 *
 * @param timeEntryId
 *  The Time Entry ID (a positive integer).
 */
TimeEntry.prototype.setTimeEntryId = function(timeEntryId) {
  this.time_entry_id = timeEntryId;
};

/**
 * Sets the description of the task.
 *
 * @param description
 *  The description of the Time Entry.
 */
TimeEntry.prototype.setDescription = function(description) {
  this.description = description;
};

/**
 * Sets the Long description of the task.
 *
 * @param description
 *  The description of the Time Entry.
 */
TimeEntry.prototype.setLongDescription = function(longDescription) {
  this.longDescription = longDescription;
};

/**
 * Sets the description of the task.
 *
 * @param description
 *  The description of the Time Entry.
 */
TimeEntry.prototype.setDescription = function(description) {
  this.description = description;
};

/**
 * Sets the project for which the Time Entry applies.
 *
 * @param project
 *  The project the Time Entry applies to.
 */
TimeEntry.prototype.setProject = function(project) {
  this.project = project;
};

/**
 * Sets the date of the Time Entry.
 *
 * @param dateObject
 *  The date object that indicates the date of the Time Entry.
 */
TimeEntry.prototype.setDate = function(dateObject) {
  this.date = dateObject;
};

/**
 * Sets the duration (total time spent) of the time entry.
 *
 * @param duration
 *  The total time spent on the time entry (in seconds).
 */
TimeEntry.prototype.setDuration = function(duration) {
  this.total_time = duration;
};

/**
 * Triggers the logic and flags needed to indicate the Time Entry is running.
 */
TimeEntry.prototype.startTimer = function() {
  var now = Date.now();
  this.start_time = now;
  this.last_time_update = now;
  this.active = true;
};

/**
 * Triggers logic and flags to indicate the Time Entry is not active anymore.
 */
TimeEntry.prototype.stopTimer = function() {
  this.updateTrackedTime();
  clearInterval(this.updateIntervalId);
  this.active = false;

  // Trigger event about entry being stopped.
  var stoppedEvent = new CustomEvent('timeEntryStopped', { 'detail': this });
  document.dispatchEvent(stoppedEvent);

  this.render();
};

/**
 * Resumes a Time Entry in which time has already been spent.
 */
TimeEntry.prototype.resumeTimer = function() {
  if (this.active == false && this.total_time > 0) {
    var resumedEvent = new CustomEvent('timeEntryResumed', { 'detail': this });
    document.dispatchEvent(resumedEvent);
    this.render();
  }
};

/**
 * Updates the time tracked in the Time Entry (total time spent).
 */
TimeEntry.prototype.updateTrackedTime = function() {
  if (this.start_time && this.active == true) {
    var now = Date.now();
    this.total_time += +((now - this.last_time_update) / 1000).toFixed(0);
    this.last_time_update = now;
  }
};

/**
 * Generates a DOM Element with all the elements needed to display a time entry.
 *
 * The javascript behavior bindings are added by this function as well.
 */
TimeEntry.prototype.render = function() {
  // If we come from the 'edit' display, make sure it's not refreshed anymore.
  if (this.displayMode == 'edit' && this.editFormUpdateIntervalId) {
    clearInterval(this.editFormUpdateIntervalId);
  }

  this.displayMode = 'default';

  if (this.renderedNode == null) {
    var entryWrapper = document.createElement('div');
    entryWrapper.dataset['task:id'] = this.time_entry_id;
    this.renderedNode = entryWrapper;
  }
  else {
    entryWrapper = this.renderedNode;
  }
  // Add class for the current time entry.
  entryWrapper.className = this.active ? 'time-entry-wrapper active' : 'time-entry-wrapper';

  var stop_or_resume = (this.active) ? '<span data-ui-action="stop"><img src="img/stop-icon.png" /></span>' : '<span data-ui-action="resume"><img src="img/play-icon.png" /></span>';
  entryWrapper.innerHTML = '' +
    '<div class="time-entry-heading">' +
    '<div class="time-entry-info">' +
    '<span class="time-entry-description">' + this.description + '&nbsp;&nbsp;&nbsp;</span>' +
    '</div>' +
    '<div class="time-entry-totals">' +
    '<span class="time-entry-time-spent">' + this.formatTimeSpent() + '</span><br>' +
    '</div>' +
    '<div class="time-entry-actions">' +
    stop_or_resume +
    '<span data-ui-action="edit"><img src="img/edit-icon.png" /></span>' +
    '</div>' +
    '</div>';

  // CHECKME: Make attachBindings a private method of this function?
  this.detachBindings();
  this.attachBindings(entryWrapper);
  // Need to return the complete entryWrapper node, so that it's appended in the
  // DOM, instead of inserted via innerHTML or insertAdjacentHTML(). If those
  // options are used, all the attached bindings will be lost, because the
  // engine will internally recreate the whole Tree based on the HTML string, so
  // that would require the main app calling all the binding logic for each
  // element manually.
  return entryWrapper;
};

/**
 * Transforms the DOM display of the Time Entry into its 'edit' mode.
 */
TimeEntry.prototype.renderEditable = function() {
  // Don't do anything if 'edit' mode is already active.
  // CHECKME: Maybe solve with HTML classes in the element, or a custom data
  // attr?
  if (this.displayMode == 'edit') {
    return;
  }
  this.displayMode = 'edit';

  var entryWrapper = this.renderedNode;
  var projectString = (typeof this.project === "string") ? this.project : '';


  // Date Widget.
  var editDateWidget = '<span>Day: </span><input type="number" name="date_day" class="date_day" min="1" max="31" value="' + this.date.getDate() + '">';
  editDateWidget += '<span>Month: </span><input type="number" name="date_month" class="date_month" min="1" max="12" value="' + (this.date.getMonth() + 1) + '">';
  editDateWidget += '<span>Year: </span><input type="number" name="date_year" class="date_year" min="2000" value="' + this.date.getFullYear() + '">';

  // Duration widget.
  var totalTimeHours = Math.floor(this.total_time / (60 * 60));
  var totalTimeMinutes = Math.floor((this.total_time - (totalTimeHours * 3600)) / 60);
  var totalTimeSeconds = Math.floor(this.total_time - (totalTimeHours * 3600) - totalTimeMinutes * 60);
  var durationWidget = '<pre>Duration:</pre>';
  durationWidget += '<span>Hours: </span><input type="number" name="duration_hours" class="duration_input duration_hours" min="0" value="' + totalTimeHours + '">';
  durationWidget += '<span>Minutes: </span><input type="number" name="duration_minutes" class="duration_input duration_minutes" min="0" max="59" value="' + totalTimeMinutes + '">';
  durationWidget += '<span>Seconds: </span><input type="number" name="duration_seconds" class="duration_input duration_seconds" min="0" max="59" value="' +totalTimeSeconds + '">';

  var jiraWidget = '<pre>JIRA:</pre>';
  jiraWidget += '<span>Task ID: </span><input type="text" name="jira_task_id" class="jira_input jira_task_id" value="' + this.jira_task_id + '">';
  var readyForSyncValue = this.jira_ready_for_sync ? 'checked' : '';
  jiraWidget += '<input type="checkbox" name="jira_ready_for_sync" class="jira_input jira_ready_for_sync" ' + readyForSyncValue + '>Ready for sync.<br>';
  if (this.jira_already_synced) {
    jiraWidget += '<input type="checkbox" name="jira_ready_for_sync" class="jira_input jira_ready_for_sync" disabled=true checked>Already synced.<br>';
  }

  var editWidget = document.createElement('div');
  editWidget.className = 'time-entry-edit-form';
  editWidget.innerHTML = '<input type="text" class="edit-time-entry-description" value="' + this.description + '"><br>' +
    '<textarea class="edit-time-entry-long-description" rows="5" cols="53" placeholder="Long description">' +  this.longDescription + '"</textarea>' +
    '<input type="text" class="edit-time-entry-project" value="' +  projectString + '" placeholder="Project">' +
    '<div class="edit-time-entry-date"><pre>Date:</pre>' +  editDateWidget + '</div>' +
    '<div class="edit-time-entry-duration">' +  durationWidget + '</div>' +
    '<div class="edit-time-entry-jira">' +  jiraWidget + '</div>' +
    '<div class="edit-time-entry-actions">' +
    '<button type="submit" data-ui-action="save">Save</button>' +
    '<button type="submit" data-ui-action="delete">Delete</button>' +
    '<button type="submit" data-ui-action="cancel">Cancel</button>' +
    '</div>';

  // CHECKME: attachBindings. => detachBindings required? DOM API doesn't seem
  // to have a clear way of getting eventListeners attached an element, so it'd
  // be needed to keep a map of elements and events in order to detach them when
  // required (jQuery would come handy here!). However, this doesn't seem to be
  // needed at all, since all the DOMNode for the 'edit' mode will be completely
  // gone when the form disappears (time entry save / cancel / delete, etc).
  var that = this;

  var currentChildElement = null;
  var widgetActionButtons = editWidget.getElementsByClassName('edit-time-entry-actions').item(0);

  for (var i = 0; i < widgetActionButtons.childNodes.length; i++) {
    if (widgetActionButtons.childNodes.item(i).hasAttribute('data-ui-action')) {
      currentChildElement = widgetActionButtons.childNodes.item(i);
      switch (currentChildElement.getAttribute('data-ui-action')) {
        case 'save':
          currentChildElement.addEventListener('click', function saveTimeEntryChanges() {
            // CHECKME: Should the logic to hydrate the task object from the
            // form be placed in a another function?
            that.setDescription(that.renderedNode.getElementsByClassName('edit-time-entry-description').item(0).value);
            that.setLongDescription(that.renderedNode.getElementsByClassName('edit-time-entry-long-description').item(0).value);
            that.setProject(that.renderedNode.getElementsByClassName('edit-time-entry-project').item(0).value);

            // Grab new date and store it.
            var dateInput = that.renderedNode.getElementsByClassName('edit-time-entry-date').item(0);
            var newDateDay = dateInput.getElementsByClassName('date_day').item(0).value;
            var newDateMonth = dateInput.getElementsByClassName('date_month').item(0).value;
            var newDateYear = dateInput.getElementsByClassName('date_year').item(0).value;
            var now = new Date();
            var newDate = new Date(newDateYear, newDateMonth - 1, newDateDay, now.getHours(), now.getMinutes());
            that.setDate(newDate);

            // Grab new duration and store it.
            var durationInput = that.renderedNode.getElementsByClassName('edit-time-entry-duration').item(0);
            var newDurationHours = durationInput.getElementsByClassName('duration_hours').item(0).value;
            var newDurationMinutes = durationInput.getElementsByClassName('duration_minutes').item(0).value;
            var newDurationSeconds = durationInput.getElementsByClassName('duration_seconds').item(0).value;
            var newDuration = Number((newDurationHours * 3600)) + Number((newDurationMinutes * 60)) + Number(newDurationSeconds);
            that.setDuration(newDuration);

            // Grab jira details and store them.
            var jiraInput = that.renderedNode.getElementsByClassName('edit-time-entry-jira').item(0);
            that.jira_task_id = jiraInput.getElementsByClassName('jira_task_id').item(0).value;
            that.jira_ready_for_sync = jiraInput.getElementsByClassName('jira_ready_for_sync').item(0).checked;
            that.logTimeInJira();

            clearInterval(that.editFormUpdateIntervalId);
            that.render();
            var updateEvent = new CustomEvent('timeEntryUpdated', { 'detail': that });
            document.dispatchEvent(updateEvent);
          });
          break;
        case 'delete':
          currentChildElement.addEventListener('click', function deleteTimeEntry() {
            clearInterval(that.editFormUpdateIntervalId);
            var deleteEvent = new CustomEvent('timeEntryDeleted', { 'detail': that });
            document.dispatchEvent(deleteEvent);
          });
          break;
        case 'cancel':
          currentChildElement.addEventListener('click', function cancelTimeEntryEditForm() {
            clearInterval(that.editFormUpdateIntervalId);
            // Simply render task in the default mode.
            that.render();
          });
          break;
      }
    }
  }

  // Create an event to stop the refreshing of the duration fields if the user
  // tries to edit any of them. Otherwise, the real duration will overwrite the
  // entered value constantly, making the edit action unintuitive.
  var durationInputFields = editWidget.getElementsByClassName('duration_input');
  for (var i = 0; i < durationInputFields.length; i++) {
    // Use 'input' event instead of 'change', since 'change' doesn't pick up
    // values being entered with keyboard, just through actual clicks on the
    // top/down arrows.
    durationInputFields.item(i).addEventListener('input', function stopDurationRefresh(e) {
      clearInterval(that.editFormUpdateIntervalId);
      // One-time event - https://www.sitepoint.com/create-one-time-events-javascript/.
      // http://stackoverflow.com/questions/19214977/alternative-to-arguments-callee
      e.target.removeEventListener(e.type, stopDurationRefresh);
    });
  }

  if (this.active) {
    this.editFormUpdateIntervalId = setInterval(function() {
      // Redraw tracked time in edit form.
      var totalTimeHours = Math.floor(that.total_time / (60 * 60));
      var totalTimeMinutes = Math.floor((that.total_time - (totalTimeHours * 3600)) / 60);
      var totalTimeSeconds = Math.floor(that.total_time - (totalTimeHours * 3600) - totalTimeMinutes * 60);

      that.renderedNode.getElementsByClassName('duration_hours').item(0).value = totalTimeHours;
      that.renderedNode.getElementsByClassName('duration_minutes').item(0).value = totalTimeMinutes;
      that.renderedNode.getElementsByClassName('duration_seconds').item(0).value = totalTimeSeconds;
    }, 1000);
  }

  entryWrapper.appendChild(editWidget);
};

/**
 * Attach javascript bindings to the DOM element that represents the Time Entry.
 *
 * @param entryWrapper
 *  The DOM element that represents the Time Entry.
 *
 * @see TimeEntry.prototype.render()
 */
TimeEntry.prototype.attachBindings = function(entryWrapper) {
  var that = this;

  var currentChildElement = null;
  var actionNodes = entryWrapper.getElementsByClassName('time-entry-actions').item(0);

  for (var i = 0; i < actionNodes.childNodes.length; i++) {
    if (actionNodes.childNodes.item(i).hasAttribute('data-ui-action')) {
      currentChildElement = actionNodes.childNodes.item(i);
      switch (currentChildElement.getAttribute('data-ui-action')) {
        case 'stop':
          currentChildElement.addEventListener('click', function() {
            that.stopTimer();
          });
          break;
        case 'resume':
          currentChildElement.addEventListener('click', function() {
            that.resumeTimer();
          });
          break;
        case 'edit':
          currentChildElement.addEventListener('click', function() {
            that.renderEditable();
          });
          break;
      }
    }
  }

  if (this.active) {
    // FIXME: If the 'add' button is clicked even without values, it'll trigger
    // a re-rendering of all the time entries, which will cause the active entry
    // to reAttach the updating interval one extra time every time the 'add'
    // button is pressed.
    this.updateIntervalId = setInterval(function() {
      // CHECKME: Have a different event type just for the tracked time update?
      that.updateTrackedTime();
      that.redrawTimeSpent();
      // Dispatch update event so that time entry manager picks it up and saves
      // time on the database.
      var updateEvent = new CustomEvent('timeEntryUpdated', { 'detail': that });
      document.dispatchEvent(updateEvent);
    }, 1000);
  }
};

/**
 * Detach time entry bindings.
 *
 * CHECKME: Maybe a better name, since this doesn't actually tackle even listeners?
 * This is probably best placed right before setting the interval, to simply
 * clear the existing one, or avoid creating a new one!
 */
TimeEntry.prototype.detachBindings = function() {
  // Only need to clear the update timer interval.
  clearInterval(this.updateIntervalId);
};

/**
 * Updates the Time Entry display to redraw the total time spent.
 */
TimeEntry.prototype.redrawTimeSpent = function() {
  // CHECKME: This can be tackled by simply calling this.render(). However,
  // updating only the actual time seems sensible.
  this.renderedNode.getElementsByClassName('time-entry-time-spent').item(0).textContent = this.formatTimeSpent();
};

/**
 * Format the total time tracked on this time entry, in a hh:mm:ss format.
 *
 * @returns {string}
 */
TimeEntry.prototype.formatTimeSpent = function() {
  var totalRemainingTime = this.total_time;

  // Divide and modulus, divide and modulus. \_o_/.
  var totalTimeHours =  padTimeComponentString(Math.floor(totalRemainingTime / (60 * 60)));
  totalRemainingTime = totalRemainingTime % (60 * 60);
  var totalTimeMinutes = padTimeComponentString(Math.floor(totalRemainingTime / 60));
  totalRemainingTime = padTimeComponentString(totalRemainingTime % 60);
  return totalTimeHours + ':' + totalTimeMinutes + ':' + totalRemainingTime;
};

/**
 * Creates a TimeEntry object with data returned from the Database.
 *
 * This emulates a public static "method".
 *
 * @param dbObject
 *  The database stored data
 * @returns {TimeEntry}
 *  The relevant TimeEntry object.
 */
TimeEntry.createFromDBObject = function(dbObject) {
  // Create TimeEntry stub.
  var newTimeEntry = new TimeEntry();
  var timeEntryPropNames = Object.getOwnPropertyNames(newTimeEntry);

  // Set ID first.
  newTimeEntry.setTimeEntryId(dbObject.time_entry_id);

  // Hydrate stub with all other properties as retrieved from Database.
  timeEntryPropNames.forEach(function(propName, index, propertyNames) {
    if (dbObject.hasOwnProperty(propName)) {
      newTimeEntry[propName] = dbObject[propName];
    }
  });
  return newTimeEntry;
};

/**
 * Logs the time spent in the task in the configured JIRA backend.
 */
TimeEntry.prototype.logTimeInJira = function () {
  if (this.jira_ready_for_sync === true && this.jira_already_synced === false) {
    var secondsSpent = this.total_time;

    // Format start dateTime of the worklog.
    let day = padTimeComponentString(this.date.getDate());
    let month = padTimeComponentString(this.date.getMonth() + 1);
    let year = this.date.getFullYear();
    let hours = padTimeComponentString(this.date.getHours());
    let minutes = padTimeComponentString(this.date.getMinutes());
    let seconds = padTimeComponentString(this.date.getSeconds());
    var startTime = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + '.000+0000.';

    var requestCallback = function(result) {
      if (result) {
        this.jira_already_synced = true;
        return;
      }
      alert('Oops. There was an error logging the time in JIRA. Please try again.');
    };

    // Log the time.
    timeKeeper.jira.addWorklog(this.jira_task_id, this.description, startTime, secondsSpent, requestCallback.bind(this));
  }
};
