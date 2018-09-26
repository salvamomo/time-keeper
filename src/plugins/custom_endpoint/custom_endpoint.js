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
    let ce_url = window.localStorage.getItem('custom_endpoint_url');
    let ce_u = window.localStorage.getItem('custom_endpoint_username');
    let ce_p = window.localStorage.getItem('custom_endpoint_password');
    App.customEndpoint = CustomEndpoint(ce_url, ce_u, ce_p);
  }

  function getInfo() {
    return {name: 'custom_endpoint', version: '0.1'};
  }

  function logTimeInEndpoint(timeEntry) {
    let notSynced = (timeEntry.ce_already_synced === false) || (timeEntry.ce_already_synced == null);

    if (timeEntry.ce_ready_for_sync === true && notSynced) {
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
          timeEntry.ce_already_synced = true;
          // This should probably require the TimeEntryManager directly.
          timeEntry.save();
          return;
        }
        alert('Oops. There was an error logging the time in the Custom Endpoint. Please try again.');
      };

      // Log the time.
      App.customEndpoint.logTimeEntry(
        timeEntry.ce_task_id,
        timeEntry.description,
        startTime,
        secondsSpent,
        timeEntry.project,
        requestCallback.bind(timeEntry)
      );
    }
  }

  function hookSettingsMenuLink() {
    var customEndpointLink = {
      type: 'normal',
      label: 'Custom Endpoint',
      click: function () {
        App.windows.customEndpointWindow = nw.Window.open('src/plugins/custom_endpoint/settings.html', {
          id: "custom_endpoint",
          height: 280,
          width: 300,
          focus: true,
          fullscreen: false,
          resizable: false
        }, function(new_window) {
          new_window.on('loaded', function() {
            var document = new_window.window.document;

            document.addEventListener('customEndpointSettingsSaved', function(event) {
              let ce_url = window.localStorage.getItem('custom_endpoint_url');
              let ce_u = window.localStorage.getItem('custom_endpoint_username');
              let ce_p = window.localStorage.getItem('custom_endpoint_password');
              App.customEndpoint = new CustomEndpoint(ce_url, ce_u, ce_p);
            });
          });
        });
      }
    };

    return customEndpointLink;
  }

  function invokeTimeEntryInit(timeEntry) {
    timeEntry.ce_task_id = null;
    timeEntry.ce_ready_for_sync = false;
    timeEntry.ce_already_synced = false;
  }

  function invokeTimeEntrySaved(timeEntry) {
    var customEndpointInput = timeEntry.renderedNode.getElementsByClassName('edit-time-entry-ce').item(0);

    timeEntry.ce_task_id = customEndpointInput.getElementsByClassName('ce_task_id').item(0).value;
    timeEntry.ce_ready_for_sync = customEndpointInput.getElementsByClassName('ce_ready_for_sync').item(0).checked;

    logTimeInEndpoint(timeEntry);
  }

  function invokeRenderTimeEntryEditable(timeEntry) {
    var widget = '<pre>Custom Endpoint:</pre>';
    widget += '<span>Task ID: </span><input type="text" name="ce_task_id" class="ce_input ce_task_id" value="' + timeEntry.ce_task_id + '">';
    var readyForSyncValue = timeEntry.ce_ready_for_sync ? 'checked' : '';
    widget += '<input type="checkbox" name="ce_ready_for_sync" class="ce_input ce_ready_for_sync" ' + readyForSyncValue + '>Ready for sync.<br>';

    if (timeEntry.ce_already_synced) {
      widget += '<input type="checkbox" name="ce_ready_for_sync" class="ce_input ce_ready_for_sync" disabled=true checked>Already synced.<br>';
    }
    var customEndpointAdditions = '<div class="edit-time-entry-ce">' +  widget + '</div>';
    return customEndpointAdditions;
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