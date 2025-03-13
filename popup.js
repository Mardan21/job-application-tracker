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
    date: new Date().toISOString
  };

  await saveToGoogleSheets(jobData); // or 'saveToAirTable'

});

async function saveToGoogleSheets(jobData) {
  // Use Google Sheets API to send data
}

async function saveToAirTable(jobData) {
  // Use AirTable API to send data
}