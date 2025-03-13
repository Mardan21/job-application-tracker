// Should work if the page is a job posting page with the relevant data
const role = document.querySelector('h1.job-title').textContent || 'Unknown Role';
const company = document.querySelector('a.company-name').textContent || 'Unknown Company';
const link = window.location.href;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getJobDetails') {
    sendResponse({ role, company, link })
  }
});