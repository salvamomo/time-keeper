/**
 * Date formatting utilities and helper functions.
 */

/**
 * Adds a '0' before a time element if it has only 1 digit.
 */
function padTimeComponentString(timeComp) {
  if (timeComp.toString().length == 1) {
    timeComp = '0' + timeComp;
  }
  return timeComp;
}

/**
 * Format a number of seconds as 'X h yy min'.
 */
function formatTimeAsHoursAndMinuted(seconds) {
  var formattedTime = Math.floor(seconds / (60 * 60)) + ' h ' + padTimeComponentString(Math.floor((seconds % (60 * 60)) / 60)) + ' min';
  return formattedTime;
}
