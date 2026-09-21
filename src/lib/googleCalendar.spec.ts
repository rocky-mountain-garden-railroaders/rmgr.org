import { describe, expect, it } from 'vitest'
import { mapGoogleCalendarFeedToEvents, parseGoogleCalendarIcs } from './googleCalendar'

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

  it('GIVEN a recurring monthly event WHEN parsing THEN it expands future instances', () => {
    const events = parseGoogleCalendarIcs(`BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:RMGR Monthly Meeting
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
RRULE:FREQ=MONTHLY;BYDAY=3TH
LOCATION:2715 Dovely Park SE, Calgary, AB T2B 3G8, Canada
DESCRIPTION:Monthly meeting
END:VEVENT
END:VCALENDAR`)

    expect(events).toHaveLength(12)
    expect(events[0]).toMatchObject({
      title: 'RMGR Monthly Meeting',
      date: 'September 17, 2026',
      time: '7:15 PM - 8:45 PM',
    })
    expect(events[1]).toMatchObject({
      date: 'October 17, 2026',
    })
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
})
