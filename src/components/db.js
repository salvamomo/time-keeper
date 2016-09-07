/**
 *  Simple implementation of IndexedDB API to read / write time entries.
 */

function Database(name) {

  var name = name;
  var request = null;
  var db = null;

  // Yay for ES6 constants!
  const VERSION = 1;

  function dbErrorHandler(event) {
    db = event.target.result;
    // TODO: Add console.log entry with some actual useful info.
    // Also, return false?.
    alert("Database error: " + event.target.errorCode);
  }

  // CHECKME: Wonder if the init() logic can be avoided, and simply triggered
  // automatically when invoking this module.
  function init () {
    request = window.indexedDB.open(name, VERSION);

    request.onerror = function(event) {
      alert("Database could not be created or opened.");
    };

    request.onsuccess = function(event) {
      db = event.target.result;
      db.onerror = dbErrorHandler;
    }

    request.onupgradeneeded = function(event) {
      db = event.target.result;

      // CHECKME: How would I need to check current version to find out what
      // needs adding on each db version?
      var objectStore = db.createObjectStore("time_entry", { keyPath: 'time_entry_id' , autoIncrement: true });
      objectStore.createIndex('date', 'date');

      objectStore.transaction.oncomplete = function(event) {
        console.log("'time_entry' object store created successfully.");
      }
    }

  }

  var publicAPI = {
    init: init,
    createTimeEntry: 'TODO',
    readTimeEntry: 'TODO',
    updateTimeEntry: 'TODO',
    deleteTimeEntry: 'TODO'
  };
  return publicAPI;
}
