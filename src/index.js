const dayjs = require('dayjs')
const { google } = require('googleapis')

const { getAuth } = require('./authentication')
const { read, matchCalendar } = require('./util')

const getCalendarClient = (auth) => google.calendar({ version: 'v3', auth })

// Show the user their calendars and get them to pick one
const getCalendarId = async (client) => {
  const calendars = (await client.calendarList.list()).data.items

  console.log('Calendars:')
  console.log(calendars.map((calendar, index) => `  ${index}: ${calendar.id} ${calendar.summaryOverride || calendar.summary}`).join('\n'))

  const calendar = matchCalendar(calendars, await read('Please select a calendar'))
  console.log(`Selected ${calendar.summaryOverride || calendar.summary}`)

  return calendar.id
}

// Gets 'time-able' (as opposed to 'all-day') events
const getTimeableEvents = (calendar) => ({ calendarId = 'primary', timeMin, timeMax, maxResults = 2500 }) =>
  calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime'
  })
    .then(({ data: { items } }) => items)
    .then(events => events.filter(event => event.start.dateTime && event.end.dateTime)); // This line actually does the time-able filtering

(async () => {
  const client = await getAuth(['https://www.googleapis.com/auth/calendar.readonly']).then(getCalendarClient)
  const calendarId = await getCalendarId(client)

  const timeMin = dayjs(await read('Get events from (inclusive)', dayjs().day(0).format('YYYY-MM-DD'))).toISOString()
  const timeMax = dayjs(await read('Get events to (exclusive)', dayjs().add(1, 'day').format('YYYY-MM-DD'))).toISOString()

  console.log(`Events between ${timeMin} and ${timeMax}:`)
  getTimeableEvents(client)({ calendarId, timeMin, timeMax })
    .then(events => console.log(events.map((event, index) => `  ${index}: [${event.start.dateTime} - ${event.end.dateTime}] ${event.summary}`).join('\n')))
})()
