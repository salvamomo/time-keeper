/**
 * Time logging integration with Jira.
 */

var dateTimeUtils = require('../../utils/date');

/**
 * Jira module.
 */
function Jira(jira_url, username, password) {

  var b64AuthString = null;
  generateAuthenticationHeader(username, password);

  function generateAuthenticationHeader(username, password) {
    // Consider making this more robust: https://developer.mozilla.org/en/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem.
    var authString = username + ':' + password;
    b64AuthString = btoa(authString);
  }

  function addWorklog(issueId, comment, startTime, timeSpentSeconds, callback) {
    // Prepare request data.
    var worklog = {
      "comment": comment,
      "started": startTime,
      "timeSpentSeconds": timeSpentSeconds
    };

    var xhr = new XMLHttpRequest();
    xhr.open('POST', jira_url + '/rest/api/2/issue/' + issueId + '/worklog');
    xhr.setRequestHeader('Authorization', 'Basic ' + b64AuthString);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
      let data;
      if (xhr.readyState !== XMLHttpRequest.DONE) {
        return;
      }
      console.log('REST request to Jira finished.');

      if (xhr.status === 201) {
        // data = xhr.responseText;
        // TODO: Grab and return the worklog ID from the JSON response.
        // It's the "id" property of the json response.
        callback(true);
        return true;
      }
      else {
        data = xhr.responseText;
        console.log("REST request to Jira failed.");
        console.log(data);
        callback(false);
      }
      // end of state change: it can be after some time (async)
    };

    xhr.send(JSON.stringify(worklog));
  }

  return {
    addWorklog: addWorklog
  }
}

/**
 * Time logging integration with arbitrary custom endpoints.
 */

var dateTimeUtils = require('../../utils/date');

/**
 * Custom Endpoint module.
 */
function CustomEndpoint(ce_url, username, password) {

  var b64AuthString = null;
  generateAuthenticationHeader(username, password);

  function generateAuthenticationHeader(username, password) {
    // Make this more robust: https://developer.mozilla.org/en/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem.
    var authString = username + ':' + password;
    b64AuthString = btoa(authString);
  }

  function logTimeEntry(issueId, title, startTime, timeSpentSeconds, project, callback) {
    // Prepare request data.

    // title, description, date, totalTime, created, project, task.
    var worklog = {
      "title": title,
      "description": title,
      "date": startTime,
      "totalTime": timeSpentSeconds,
      "created": startTime,
      "project": project,
      "task": issueId
    };

    var xhr = new XMLHttpRequest();
    xhr.open('POST', ce_url);
    // xhr.setRequestHeader('Authorization', 'Basic ' + b64AuthString);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
      let data;
      if (xhr.readyState !== XMLHttpRequest.DONE) {
        return;
      }
      console.log('REST request to Custom Endpoint finished.');

      if (xhr.status === 201) {
        data = JSON.parse(xhr.responseText);

        console.log(xhr.responseText);
        console.log("Created: " + data.data.title);
        // TODO: Grab and return the worklog ID from the JSON response.
        // It's the "id" property of the json response.
        callback(true);
        return true;
      }
      else {
        data = xhr.responseText;
        console.log("REST request to endpoint failed.");
        console.log(data);
        callback(false);
      }
      // end of state change: it can be after some time (async)
    };

    xhr.send(JSON.stringify(worklog));
  }

  return {
    logTimeEntry: logTimeEntry
  }
}

