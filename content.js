const selectors = {
    role: [
        'h1.job-title',
        '.job-title',
        '[data-job-title]',
        '.posting-title h2',
        '[data-automation="job-title"]',
        '.job-posting-title'
    ],
    company: [
        'a.company-name',
        '.company-name',
        '[data-company]',
        '.posting-company',
        '[data-automation="company-name"]',
        '.employer-name'
    ]
};

// Function to find an element using an array of selectors
const findElement = (selectorArray) => {
    for (const selector of selectorArray) {
        const element = document.querySelector(selector);
        if (element) return element.textContent.trim();
    }
    return null;
};

// Function to extract job details from the page
function getJobDetails() {
  try {
    const role = findElement(selectors.role) || 'Unknown Role';
    const company = findElement(selectors.company) || 'Unknown Company';
    const link = window.location.href;

    return { role, company, link };
  } catch (error) {
    console.error('Error extracting job details:', error);
    return { role: 'Unknown Role', company: 'Unknown Company', link: window.location.href };
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getJobDetails') {
    const jobDetails = getJobDetails();
    sendResponse(jobDetails);
  }
});

// Add event listener for the submit button
document.addEventListener('DOMContentLoaded', () => {
  const submitButton = document.querySelector('#submit-button');
  if (submitButton) {
    submitButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'getJobDetails' }, (response) => {
        console.log('Job Details:', response);
        // Populate the form with job details
        document.querySelector('#role').value = response.role;
        document.querySelector('#company').value = response.company;
        document.querySelector('#link').value = response.link;
      });
    });
  }
});