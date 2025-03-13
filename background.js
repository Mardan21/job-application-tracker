const CLIENT_ID = "1082440828906-aracbv7n5st8bpp33udlsm7ph3llrknc.apps.googleusercontent.com";
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
let accessToken = null;

// initiate oauth 2.0 authentication flow w/ google
function authenticate() {
  // Generate random state parameter for CSRF protection
  const state = Math.random().toString(36).substring(7);
  // google oauth authorization url w/ required params
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&state=${state}`;

  // launch chromes oauth flow in popup window
  chrome.identity.launchWebAuthFlow(
    { url: authUrl, interactive: true},
    function(redirectUrl) {
      // handle auth failures
      if (chrome.runtime.lastError || !redirectUrl) {
        console.error("Authentication failed:", chrome.runtime.lastError);
        return;
      }

      // parse accessToken from URL's hash fragment (contains: access_token, token_type, expires_in)
      const params = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
      accessToken = params.get("access_token");

      // store accessToken if auth successful
      if (accessToken) {
        console.log("Authentication successful! Access Token:", accessToken);
      }
    }
  );
}

// listen for messages from popup.js to start authentication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "authenticate") {
    authenticate();
    sendResponse({ success: true });
  }
});