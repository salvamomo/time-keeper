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

function TimeEntry(description) {
  this.time_entry_id = timeKeeper.getNextTimeEntryId();
  this.description = description;
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
  this.render();
}

TimeEntry.prototype.resumeTimer = function() {
  if (this.active == false && this.total_time > 0) {
    // At the moment, this is the same than starting from 0.
    this.startTimer();
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
  if (this.renderedNode === null) {
    var entryWrapper = document.createElement('div');
    entryWrapper.className = 'time-entry';
    entryWrapper.dataset['task:id'] = this.time_entry_id;
    this.renderedNode = entryWrapper;
  }
  else {
    entryWrapper = this.renderedNode;
  }

  var stop_or_resume = (this.active) ? '<span data-ui-action="stop">Stop</span>' : '<span data-ui-action="resume">Resume</span>';
  entryWrapper.innerHTML = '<span class="time-entry-description">' + this.description + '&nbsp;&nbsp;&nbsp;</span>' +
    '<span class="time-entry-time-spent">' + this.total_time + '</span><br>' +
    stop_or_resume +
    '<span data-ui-action="edit">Edit</span>' +
    '<span data-ui-action="delete">Delete</span>';

  this.attachBindings(entryWrapper);
  // Need to return the complete entryWrapper node, so that it's appended in the
  // DOM, instead of inserted via innerHTML or insertAdjacentHTML(). If those
  // options are used, all the attached bindings will be lost, because the
  // engine will internally recreate the whole Tree based on the HTML string, so
  // that would require the main app calling all the binding logic for each
  // element manually.
  // this.renderedNode = entryWrapper;
  return entryWrapper;
}

TimeEntry.prototype.attachBindings = function(entryWrapper) {
  var that = this;

  var currentChildElement = null;
  for (var i = 0; i < entryWrapper.childNodes.length; i++) {
    if (entryWrapper.childNodes.item(i).hasAttribute('data-ui-action')) {
      currentChildElement = entryWrapper.childNodes.item(i);
      switch (currentChildElement.getAttribute('data-ui-action')) {
        case 'stop':
          currentChildElement.addEventListener('click', function() {
            that.stopTimer();
          });
          break;
        case 'resume':
          currentChildElement.addEventListener('click', function() {
            // TODO: need to stop current running task first.
            that.resumeTimer();
          });
          break;
        case 'edit':
          currentChildElement.addEventListener('click', function() {
            alert('edit');
          });
          break;
        case 'delete':
          currentChildElement.addEventListener('click', function() {
            alert('delete');
          });
          break;
      }
    }
  }

  if (this.active) {
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

TimeEntry.prototype.redraw = function() {
  console.log('being updated');
  // CHECKME: This can be tackled by simply calling this.render(). However,
  // updating only the actual time seems sensible.
  this.renderedNode.getElementsByClassName('time-entry-time-spent').item(0).textContent = this.total_time;
}

