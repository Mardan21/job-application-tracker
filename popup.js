document.getElementById("application-form").addEventListener('submit', async(e) => {
  e.preventDefault();
  const role = document.getElementById("role").value;
  const company = document.getElementById("company").value;
  const status = document.getElementById("status").value;
  const link = document.getElementById("link").value;
  const referred = document.getElementById("referred").checked;

  const jobData = {
    role,
    company,
    status,
    link,
    referred,
    date: new Date().toISOString()
  };

  try {
    // check if user is authenticated
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      // trigger authentication flow
      await authenticate();
    }
    await saveToGoogleSheets(jobData); // or 'saveToAirTable'
    displaySuccess('Application saved successfully!')
  } catch (error) {
    console.error('Error:', error);
    // show error message to user
    displayError('Please sign in to save applications');
  }
});

async function authenticate() {
  // trigger auth flow via background script
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'AUTHENTICATE' }, (response) => {
      if (response.success) {
        resolve();
      } else {
        reject(new Error('Authentication failed'));
      }
    });
  });
}

async function checkAuthentication() {
  // check if we have valid auth tokens
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'CHECK_AUTH' }, response => {
      resolve(response.isAuthenticated);
    });
  });
}

function displaySuccess(message) {
  // add success diplay logic here
  const successDiv = document.getElementById('success-message') || document.createElement('div');
  successDiv.id = 'success-message';
  successDiv.textContent = message;
  successDiv.style.color = 'green';
  document.getElementById('application-form').appendChild(successDiv);
}

function displayError(message) {
  // add error display logic here
  const errorDiv = document.getElementById('error-message') || document.createElement('div');
  errorDiv.id = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.color = 'red';
  document.getElementById('application-form').appendChild(errorDiv);
}

async function saveToGoogleSheets(jobData) {
  // use Google Sheets API to send data
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: 'SAVE_TO_SHEETS',
        data: jobData
      },
      (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to save to Google Sheets'));
        }
      }
    );
  });
}

// async function saveToAirTable(jobData) {
//   // use AirTable API to send data
// }