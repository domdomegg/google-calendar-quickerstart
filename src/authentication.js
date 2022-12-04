const fs = require('fs')
const path = require('path');
const { google, Auth } = require('googleapis')
const { authenticate } = require('@google-cloud/local-auth');

const OAUTH_SETTINGS_PATH = path.join(__dirname, '..', './credentials.json')
const SAVED_TOKEN_PATH = path.join(__dirname, '..', './tokens.json')

/**
 * Get client secrets. Will first try at SAVED_TOKEN_PATH, if not present uses OAuth.
 * @param {string[]} scopes 
 * @returns {Promise<Auth.OAuth2Client>}
 */
const getAuth = async (scopes) => {
  if (!fs.existsSync(OAUTH_SETTINGS_PATH)) {
    throw new Error(`Failed to read oauth settings at ${OAUTH_SETTINGS_PATH}`)
  }

  // Create a token if we haven't previously created one.
  if (!fs.existsSync(SAVED_TOKEN_PATH)) {
    return getAccessToken(scopes)
  }

  console.log(`Found previous token in ${SAVED_TOKEN_PATH}`)
  const credentials = JSON.parse(fs.readFileSync(SAVED_TOKEN_PATH))

  // Check it hasn't expired
  if (credentials.expiry_date < Date.now()) {
    console.log(`Previous tokens expired at ${credentials.expiry_date}`)
    return getAccessToken(scopes)
  }

  console.log(`Using previous token`)
  const oauthSettings = JSON.parse(fs.readFileSync(OAUTH_SETTINGS_PATH)).installed
  const oAuth2Client = new google.auth.OAuth2({
    clientId: oauthSettings.client_id,
    clientSecret: oauthSettings.client_secret,
  })
  oAuth2Client.setCredentials(credentials)
  return oAuth2Client
}

// Gets an access token through the OAuth flow, prompting the user to paste a code into the terminal
const getAccessToken = async (scopes) => {
  return authenticate({
    scopes,
    keyfilePath: OAUTH_SETTINGS_PATH,
  }).then((client) => {
    // Save the credentials so we don't need to to this again until it expires
    fs.writeFileSync(SAVED_TOKEN_PATH, JSON.stringify(client.credentials, null, '\t'))
    console.log(`Token saved to ${SAVED_TOKEN_PATH}`)

    return client
  });
}

module.exports = { getAuth }
