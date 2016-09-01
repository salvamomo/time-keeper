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
  var markup = 'TODO: Complete render method.';
  return markup;
}