import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import UpcomingEvents from '../views/UpcomingEvents.vue'

enableAutoUnmount(afterEach)

describe('UpcomingEvents', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    vi.stubGlobal('innerWidth', 1280)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it.each([390, 959, 960, 1280])(
    'GIVEN a %spx viewport WHEN the page opens THEN the appropriate view is selected and can be toggled',
    async (width) => {
      vi.stubGlobal('innerWidth', width)
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          text: async () => 'BEGIN:VCALENDAR\nEND:VCALENDAR',
        }),
      )
      const wrapper = mount(UpcomingEvents)
      await flushPromises()
      const boardByDefault = width >= 960
      const toggle = wrapper.find('.view-toggle-btn')

      expect(wrapper.find('.ticker-board').exists()).toBe(boardByDefault)
      expect(wrapper.find('.events-list').exists()).toBe(!boardByDefault)
      expect(toggle.attributes('aria-pressed')).toBe(String(boardByDefault))
      expect(toggle.text()).toContain(boardByDefault ? 'Simple view' : 'Ticket Board View')
      expect(wrapper.text()).toContain('No upcoming events scheduled right now.')
      const controls = wrapper.findAll('.event-control')
      expect(controls).toHaveLength(3)
      expect(controls[0].classes()).toContain('view-toggle-btn')
      expect(controls[1].attributes('href')).toBe('/calendar-ics')
      expect(controls[2].classes()).toContain('past-toggle-btn')

      await toggle.trigger('click')
      expect(wrapper.find('.ticker-board').exists()).toBe(!boardByDefault)
      expect(wrapper.find('.events-list').exists()).toBe(boardByDefault)
      expect(toggle.attributes('aria-pressed')).toBe(String(!boardByDefault))

      await toggle.trigger('click')
      expect(wrapper.find('.ticker-board').exists()).toBe(boardByDefault)
    },
  )

  it('GIVEN past events are selected WHEN switching views THEN the selection and event details are preserved without refetching', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Old Event
DTSTART;TZID=America/Edmonton:20250101T191500
DTEND;TZID=America/Edmonton:20250101T204500
LOCATION:2715 Dovely Park SE, Calgary
DESCRIPTION:More info at https://example.com/details
END:VEVENT
BEGIN:VEVENT
SUMMARY:Future Event
DTSTART;TZID=America/Edmonton:20260917T191500
LOCATION:Online
END:VEVENT
END:VCALENDAR`,
    })
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(UpcomingEvents)
    await flushPromises()
    await wrapper.find('.past-toggle-btn').trigger('click')
    await wrapper.find('.view-toggle-btn').trigger('click')

    expect(wrapper.find('.events-list').exists()).toBe(true)
    expect(wrapper.find('h3').text()).toBe('Old Event')
    expect(wrapper.text()).not.toContain('Future Event')
    expect(wrapper.find('.event-date').text()).toBe('January 01, 2025')
    expect(wrapper.find('.event-time').text()).toBe('7:15 PM - 8:45 PM')
    expect(wrapper.find('.event-location').text()).toBe('2715 Dovely Park SE, Calgary')
    expect(wrapper.find('.body-copy').text()).toContain('More info at')
    expect(wrapper.find('a.event-card').attributes('href')).toBe('https://example.com/details')

    await wrapper.find('.view-toggle-btn').trigger('click')
    expect(wrapper.find('.ticker-board').exists()).toBe(true)
    expect(wrapper.find('h3').text()).toBe('Old Event')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('GIVEN calendar feed data exists WHEN the page renders THEN the list matches the feed items', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:RMGR Monthly Meeting
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
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
    expect(rows[0].text()).toBe(eventData[0].title)

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

  it('GIVEN a linked event WHEN the board renders THEN only a link icon is shown with no status text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Board Event
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

    expect(wrapper.find('.ticker-board').exists()).toBe(true)
    expect(wrapper.find('a.event-card--clickable .board-link-icon').exists()).toBe(true)
    expect(wrapper.text()).not.toMatch(/on time|departed|now boarding/i)
  })

  it('GIVEN an event with an address WHEN the address is clicked THEN Google Maps opens without following the row link', async () => {
    const openMock = vi.fn()
    vi.stubGlobal('open', openMock)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Linked Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
DESCRIPTION:More info at https://example.com/details
LOCATION:2715 Dovely Park SE, Calgary
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

    const address = wrapper.find('a.event-card--clickable .board-location-cell')
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    address.element.dispatchEvent(click)

    expect(openMock).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=2715%20Dovely%20Park%20SE%2C%20Calgary',
      '_blank',
      'noopener,noreferrer',
    )
    expect(click.defaultPrevented).toBe(true)
  })

  it.each(['Online', 'TBD'])(
    'GIVEN a %s location WHEN the board renders THEN it shows as plain text without a Maps action',
    async (location) => {
      const openMock = vi.fn()
      vi.stubGlobal('open', openMock)
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:Placeholder Location Event
DTSTART;TZID=America/Edmonton:20260917T191500
DTEND;TZID=America/Edmonton:20260917T204500
LOCATION:${location}
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

      const cell = wrapper.find('.board-location-cell')
      expect(cell.text()).toContain(location)
      expect(cell.attributes('role')).toBeUndefined()
      expect(cell.attributes('tabindex')).toBeUndefined()

      cell.element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(openMock).not.toHaveBeenCalled()
    },
  )
})
