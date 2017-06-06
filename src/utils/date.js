/**
 * Date formatting utilities and helper functions.
 */

/**
 * Adds a '0' before a time element if it has only 1 digit.
 *
 * @param timeComp
 *  a time component (e.g: number of seconds, or minutes, or hours).
 *
 * @return
 *  The padded time component.
 */
function padTimeComponentString(timeComp) {
  if (timeComp.toString().length == 1) {
    timeComp = '0' + timeComp;
  }
  return timeComp;
}

/**
 * Format a number of seconds as 'X h YY m'.
 *
 * @param seconds
 *  The number of seconds to format.
 *
 * @return
 *  The formatted time (e.g: 5h 13m).
 */
function formatTimeAsHoursAndMinutes(seconds) {
  var formattedTime = Math.floor(seconds / (60 * 60)) + ' h ' + padTimeComponentString(Math.floor((seconds % (60 * 60)) / 60)) + ' min';
  return formattedTime;
}
