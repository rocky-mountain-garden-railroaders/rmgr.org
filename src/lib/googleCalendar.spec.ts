import { describe, expect, it } from 'vitest'
import { mapGoogleCalendarFeedToEvents, parseGoogleCalendarIcs } from './googleCalendar'

// Recurrence expansion is relative to "now", so pin it to keep these deterministic.
const NOW = new Date('2026-09-26T12:00:00.000Z')

const monthlySeries = (dtstart: string) => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:RMGR Monthly Meeting
DTSTART;TZID=America/Edmonton:${dtstart}T191500
DTEND;TZID=America/Edmonton:${dtstart}T204500
RRULE:FREQ=MONTHLY;BYDAY=3TH
LOCATION:2715 Dovely Park SE, Calgary, AB T2B 3G8, Canada
DESCRIPTION:Monthly meeting
END:VEVENT
END:VCALENDAR`

const seriesWithException = (exceptionBody: string) => `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:rmgr-monthly
SUMMARY:RMGR Monthly Meeting
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
RRULE:FREQ=MONTHLY;BYDAY=3TH
LOCATION:2715 Dovely Park SE, Calgary, AB T2B 3G8, Canada
DESCRIPTION:Monthly meeting
END:VEVENT
BEGIN:VEVENT
UID:rmgr-monthly
RECURRENCE-ID;TZID=America/Edmonton:20261015T191500
${exceptionBody}
END:VEVENT
END:VCALENDAR`


describe('googleCalendar', () => {
  it('GIVEN ICS text WHEN parsing THEN it returns calendar events', () => {
    const events = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Annual Club Garden Tour & Open House
DTSTART;TZID=America/Edmonton:20260719T160000
DTEND;TZID=America/Edmonton:20260719T223000
LOCATION:Various Member Layouts, Calgary Area
DESCRIPTION:Summer event
END:VEVENT
END:VCALENDAR`)

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      title: 'Annual Club Garden Tour & Open House',
      location: 'Various Member Layouts, Calgary Area',
      description: 'Summer event',
      titleLink: undefined,
      url: undefined,
    })
  })

  it('GIVEN a long-running monthly series that began years ago WHEN parsing THEN it still yields upcoming occurrences', () => {
    const events = parseGoogleCalendarIcs(monthlySeries('20180920'), { now: NOW })

    const upcoming = events.filter((event) => Date.parse(event.startsAt) >= NOW.getTime())

    expect(upcoming.length).toBeGreaterThan(0)
    expect(events.every((event) => event.title === 'RMGR Monthly Meeting')).toBe(true)
  })

  it('GIVEN a recurring series WHEN parsing THEN it keeps recent past occurrences for the past-events view', () => {
    const events = parseGoogleCalendarIcs(monthlySeries('20180920'), { now: NOW })

    const past = events.filter((event) => Date.parse(event.startsAt) < NOW.getTime())

    expect(past.length).toBeGreaterThan(0)
  })

  it('GIVEN an unbounded series WHEN parsing THEN occurrences stop at the forward window', () => {
    const events = parseGoogleCalendarIcs(monthlySeries('20180920'), { now: NOW })

    const horizon = new Date('2028-03-26T12:00:00.000Z').getTime()
    const upcoming = events.filter((event) => Date.parse(event.startsAt) >= NOW.getTime())

    expect(upcoming.length).toBeLessThanOrEqual(18)
    expect(events.every((event) => Date.parse(event.startsAt) <= horizon)).toBe(true)
  })

  it('GIVEN the same series at two different times WHEN parsing THEN the forward window follows the current date', () => {
    const earlier = parseGoogleCalendarIcs(monthlySeries('20180920'), {
      now: new Date('2026-09-26T12:00:00.000Z'),
    })
    const later = parseGoogleCalendarIcs(monthlySeries('20180920'), {
      now: new Date('2030-09-26T12:00:00.000Z'),
    })

    const lastStart = (events: typeof earlier) => Date.parse(events[events.length - 1].startsAt)

    expect(later[0].startsAt).toBe(earlier[0].startsAt)
    expect(lastStart(later)).toBeGreaterThan(lastStart(earlier))
    expect(later.filter((e) => Date.parse(e.startsAt) >= Date.parse('2030-09-26')).length).toBeGreaterThan(0)
  })

  it('GIVEN a non-recurring past event WHEN parsing THEN it is still returned regardless of the window', () => {
    const events = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Historic Open House
DTSTART;TZID=America/Edmonton:20100612T100000
DTEND;TZID=America/Edmonton:20100612T160000
LOCATION:Clubhouse
END:VEVENT
END:VCALENDAR`, { now: NOW })

    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Historic Open House')
  })

  it('GIVEN multiple events WHEN parsing THEN it sorts them from soonest to latest', () => {
    const events = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Later Event
DTSTART;TZID=America/Edmonton:20261017T191500
DTEND;TZID=America/Edmonton:20261017T204500
LOCATION:Later
DESCRIPTION:Later
END:VEVENT
BEGIN:VEVENT
SUMMARY:Sooner Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
LOCATION:Sooner
DESCRIPTION:Sooner
END:VEVENT
END:VCALENDAR`)

    expect(events[0].title).toBe('Sooner Event')
    expect(events[1].title).toBe('Later Event')
  })

  it('GIVEN an ICS URL WHEN parsing THEN it includes the event link', () => {
    const events = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Linked Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
URL:https://example.com/event
LOCATION:Online
DESCRIPTION:Linked
END:VEVENT
END:VCALENDAR`)

    expect(events[0]).toMatchObject({
      title: 'Linked Event',
      titleLink: 'https://example.com/event',
      url: 'https://example.com/event',
    })
  })

  it('GIVEN a description containing a hyperlink WHEN parsing THEN it promotes that link to the title', () => {
    const events = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Description Linked Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
DESCRIPTION:More info at https://example.com/details
LOCATION:Online
END:VEVENT
END:VCALENDAR`)

    expect(events[0]).toMatchObject({
      title: 'Description Linked Event',
      titleLink: 'https://example.com/details',
      url: 'https://example.com/details',
    })
  })

  it('GIVEN a description that is only a hyperlink WHEN parsing THEN it hides the description text', () => {
    const events = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:URL Only Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
DESCRIPTION:https://example.com/details
LOCATION:Online
END:VEVENT
END:VCALENDAR`)

    expect(events[0]).toMatchObject({
      title: 'URL Only Event',
      titleLink: 'https://example.com/details',
      url: 'https://example.com/details',
      description: '',
    })
  })

  it('GIVEN a URL-only description with whitespace WHEN parsing THEN it hides the description text', () => {
    const events = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:URL Only Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
DESCRIPTION:  https://example.com/details  
LOCATION:Online
END:VEVENT
END:VCALENDAR`)

    expect(events[0]).toMatchObject({
      titleLink: 'https://example.com/details',
      description: '',
    })
  })

  it('GIVEN a Google redirect hyperlink WHEN parsing THEN it resolves the target URL', () => {
    const events = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:ZooLights
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
DESCRIPTION:<a href="https://www.google.com/url?q=https://www.calgaryzoo.com/news/zoolights2026/&amp;sa=D&amp;source=calendar&amp;usd=2&amp;usg=AOvVaw2mFIKNrek4w8HwVuZcusci" target="_blank">https://www.calgaryzoo.com/news/zoolights2026/</a>
LOCATION:Online
END:VEVENT
END:VCALENDAR`)

    expect(events[0]).toMatchObject({
      titleLink: 'https://www.calgaryzoo.com/news/zoolights2026/',
      url: 'https://www.calgaryzoo.com/news/zoolights2026/',
      description: '',
    })
  })

  it('GIVEN an all-day feed event WHEN mapping THEN the displayed date matches the calendar-local start day', () => {
    const events = mapGoogleCalendarFeedToEvents([
      {
        summary: 'Family Day',
        start: { date: '2026-09-17' },
        end: { date: '2026-09-18' },
        location: 'TBD',
      },
    ])

    expect(events[0]).toMatchObject({
      date: 'September 17, 2026',
      time: 'All day',
    })
  })

  it('GIVEN an all-day ICS event with DTEND;VALUE=DATE WHEN parsing THEN it shows All day instead of a time range', () => {
    const events = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Family Day
DTSTART;VALUE=DATE:20260917
DTEND;VALUE=DATE:20260918
LOCATION:Clubhouse
DESCRIPTION:All day event
END:VEVENT
END:VCALENDAR`)

    expect(events[0]).toMatchObject({
      title: 'Family Day',
      date: 'September 17, 2026',
      time: 'All day',
    })
  })

  it('GIVEN an all-day event with no TZID WHEN parsing on either side of the Edmonton DST transition THEN each instance uses the correct local UTC offset', () => {
    const summerEvent = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:All-day Meeting
DTSTART;VALUE=DATE:20260917
DTEND;VALUE=DATE:20260918
LOCATION:Clubhouse
END:VEVENT
END:VCALENDAR`)

    const winterEvent = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:All-day Meeting
DTSTART;VALUE=DATE:20261119
DTEND;VALUE=DATE:20261120
LOCATION:Clubhouse
END:VEVENT
END:VCALENDAR`)

    expect(summerEvent[0]).toMatchObject({
      date: 'September 17, 2026',
      time: 'All day',
      startsAt: '2026-09-17T06:00:00.000Z',
    })
    expect(winterEvent[0]).toMatchObject({
      date: 'November 19, 2026',
      time: 'All day',
      startsAt: '2026-11-19T07:00:00.000Z',
    })
  })

  it('GIVEN an edited recurrence exception WHEN parsing THEN that occurrence uses the exception metadata', () => {
    const events = parseGoogleCalendarIcs(
      seriesWithException(`SUMMARY:RMGR Annual General Meeting
DTSTART;TZID=America/Edmonton:20261015T183000
DTEND;TZID=America/Edmonton:20261015T210000
LOCATION:Community Hall
DESCRIPTION:AGM and elections
URL:https://example.com/agm`),
      { now: NOW },
    )

    expect(events.find((event) => event.date === 'October 15, 2026')).toMatchObject({
      title: 'RMGR Annual General Meeting',
      time: '6:30 PM - 9:00 PM',
      location: 'Community Hall',
      description: 'AGM and elections',
      titleLink: 'https://example.com/agm',
      url: 'https://example.com/agm',
    })

    // Unmodified occurrences must still use the master's metadata.
    expect(events.find((event) => event.date === 'November 19, 2026')).toMatchObject({
      title: 'RMGR Monthly Meeting',
      time: '7:15 PM - 8:45 PM',
      location: '2715 Dovely Park SE, Calgary, AB T2B 3G8, Canada',
      url: undefined,
    })
  })

  it('GIVEN an exception in another time zone WHEN parsing THEN its own TZID is used', () => {
    const events = parseGoogleCalendarIcs(
      seriesWithException(`SUMMARY:RMGR Remote Meeting
DTSTART;TZID=America/Toronto:20261015T211500
DTEND;TZID=America/Toronto:20261015T224500`),
      { now: NOW },
    )

    expect(events.find((event) => event.date === 'October 15, 2026')).toMatchObject({
      title: 'RMGR Remote Meeting',
      startsAt: '2026-10-16T01:15:00.000Z',
      endsAt: '2026-10-16T02:45:00.000Z',
    })
  })

  it('GIVEN a cancelled recurrence exception WHEN parsing THEN that occurrence is omitted', () => {
    const events = parseGoogleCalendarIcs(
      seriesWithException(`SUMMARY:RMGR Monthly Meeting
STATUS:CANCELLED
DTSTART;TZID=America/Edmonton:20261015T191500
DTEND;TZID=America/Edmonton:20261015T204500`),
      { now: NOW },
    )

    expect(events.some((event) => event.date === 'October 15, 2026')).toBe(false)
    expect(events.some((event) => event.date === 'November 19, 2026')).toBe(true)
  })

  it('GIVEN a cancelled series WHEN parsing THEN no occurrences are returned', () => {
    const events = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
UID:cancelled-series
SUMMARY:RMGR Monthly Meeting
STATUS:CANCELLED
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
RRULE:FREQ=MONTHLY;BYDAY=3TH
END:VEVENT
END:VCALENDAR`, { now: NOW })

    expect(events).toEqual([])
  })
})
