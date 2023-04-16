# Google Calendar Node.js Quickerstart

Pull events out of Google Calendar. Meant to be a template that can be adapted for whatever your needs are.

## Setup

1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials) in the Google Cloud Console
2. Click `Create Credentials > OAuth client ID`
3. Follow the wizard to create a credential with application type `Desktop app`
4. Download the JSON file, rename it from `client_secret_...` to `credentials.json`, and put it in the root of this repo.
5. Run `npm install`
6. Run `npm start`

NB: After you login, if you get the `Google hasn’t verified this app` screen, click `Advanced > Go to App Name (unsafe)` to continue.
