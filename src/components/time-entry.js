/**
 *  Time entries logic.
 */

"use strict";

// module.exports = {
//
//   newTimeEntry: function() {
//     return new TimeEntry();
//   }
//
// };

// TODO: Need a lightweight way of storing the currently-running task info, in
// case there's a crash of the application, it can be resumed where it stopped,
// without losing the time passed since the crash (or the close event).
// Note: with current setup it might not be needed at all.

// CHECKME: There's certainly a need for some more controller logic for db
// interactions. time_entry_id can't be defined through Object.defineProperty,
// because it'll work for entity creation, but not on update, as the db logic
// can't figure out what entry is being updated (since it can't enum time_entry
// id as being provided.
function TimeEntry(description) {
  // Declare time_entry_id, but set no value. It'll be populated when saving the
  // time entry into the database.
  this.time_entry_id;

  this.description = description;
  this.date = new Date();
  this.active = false;

  // start_time of the current session of work on the task.
  this.start_time = null;

  // Time tracked for current session on a task.
  this.session_time = 0;
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
  // TODO: Two cases of properties that shouldn't be stored already. This
  // calls to put them in a special property within the object, for better
  // tracking of them.
  Object.defineProperty(this, 'updateIntervalId', { writable: true, enumerable: false });

  // Display state.
  this.displayMode = 'default';
}

TimeEntry.prototype.setTimeEntryId = function(timeEntryId) {
  this.time_entry_id = timeEntryId;
}

TimeEntry.prototype.setDescription = function(description) {
  this.description = description;
}

TimeEntry.prototype.setDate = function(dateObject) {
  this.date = dateObject;
}

TimeEntry.prototype.setDuration = function(duration) {
  this.total_time = duration;
}

TimeEntry.prototype.startTimer = function() {
  var now = Date.now();
  this.start_time = now;
  this.last_time_update = now;
  this.active = true;
}

TimeEntry.prototype.stopTimer = function() {
  // TODO: Implement event listener and so that the redraw logic is simply
  // triggered automatically?.
  this.updateTrackedTime();
  clearInterval(this.updateIntervalId);
  this.active = false;

  // Trigger event about entry being stopped.
  var stoppedEvent = new CustomEvent('timeEntryStopped', { 'detail': this });
  console.log('Before stop');
  document.dispatchEvent(stoppedEvent);
  console.log('After stop');

  this.render();
}

TimeEntry.prototype.resumeTimer = function() {
  if (this.active == false && this.total_time > 0) {
    var resumedEvent = new CustomEvent('timeEntryResumed', { 'detail': this });
    document.dispatchEvent(resumedEvent);
    this.render();
  }
}

TimeEntry.prototype.updateTrackedTime = function() {
  if (this.start_time && this.active == true) {
    var now = Date.now();
    this.session_time = ((now - this.start_time) / 1000).toFixed(0);
    this.total_time += +((now - this.last_time_update) / 1000).toFixed(0);
    this.last_time_update = now;
  }
}

TimeEntry.prototype.render = function() {
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
}

TimeEntry.prototype.renderEditable = function() {
  // Don't do anything if 'edit' mode is already active.
  // CHECKME: Maybe solve with HTML classes in the element, or a custom data
  // attr?
  if (this.displayMode == 'edit') {
    return;
  }
  this.displayMode = 'edit';

  var entryWrapper = this.renderedNode;


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

  var editWidget = document.createElement('div');
  editWidget.className = 'time-entry-edit-form';
  editWidget.innerHTML = '<input type="text" class="edit-time-entry-description" value="' + this.description + '"><br>' +
    '<div class="edit-time-entry-date"><pre>Date:</pre>' +  editDateWidget + '</div>' +
    '<div class="edit-time-entry-duration">' +  durationWidget + '</div>' +
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

            // Grab new date and store it.
            var dateInput = that.renderedNode.getElementsByClassName('edit-time-entry-date').item(0);
            var newDateDay = dateInput.getElementsByClassName('date_day').item(0).value;
            var newDateMonth = dateInput.getElementsByClassName('date_month').item(0).value;
            var newDateYear = dateInput.getElementsByClassName('date_year').item(0).value;
            var newDate = new Date(newDateYear, newDateMonth - 1, newDateDay);
            that.setDate(newDate);

            // Grab new duration and store it.
            var durationInput = that.renderedNode.getElementsByClassName('edit-time-entry-duration').item(0);
            var newDurationHours = durationInput.getElementsByClassName('duration_hours').item(0).value;
            var newDurationMinutes = durationInput.getElementsByClassName('duration_minutes').item(0).value;
            var newDurationSeconds = durationInput.getElementsByClassName('duration_seconds').item(0).value;
            var newDuration = Number((newDurationHours * 3600)) + Number((newDurationMinutes * 60)) + Number(newDurationSeconds);
            that.setDuration(newDuration);

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

  // Create an event to stop the refreshing of the duration field if the user
  // tries to edit it. Otherwise, the real duration will overwrite the entered
  // value constantly, making the edit action impossible!
  var durationInputFields = editWidget.getElementsByClassName('duration_input');
  for (var i = 0; i < durationInputFields.length; i++) {
    durationInputFields.item(i).addEventListener('change', function stopDurationRefresh(e) {
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
}

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
      // TODO: Implement event listener and trigger event so that when task is
      // updated, the rest of the app knows about it? Not sure it's worth it though.
      // If not event listener, maybe getters / setters from which to call rendering
      // logic when needed?
      that.updateTrackedTime();
      that.redraw();
    }, 1000);
  }
}


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
}

TimeEntry.prototype.redraw = function() {
  // CHECKME: This can be tackled by simply calling this.render(). However,
  // updating only the actual time seems sensible.
  this.renderedNode.getElementsByClassName('time-entry-time-spent').item(0).textContent = this.formatTimeSpent();
}

/**
 * Format the total time tracked on this time entry, in a hh:mm:ss format.
 *
 * @returns {string}
 */
TimeEntry.prototype.formatTimeSpent = function() {
  var totalRemainingTime = this.total_time;

  // Add a '0' before a time element if it has only 1 digit.
  function padTimeComponentString(timeComp) {
    if (timeComp.toString().length == 1) {
      timeComp = '0' + timeComp;
    }
    return timeComp;
  }

  // Divide and modulus, divide and modulus. \_o_/.
  var totalTimeHours =  padTimeComponentString(Math.floor(totalRemainingTime / (60 * 60)));
  totalRemainingTime = totalRemainingTime % (60 * 60);
  var totalTimeMinutes = padTimeComponentString(Math.floor(totalRemainingTime / 60));
  totalRemainingTime = padTimeComponentString(totalRemainingTime % 60);
  return totalTimeHours + ':' + totalTimeMinutes + ':' + totalRemainingTime;
}

// This emulates a public static method.
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
}