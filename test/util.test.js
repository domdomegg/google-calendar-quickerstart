const { matchCalendar } = require('../src/util')

console.warn = jest.fn()
const calendars = [
  {
    id: 'a@group.calendar.google.com',
    summary: 'First calendar',
    primary: true
  },
  {
    id: 'b@group.calendar.google.com',
    summary: 'Second calendar'
  },
  {
    id: 'c@group.calendar.google.com',
    summary: 'Some other name',
    summaryOverride: 'Third calendar'
  }
]

test('Can match by index', () => {
  expect(matchCalendar(calendars, '0')).toBe(calendars[0])
  expect(matchCalendar(calendars, '1')).toBe(calendars[1])
  expect(matchCalendar(calendars, '2')).toBe(calendars[2])
})

test('Can match by id', () => {
  expect(matchCalendar(calendars, 'c@group.calendar.google.com')).toBe(calendars[2])
})

test('Can match by id case-insensitively', () => {
  expect(matchCalendar(calendars, 'C@GROUP.CALENDAR.GOOGLE.COM')).toBe(calendars[2])
})

test('Can match by summary', () => {
  expect(matchCalendar(calendars, 'Second calendar')).toBe(calendars[1])
})

test('Can match by summary case-insensitively', () => {
  expect(matchCalendar(calendars, 'sEconD caleNdar')).toBe(calendars[1])
})

test('Can match by summaryOverride', () => {
  expect(matchCalendar(calendars, 'Third calendar')).toBe(calendars[2])
})

test('Can match by summaryOverride case-insensitively', () => {
  expect(matchCalendar(calendars, 'third Calendar')).toBe(calendars[2])
})

test('Falls back to primary calendar if one exists', () => {
  expect(matchCalendar(calendars, '')).toBe(calendars[0])
  expect(console.warn).toHaveBeenCalled()

  expect(matchCalendar(calendars, 'this should not match')).toBe(calendars[0])
  expect(console.warn).toHaveBeenCalledTimes(2)
})

test('Falls back to undefined if no primary calendar exists', () => {
  expect(matchCalendar([], '')).toBe(undefined)
  expect(console.warn).toHaveBeenCalled()
})
