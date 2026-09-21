import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import UpcomingEvents from '../views/UpcomingEvents.vue'

describe('UpcomingEvents', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('GIVEN calendar feed data exists WHEN the page renders THEN the list matches the feed items', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:RMGR Monthly Meeting
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
RRULE:FREQ=MONTHLY;BYDAY=3TH
LOCATION:2715 Dovely Park SE, Calgary, AB T2B 3G8, Canada
DESCRIPTION:Monthly meeting
END:VEVENT
END:VCALENDAR`,
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(UpcomingEvents)
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    const { eventData, upcomingEvents } = wrapper.vm as unknown as {
      eventData: Array<{
        title: string
        date: string
        time: string
        location: string
        description: string
        titleLink?: string
        highlight?: boolean
      }>
      upcomingEvents: Array<{
        title: string
        date: string
        time: string
        location: string
        description: string
        titleLink?: string
        highlight?: boolean
      }>
    }

    const rows = wrapper.findAll('h3')

    expect(upcomingEvents).toHaveLength(eventData.length)
    expect(rows).toHaveLength(eventData.length)
    expect(eventData[0]).toMatchObject({
      title: 'RMGR Monthly Meeting',
      date: 'September 17, 2026',
      time: '7:15 PM - 8:45 PM',
      location: '2715 Dovely Park SE, Calgary, AB T2B 3G8, Canada',
      description: 'Monthly meeting',
      titleLink: undefined,
    })
    expect(eventData[1]).toMatchObject({
      // October 2026's 3rd Thursday is the 15th, not the 17th.
      date: 'October 15, 2026',
    })
    expect(rows[0].text()).toBe(eventData[0].title)
    expect(rows[1].text()).toBe(eventData[1].title)

    expect(fetchMock).toHaveBeenCalledWith('/calendar-ics')
  })

  it('GIVEN a description hyperlink WHEN the page renders THEN the row is clickable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Description Linked Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
DESCRIPTION:More info at https://example.com/details
LOCATION:Online
END:VEVENT
END:VCALENDAR`,
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(UpcomingEvents)
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    const rowLink = wrapper.find('a.event-card--clickable')

    expect(rowLink.exists()).toBe(true)
    expect(rowLink.attributes('href')).toBe('https://example.com/details')
  })

  it('GIVEN a description that is only a hyperlink WHEN the page renders THEN the description is omitted', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:URL Only Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
DESCRIPTION:https://example.com/details
LOCATION:Online
END:VEVENT
END:VCALENDAR`,
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(UpcomingEvents)
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(wrapper.text()).not.toContain('https://example.com/details')
    expect(wrapper.find('a.event-card--clickable').attributes('href')).toBe(
      'https://example.com/details',
    )
  })

  it('GIVEN a URL-only description with whitespace WHEN the page renders THEN the description is omitted', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:URL Only Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
DESCRIPTION:  https://example.com/details  
LOCATION:Online
END:VEVENT
END:VCALENDAR`,
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(UpcomingEvents)
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(wrapper.text()).not.toContain('https://example.com/details')
    expect(wrapper.find('a.event-card--clickable').attributes('href')).toBe(
      'https://example.com/details',
    )
  })

  it('GIVEN a Google redirect hyperlink WHEN the page renders THEN the description is omitted and the title links out', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:ZooLights
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
DESCRIPTION:<a href="https://www.google.com/url?q=https://www.calgaryzoo.com/news/zoolights2026/&amp;sa=D&amp;source=calendar&amp;usd=2&amp;usg=AOvVaw2mFIKNrek4w8HwVuZcusci" target="_blank">https://www.calgaryzoo.com/news/zoolights2026/</a>
LOCATION:Online
END:VEVENT
END:VCALENDAR`,
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(UpcomingEvents)
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(wrapper.text()).not.toContain('https://www.calgaryzoo.com/news/zoolights2026/')
    const rowLink = wrapper.find('a.event-card--clickable')
    expect(rowLink.exists()).toBe(true)
    expect(rowLink.attributes('href')).toBe('https://www.calgaryzoo.com/news/zoolights2026/')
  })

  it('GIVEN an event without a link WHEN the page renders THEN the row is not clickable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Plain Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
DESCRIPTION:Plain description
LOCATION:Online
END:VEVENT
END:VCALENDAR`,
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(UpcomingEvents)
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(wrapper.find('a.event-card--clickable').exists()).toBe(false)
    expect(wrapper.find('div.event-card').exists()).toBe(true)
  })

  it('GIVEN a linked event WHEN the page renders THEN the icon appears on the right side', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Linked Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
DESCRIPTION:More info at https://example.com/details
LOCATION:Online
END:VEVENT
END:VCALENDAR`,
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(UpcomingEvents)
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(wrapper.find('.event-action-col').text()).toContain('')
  })

  it('GIVEN past and future events WHEN the page renders THEN only upcoming events show by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Old Event
DTSTART;TZID=America/Edmonton:20250101T191500
DTEND;TZID=America/Edmonton:20250101T204500
LOCATION:Online
DESCRIPTION:Past event
END:VEVENT
BEGIN:VEVENT
SUMMARY:Future Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
LOCATION:Online
DESCRIPTION:Future event
END:VEVENT
END:VCALENDAR`,
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(UpcomingEvents)
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(wrapper.text()).toContain('Upcoming Events')
    expect(wrapper.text()).toContain('Future Event')
    expect(wrapper.text()).not.toContain('Old Event')

    await wrapper.find('.past-toggle-btn').trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Past Events')
    expect(wrapper.text()).toContain('Old Event')
    expect(wrapper.text()).not.toContain('Future Event')
  })

  it('GIVEN a same-day evening event WHEN the current time is mid-afternoon locally THEN it is not classified as past', async () => {
    // 22:00 UTC on Sept 17 is 4:00 PM in America/Edmonton (MDT, UTC-6),
    // well before this event's 7:15-8:45 PM local end time (01:15-02:45 UTC
    // the next day). A host-timezone-dependent TZID conversion previously
    // miscalculated the UTC instant and could mark the event as already
    // ended hours before its true local end time.
    vi.setSystemTime(new Date('2026-09-17T22:00:00Z'))

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Same Day Evening Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
LOCATION:Online
DESCRIPTION:Evening event
END:VEVENT
END:VCALENDAR`,
    })
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(UpcomingEvents)
    await Promise.resolve()
    await Promise.resolve()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(wrapper.text()).toContain('Upcoming Events')
    expect(wrapper.text()).toContain('Same Day Evening Event')

    await wrapper.find('.past-toggle-btn').trigger('click')
    await nextTick()

    expect(wrapper.text()).not.toContain('Same Day Evening Event')
  })
})