function CustomEndpointPlugin(App) {
  this.App = App;

  function hookInit() {
    let jira_url = window.localStorage.getItem('jira_url');
    let jira_u = window.localStorage.getItem('jira_username');
    let jira_p = window.localStorage.getItem('jira_password');
    App.jira = Jira(jira_url, jira_u, jira_p);
  }

  function getInfo() {
    return {name: 'jira', version: '0.1'};
  }

  function logTimeInJira(timeEntry) {
    let notSynced = (timeEntry.jira_already_synced === false) || (timeEntry.jira_already_synced == null);

    if (timeEntry.jira_ready_for_sync === true && notSynced) {
      var secondsSpent = timeEntry.total_time;

      // Format start dateTime of the worklog.
      let day = dateTimeUtils.padTimeComponentString(timeEntry.date.getDate());
      let month = dateTimeUtils.padTimeComponentString(timeEntry.date.getMonth() + 1);
      let year = timeEntry.date.getFullYear();
      let hours = dateTimeUtils.padTimeComponentString(timeEntry.date.getHours());
      let minutes = dateTimeUtils.padTimeComponentString(timeEntry.date.getMinutes());
      let seconds = dateTimeUtils.padTimeComponentString(timeEntry.date.getSeconds());
      var startTime = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + '.000+0000.';

      var requestCallback = function(result) {
        if (result) {
          timeEntry.jira_already_synced = true;
          // This should probably require the TimeEntryManager directly.
          timeEntry.save();
          return;
        }
        alert('Oops. There was an error logging the time in JIRA. Please try again.');
      };

      // Log the time.
      App.jira.addWorklog(
        timeEntry.jira_task_id,
        timeEntry.description,
        startTime,
        secondsSpent,
        requestCallback.bind(timeEntry)
      );
    }
  }

  function hookSettingsMenuLink() {
    var jiraLink = {
      type: 'normal',
      label: 'Jira Integration',
      click: function () {
        App.windows.jiraWindow = nw.Window.open('src/plugins/jira/settings.html', {
          id: "jira",
          height: 280,
          width: 300,
          focus: true,
          fullscreen: false,
          resizable: false
        }, function(new_window) {
          new_window.on('loaded', function() {
            var document = new_window.window.document;

            document.addEventListener('jiraSettingsSaved', function(event) {
              let jira_url = window.localStorage.getItem('jira_url');
              let jira_u = window.localStorage.getItem('jira_username');
              let jira_p = window.localStorage.getItem('jira_password');
              App.jira = new Jira(jira_url, jira_u, jira_p);
            });
          });
        });
      }
    };

    return jiraLink;
  }

  function invokeTimeEntryInit(timeEntry) {
    timeEntry.jira_task_id = null;
    timeEntry.jira_ready_for_sync = false;
    timeEntry.jira_already_synced = false;
  }

  function invokeTimeEntrySaved(timeEntry) {
    // Grab jira details and store them.
    var jiraInput = timeEntry.renderedNode.getElementsByClassName('edit-time-entry-jira').item(0);
    timeEntry.jira_task_id = jiraInput.getElementsByClassName('jira_task_id').item(0).value;
    timeEntry.jira_ready_for_sync = jiraInput.getElementsByClassName('jira_ready_for_sync').item(0).checked;
    logTimeInJira(timeEntry);
  }

  function invokeRenderTimeEntryEditable(timeEntry) {
    var jiraWidget = '<pre>JIRA:</pre>';
    jiraWidget += '<span>Task ID: </span><input type="text" name="jira_task_id" class="jira_input jira_task_id" value="' + timeEntry.jira_task_id + '">';
    var readyForSyncValue = timeEntry.jira_ready_for_sync ? 'checked' : '';
    jiraWidget += '<input type="checkbox" name="jira_ready_for_sync" class="jira_input jira_ready_for_sync" ' + readyForSyncValue + '>Ready for sync.<br>';
    if (timeEntry.jira_already_synced) {
      jiraWidget += '<input type="checkbox" name="jira_ready_for_sync" class="jira_input jira_ready_for_sync" disabled=true checked>Already synced.<br>';
    }
    return '<div class="edit-time-entry-jira">' + jiraWidget + '</div>';
  }

  return {
    info: getInfo(),
    hookInit: hookInit,
    hookSettingsMenuLink: hookSettingsMenuLink,
    invokeTimeEntryInit: invokeTimeEntryInit,
    invokeTimeEntrySaved: invokeTimeEntrySaved,
    invokeRenderTimeEntryEditable: invokeRenderTimeEntryEditable,
  }
}

module.exports = {
  load: CustomEndpointPlugin,
};
