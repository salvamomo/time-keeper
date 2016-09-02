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

TimeEntry.prototype.pauseTimer = function() {
  this.updateTrackedTime();
  this.active = false;
}

TimeEntry.prototype.resumeTimer = function() {
  if (this.active == false && this.total_time > 0) {
    // At the moment, this is the same than starting from 0.
    this.startTimer();
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
  // var timeEntryNode = Element.createElement('div');
  // timeEntryNode.className = 'time-entry';

  // timeEntryNode.textContent = 'test';
  // return timeEntryNode;

  var entryWrapper = document.createElement('div');
  entryWrapper.className = 'time-entry';
  entryWrapper.dataset['task:id'] = this.time_entry_id;

  var markup =  '<span class="time-entry-description">' + this.description + '</span>' +
    '<span class="time-entry-edit">Edit</span>';

  entryWrapper.innerHTML = markup;
  this.renderedOutput = entryWrapper;
  this.attachBindings();
  // Need to return the complete entryWrapper node, so that it's appended in the
  // DOM, instead of inserted via innerHTML or insertAdjacentHTML(). If those
  // options are used, all the attached bindings will be lost, because the
  // engine will internally recreate the whole Tree based on the HTML string, so
  // that would require the main app calling all the binding logic for each
  // element manually.
  return this.renderedOutput;

}

TimeEntry.prototype.attachBindings = function() {
  var markup = this.renderedOutput;
  console.log(this.renderedOutput);
  for (var i = 0; i < markup.childNodes.length; i++) {
    if (markup.childNodes.item(i).classList.contains('time-entry-edit')) {
      markup.childNodes.item(i).addEventListener('click', function() {
        alert('test');
      });
    }
  }


}