const fs = require('fs')
const http = require('http')
const path = require('path')
const { google, Auth } = require('googleapis') // eslint-disable-line no-unused-vars

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

  const oauthSettings = JSON.parse(fs.readFileSync(OAUTH_SETTINGS_PATH)).installed
  const oAuth2Client = new google.auth.OAuth2({
    clientId: oauthSettings.client_id,
    clientSecret: oauthSettings.client_secret,
    redirectUri: 'http://localhost:3000/oauth2callback'
  })

  // Create a token if we haven't previously created one.
  if (!fs.existsSync(SAVED_TOKEN_PATH)) {
    return getAccessToken(oAuth2Client, scopes)
  }

  console.log(`Found previous token in ${SAVED_TOKEN_PATH}`)
  const credentials = JSON.parse(fs.readFileSync(SAVED_TOKEN_PATH))

  // Check it hasn't expired
  if (credentials.expiry_date < Date.now()) {
    console.log(`Previous tokens expired at ${credentials.expiry_date}`)
    return getAccessToken(oAuth2Client, scopes)
  }

  console.log('Using previous token')
  oAuth2Client.setCredentials(credentials)
  return oAuth2Client
}

// Gets an access token through the OAuth flow using a local server
const getAccessToken = (oAuth2Client, scopes) => {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
    })

    console.log('Authorize this app by visiting this URL:')
    console.log(authUrl)

    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost:3000')
        if (url.pathname !== '/oauth2callback') return

        const code = url.searchParams.get('code')
        if (!code) {
          res.end('No code found in callback')
          return
        }

        res.end('Authentication successful! You can close this tab.')
        server.close()

        const { tokens } = await oAuth2Client.getToken(code)
        oAuth2Client.setCredentials(tokens)

        fs.writeFileSync(SAVED_TOKEN_PATH, JSON.stringify(tokens, null, '\t'))
        console.log(`Token saved to ${SAVED_TOKEN_PATH}`)

        resolve(oAuth2Client)
      } catch (err) {
        reject(err)
      }
    }).listen(3000, () => {
      console.log('Waiting for authentication on http://localhost:3000...')
    })
  })
}

module.exports = { getAuth }
