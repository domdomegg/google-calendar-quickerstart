const fs = require('fs')
const { google } = require('googleapis')

const { read } = require('./util')

const OAUTH_SETTINGS_PATH = './credentials.json'
const SAVED_TOKEN_PATH = './tokens.json'

// Get client secrets. Will first try token.json, if not present should use OAuth.
const getAuth = async (scope) => {
  const { client_secret: clientSecret, client_id: clientId } = JSON.parse(fs.readFileSync(OAUTH_SETTINGS_PATH)).installed
  const oAuth2Client = new google.auth.OAuth2({ clientId, clientSecret, redirectUri: 'urn:ietf:wg:oauth:2.0:oob' })
  console.log(`Successfully got OAuth secrets from ${OAUTH_SETTINGS_PATH}`)

  // Create a token if we haven't previously created one.
  if (!fs.existsSync(SAVED_TOKEN_PATH)) {
    return getAccessToken(oAuth2Client, scope)
  }

  console.log(`Found previous token in ${SAVED_TOKEN_PATH}`)
  const credentials = JSON.parse(fs.readFileSync(SAVED_TOKEN_PATH))

  // Check it hasn't expired
  if (credentials.expiry_date < Date.now()) {
    console.log(`Previous tokens expired at ${credentials.expiry_date}`)
    return getAccessToken(oAuth2Client, scope)
  }

  oAuth2Client.setCredentials(credentials)
  return oAuth2Client
}

// Gets an access token through the OAuth flow, prompting the user to paste a code into the terminal
const getAccessToken = async (oAuth2Client, scope) => {
  const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope })
  console.log('Authorize this app by visiting:', authUrl)

  const code = await read('Code')
  return oAuth2Client.getToken(code).then(({ tokens }) => {
    oAuth2Client.setCredentials(tokens)

    // Save the token so we don't need to to this again until it expires
    fs.writeFileSync(SAVED_TOKEN_PATH, JSON.stringify(tokens, null, '\t'))
    console.log(`Token saved to ${SAVED_TOKEN_PATH}`)

    return oAuth2Client
  }).catch(err => {
    console.error('Error performing OAuth exchange', err)
    process.exit(1)
  })
}

module.exports = { getAuth }
