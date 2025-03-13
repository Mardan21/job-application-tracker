document.addEventListener('DOMContentLoaded', async () => {
  await loadSavedSheets();
  setupSheetManagement();
  populateJobDetails(); // Populate job details automatically
});

async function loadSavedSheets() {
  const { sheets = [] } = await chrome.storage.sync.get('sheets');
  const selector = document.getElementById('sheet-selector');

  sheets.forEach(sheet => {
    const option = new Option(sheet.name, sheet.id);
    selector.add(option); // Fix the event listener issue
  });

  // show/hide form based on sheet selection
  if (sheets.length > 0) {
    document.getElementById('application-form').classList.remove('hidden');
  }
}

function setupSheetManagement() {
  const addSheetBtn = document.getElementById('add-sheet');
  const addSheetForm = document.getElementById('add-sheet-form');
  const cancelBtn = document.getElementById('cancel-add-sheet');
  const saveSheetBtn = document.getElementById('save-sheet');
  const sheetSelector = document.getElementById('sheet-selector');

  addSheetBtn.addEventListener('click', () => {
    addSheetForm.classList.remove('hidden');
    addSheetBtn.classList.add('hidden');
  });

  cancelBtn.addEventListener('click', () => {
    addSheetForm.classList.add('hidden');
    addSheetBtn.classList.remove('hidden');
  });

  saveSheetBtn.addEventListener('click', async () => {
    const url = document.getElementById('sheet-url').value;
    const name = document.getElementById('sheet-name').value;

    if (!url || !name) {
      displayError('Please fill in both fields');
      return;
    }

    // extract sheet ID from URL
    const sheetId = extractSheetId(url);
    if(!sheetId) {
      displayError('Invalid Google Sheets URL');
      return;
    }

    // save to chrome.storage
    const { sheets = [] } = await chrome.storage.sync.get('sheets');
    sheets.push({ id: sheetId, name, url });
    await chrome.storage.sync.set({ sheets });

    // add to selector
    const option = new Option(name, sheetId);
    sheetSelector.add(option);
    sheetSelector.value = sheetId;

    // reset and hide form
    addSheetForm.classList.add('hidden');
    addSheetBtn.classList.remove('hidden'); // Fix the typo
    document.getElementById('sheet-url').value = '';
    document.getElementById('sheet-name').value = '';
    document.getElementById('application-form').classList.remove('hidden');
  });

  sheetSelector.addEventListener('change', () => {
    const form = document.getElementById('application-form');
    form.classList.toggle('hidden', !sheetSelector.value);
  });
}

function extractSheetId(url) {
  try {
    const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

function showLoading(show = true) {
  const loadingDiv = document.getElementById('loading') || createLoadingElement();
  loadingDiv.style.display = show ? 'block' : 'none';
}

function createLoadingElement() {
  const div = document.createElement('div');
  div.id = 'loading';
  div.textContent = 'Processing...';
  document.body.appendChild(div);
  return div;
}

function addSheetManagementUI() {
  const sheetSelector = document.getElementById('sheet-selector');

  // add delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete'
  deleteBtn.onClick = async () => {
    const { sheets = [] } = await chrome.storage.sync.get('sheets');
    const updatedSheets = sheets.filter(s => s.id !== sheetSelector.value);
    await chrome.storage.sync.set({ sheets: updatedSheets });
    location.reload();
  };

  sheetSelector.parentNode.appendChild(deleteBtn);
}

document.getElementById("application-form").addEventListener('submit', async(e) => {
  e.preventDefault();

  const sheetId = document.getElementById('sheet-selector').value;
  if (!sheetId) {
    displayError('Please select a sheet first');
  }

  const role = document.getElementById("role").value;
  const company = document.getElementById("company").value;
  const status = document.getElementById("status").value;
  const link = document.getElementById("link").value;
  const referred = document.getElementById("referred").checked;

  const jobData = {
    sheetId,
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
      if (response && response.success) {
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
      if (response && response.isAuthenticated !== undefined) {
        resolve(response.isAuthenticated);
      } else {
        resolve(false);
      }
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

async function populateJobDetails() {
  // Request job details from the content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getJobDetails' }, (response) => {
      if (response) {
        document.getElementById('role').value = response.role;
        document.getElementById('company').value = response.company;
        document.getElementById('link').value = response.link;
      }
    });
  });
}