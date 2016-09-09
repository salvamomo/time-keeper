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
  this.renderedNode = null;
  // Make renderedNode non-enumerable, so that the clone algorithm doesn't try
  // to clone it when updating the time entry in the DB. This is because DOMNode
  // properties cannot be cloned.
  Object.defineProperty(this, 'renderedNode', { writable: true, enumerable: false });

  // Display state.
  this.displayMode = 'default';
}

TimeEntry.prototype.setTimeEntryId = function(timeEntryId) {
  this.time_entry_id = timeEntryId;
}

TimeEntry.prototype.setDescription = function(description) {
  this.description = description;
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
    // At the moment, this is the same than starting from 0.
    this.startTimer();

    // CHECKME: This only works if that.resumetimer() is called at the
    // end, instead of at the beginning. Maybe something I'm missing
    // with async behaviour?.
    var resumedEvent = new CustomEvent('timeEntryResumed', { 'detail': this });
    console.log('Before start');
    document.dispatchEvent(resumedEvent);
    console.log('After start');

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
    entryWrapper.className = 'time-entry-wrapper';
    entryWrapper.dataset['task:id'] = this.time_entry_id;
    this.renderedNode = entryWrapper;
  }
  else {
    entryWrapper = this.renderedNode;
  }

  var stop_or_resume = (this.active) ? '<span data-ui-action="stop">Stop</span>' : '<span data-ui-action="resume">Resume</span>';
  entryWrapper.innerHTML = '' +
    '<div class="time-entry-info">' +
    '<span class="time-entry-description">' + this.description + '&nbsp;&nbsp;&nbsp;</span>' +
    '</div>' +
    '<div class="time-entry-actions">' +
    stop_or_resume +
    '<span data-ui-action="edit">Edit</span>' +
    '<span data-ui-action="delete">Delete</span>' +
    '</div>' +
    '<div class="time-entry-totals">' +
    '<span class="time-entry-time-spent">' + this.formatTimeSpent() + '</span><br>' +
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

  var editWidget = document.createElement('div');
  editWidget.className = 'time-entry-edit-form';
  editWidget.innerHTML = '<input type="text" class="edit-time-entry-description" value="' + this.description + '"><br>' +
    '<span class="edit-time-entry-date">' +  this.date + '</span><br>' +
    '<button type="submit" data-ui-action="save">Save</button>' +
    '<button type="submit" data-ui-action="delete">Delete</button>' +
    '<button type="submit" data-ui-action="cancel">Cancel</button>';

  // CHECKME: attachBindings. => detachBindings required? DOM API doesn't seem
  // to have a clear way of getting eventListeners attached an element, so it'd
  // be needed to keep a map of elements and events in order to detach them when
  // required (jQuery would come handy here!). However, this doesn't seem to be
  // needed at all, since all the DOMNode for the 'edit' mode will be completely
  // gone when the form disappears (time entry save / cancel / delete, etc).
  var that = this;

  var currentChildElement = null;
  for (var i = 0; i < editWidget.childNodes.length; i++) {
    if (editWidget.childNodes.item(i).hasAttribute('data-ui-action')) {
      currentChildElement = editWidget.childNodes.item(i);
      switch (editWidget.childNodes.item(i).getAttribute('data-ui-action')) {
        case 'save':
          currentChildElement.addEventListener('click', function saveTimeEntryChanges() {
            // CHECKME: Should the logic to hydrate the task object from the
            // form be placed in a another function?
            that.setDescription(that.renderedNode.getElementsByClassName('edit-time-entry-description').item(0).value);
            that.render();
            var updateEvent = new CustomEvent('timeEntryUpdated', { 'detail': that });
            document.dispatchEvent(updateEvent);
          });
          break;
        case 'delete':
          currentChildElement.addEventListener('click', function deleteTimeEntry() {
            var deleteEvent = new CustomEvent('timeEntryDeleted', { 'detail': that });
            document.dispatchEvent(deleteEvent);
          });
          break;
        case 'cancel':
          currentChildElement.addEventListener('click', function deleteTimeEntry() {
            // Simply render task in the default mode.
            that.render();
          });
          break;
      }
    }
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
        case 'delete':
          currentChildElement.addEventListener('click', function() {
            var deleteEvent = new CustomEvent('timeEntryDeleted', { 'detail': that });
            document.dispatchEvent(deleteEvent);
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