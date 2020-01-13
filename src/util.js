const readline = require('readline')

const read = (prompt, fallback) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false })
  return new Promise(resolve => rl.question(prompt + ': ' + (fallback ? `(${fallback}) ` : ''), res => {
    rl.close()
    resolve(res || fallback)
  }))
}

const matchCalendar = (calendars, res) => {
  // If entered a number, use that as index into the calendar list
  if (/^(0|[1-9]\d*)$/.test(res) && parseInt(res) < calendars.length) {
    return calendars[parseInt(res)]
  }

  // If anything else, try to match on id, summaryOverride or summary
  const resLC = res.toLowerCase()
  for (let i = 0; i < calendars.length; i++) {
    const calendar = calendars[i]
    if ([calendar.id, calendar.summaryOverride, calendar.summary].filter(s => !!s).map(s => s.toLowerCase()).includes(resLC)) return calendar
  }

  console.warn(`Failed to find calendar matching ${res}, falling back to primary`)
  return calendars.find(calendar => calendar.primary)
}

module.exports = { read, matchCalendar }
