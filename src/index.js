const dayjs = require('dayjs')
const { google, Auth, calendar_v3 } = require('googleapis') // eslint-disable-line no-unused-vars,camelcase

const { getAuth } = require('./authentication')
const { read, matchCalendar } = require('./util')

/**
 * @param {Auth.AuthClient} auth
 * @returns {calendar_v3.Calendar}
 */
const getCalendarClient = (auth) => google.calendar({ version: 'v3', auth })

/**
 * Show the user their calendars and get them to pick one
 * @param {calendar_v3.Calendar} client
 * @returns {Promise<string>} calendar id
 */
const getCalendarId = async (client) => {
  const calendars = (await client.calendarList.list()).data.items

  console.log('Calendars:')
  console.log(calendars.map((calendar, index) => `  ${index}: ${calendar.summaryOverride || calendar.summary} (${calendar.id})`).join('\n'))

  const calendar = matchCalendar(calendars, await read('Please select a calendar'))
  console.log(`Selected ${calendar.summaryOverride || calendar.summary}`)

  return calendar.id
}

/**
 * Gets 'time-able' (as opposed to 'all-day') events
 * @param {calendar_v3.Calendar} client
 * @returns {Promise<calendar_v3.Schema$Event[]>}
 */
const getTimeableEvents = async (client, { calendarId = 'primary', timeMin, timeMax, maxResults = 2500 }) => {
  const events = (await client.events.list({
    calendarId,
    timeMin,
    timeMax,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime'
  })).data.items

  // This line actually does the time-able filtering
  return events.filter(event => event.start.dateTime && event.end.dateTime)
}

(async () => {
  const auth = await getAuth(['https://www.googleapis.com/auth/calendar.readonly'])
  const client = getCalendarClient(auth)
  const calendarId = await getCalendarId(client)

  const timeMin = dayjs(await read('Get events from (inclusive)', dayjs().day(0).format('YYYY-MM-DD'))).toISOString()
  const timeMax = dayjs(await read('Get events to (exclusive)', dayjs().add(1, 'day').format('YYYY-MM-DD'))).toISOString()

  getTimeableEvents(client, { calendarId, timeMin, timeMax })
    .then(events => {
      console.log(`Events between ${timeMin} and ${timeMax}:`)
      console.log(events.map((event) =>
        `  [${event.start.dateTime} - ${event.end.dateTime}] (${(new Date(event.end.dateTime) - new Date(event.start.dateTime)) / 3600000} hrs) ${event.summary}`
      ).join('\n'))

      console.log(`Total hours: ${events.reduce((acc, cur) => {
        return acc + (new Date(cur.end.dateTime) - new Date(cur.start.dateTime)) / 3600000
      }, 0)}`)
    })
})()
