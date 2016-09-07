/**
 *  Simple implementation of IndexedDB API to read / write time entries.
 */

// TODO: This should be a module, and not a class.
// IDEA: Could do with allowing methods to pass a class name, so that all "read"
// methods return an object of the relevant class when loading items, a la ORM.
function Database(name, callback) {

  var db_name = name;
  var request = null;
  var db = null;
  var that = this;

  // Yay for ES6 constants!
  const VERSION = 1;

  function dbErrorHandler(event) {
    // TODO: Add console.log entry with some actual useful info.
    // Also, return false?.
    alert("Database error: " + event.target.errorCode);
  }

  // CHECKME: Probably best in an init() method?
  var request = window.indexedDB.open(db_name, VERSION);

  request.onerror = function(event) {
    alert("Database could not be created or opened.");
  };

  request.onsuccess = function(event) {
    that.db = event.target.result;
    callback();
  }

  request.onupgradeneeded = function(event) {
    that.db = event.target.result;

    // CHECKME: How would I need to check current version to find out what
    // needs adding on each db version?
    var objectStore = db.createObjectStore("time_entry", { keyPath: 'time_entry_id' , autoIncrement: true });
    objectStore.createIndex('date', 'date');

    objectStore.transaction.oncomplete = function(event) {
      console.log("'time_entry' object store created successfully.");
    }
  }

  // TODO: Make methods actually async...
  //   // readTimeEntry: 'TODO',
  //   // updateTimeEntry: 'TODO',
  //   // deleteTimeEntry: 'TODO',
}

Database.prototype.createTimeEntry = function(timeEntry) {
  var timeEntryStore = this.db.transaction("time_entry", "readwrite").objectStore("time_entry");
  timeEntryStore.add(timeEntry);
}

// Returns all the existing time entries in the database.
Database.prototype.getAllTimeEntries = function(callback) {
  var timeEntries = [];
  var timeEntryStore = this.db.transaction("time_entry", "readonly").objectStore("time_entry");
  timeEntryStore.openCursor().onsuccess = function(event) {
    var cursor = event.target.result;

    // CHECKME: Need else clause?
    if (cursor) {
      timeEntries.push(cursor.value);
      cursor.continue();
    }
    else {
      callback(timeEntries);
    }
  }
}