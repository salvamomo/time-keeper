/**
 * Time logging integration with Jira.
 */

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
        console.log('Request not finished yet');
        return;
      }

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
