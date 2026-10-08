import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SplitFlapEventsList from '@/components/SplitFlapEventsList.vue'
import EventsList from '@/components/EventsList.vue'
import type { CalendarEvent } from '@/lib/googleCalendar'

enableAutoUnmount(afterEach)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const event: CalendarEvent = {
  title: 'Monthly Meeting',
  date: 'September 17, 2026',
  time: '7:15 PM - 8:45 PM',
  location: '2715 Dovely Park SE, Calgary',
  description: 'Meet fellow railroaders.',
  url: 'https://example.com/details',
  startsAt: '2026-09-18T01:15:00Z',
}
const now = Date.parse('2026-09-17T22:00:00Z')

describe.each([
  ['board', SplitFlapEventsList],
  ['list', EventsList],
] as const)('%s event view', (_name, component) => {
  it('renders supplied events and updates when props change', async () => {
    const wrapper = mount(component, { props: { events: [event], showPastEvents: false, now } })
    expect(wrapper.find('section').attributes('aria-label')).toBe('Upcoming Events')
    expect(wrapper.find('h3').text()).toBe(event.title)
    expect(wrapper.text()).toContain(event.date)
    expect(wrapper.text()).toContain(event.time)
    expect(wrapper.text()).toContain(event.location)
    expect(wrapper.text()).toContain(event.description)
    const link = wrapper.find('a.event-card')
    expect(link.attributes('href')).toBe(event.url)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')

    await wrapper.setProps({
      events: [{ ...event, title: 'Previous Meeting', url: undefined, description: '' }],
      showPastEvents: true,
    })
    expect(wrapper.find('section').attributes('aria-label')).toBe('Past Events')
    expect(wrapper.find('h3').text()).toBe('Previous Meeting')
    expect(wrapper.find('a.event-card').exists()).toBe(false)
    expect(wrapper.text()).not.toContain(event.description)

    await wrapper.setProps({ events: [] })
    expect(wrapper.text()).toContain('No past events to show.')
    expect(wrapper.find('.event-card').exists()).toBe(false)
    await wrapper.setProps({ showPastEvents: false })
    expect(wrapper.text()).toContain('No upcoming events scheduled right now.')
  })

  it.each([true, false])(
    'opens Maps independently of an event link (linked: %s)',
    async (linked) => {
      const openMock = vi.fn()
      vi.stubGlobal('open', openMock)
      const wrapper = mount(component, {
        props: {
          events: [{ ...event, url: linked ? event.url : undefined }],
          showPastEvents: false,
          now,
        },
      })
      const rowClick = vi.fn()
      wrapper.find('.event-card').element.addEventListener('click', rowClick)
      const location = wrapper.find('[role="link"]')
      expect(location.attributes('tabindex')).toBe('0')
      expect(location.attributes('aria-label')).toBe(`Open ${event.location} in Google Maps`)
      const click = new MouseEvent('click', { bubbles: true, cancelable: true })
      location.element.dispatchEvent(click)
      await location.trigger('keydown', { key: 'Enter' })
      expect(click.defaultPrevented).toBe(true)
      expect(rowClick).not.toHaveBeenCalled()
      expect(openMock).toHaveBeenCalledTimes(2)
      expect(openMock).toHaveBeenCalledWith(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`,
        '_blank',
        'noopener,noreferrer',
      )
    },
  )

  it.each(['', 'Online', 'TBD', 'Zoom', 'https://example.com/meeting'])(
    'does not offer Maps for location "%s"',
    (location) => {
      const wrapper = mount(component, {
        props: { events: [{ ...event, location }], showPastEvents: false, now },
      })
      expect(wrapper.find('[role="link"]').exists()).toBe(false)
      if (location) expect(wrapper.text()).toContain(location)
    },
  )

  it('allows text selection without opening event or Maps links', () => {
    const openMock = vi.fn()
    vi.stubGlobal('open', openMock)
    const wrapper = mount(component, {
      props: { events: [event], showPastEvents: false, now },
      attachTo: document.body,
    })
    const selection = window.getSelection()!
    const range = document.createRange()
    range.selectNodeContents(wrapper.find('h3').element)
    selection.addRange(range)
    const containsNode = vi.spyOn(selection, 'containsNode').mockReturnValue(true)

    try {
      const click = new MouseEvent('click', { bubbles: true, cancelable: true })
      wrapper.find('a.event-card').element.dispatchEvent(click)
      expect(click.defaultPrevented).toBe(true)
      expect(containsNode).toHaveBeenCalledWith(wrapper.find('a.event-card').element, true)
      wrapper
        .find('[role="link"]')
        .element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      expect(openMock).not.toHaveBeenCalled()
    } finally {
      selection.removeAllRanges()
    }
  })
})

describe('SplitFlapEventsList', () => {
  it('owns its board layout and spacing', () => {
    const wrapper = mount(SplitFlapEventsList, {
      props: { events: [], showPastEvents: false, now },
    })
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['bg-primary', 'pa-2', 'pa-sm-8', 'rounded-b-lg']),
    )
    expect(wrapper.attributes('cols')).toBe('12')
  })

  it('updates the clock, board heading, and ticker from props', async () => {
    const wrapper = mount(SplitFlapEventsList, {
      props: { events: [event], showPastEvents: false, now },
    })

    expect(wrapper.find('.board-clock').text()).toBe('16:00')
    expect(wrapper.find('.board-name').text()).toBe('Departures')
    expect(wrapper.find('.board-ticker-track').text()).toContain(event.title)
    expect(wrapper.find('.board-ticker-static').text()).toContain('Welcome aboard')

    await wrapper.setProps({
      now: now + 60_000,
      showPastEvents: true,
      events: [{ ...event, title: 'Previous Meeting' }],
    })
    expect(wrapper.find('.board-clock').text()).toBe('16:01')
    expect(wrapper.find('.board-name').text()).toBe('Arrivals')
    expect(wrapper.find('.board-ticker-track').text()).toContain('Previous Meeting')
    expect(wrapper.find('.board-ticker-track').text()).not.toContain(event.title)
    expect(wrapper.find('.board-ticker-static').text()).toContain('Thanks for riding')
  })
})

describe('EventsList', () => {
  it('owns its list layout and spacing', () => {
    const wrapper = mount(EventsList, {
      props: { events: [], showPastEvents: false },
    })
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['bg-primary', 'pa-6', 'pa-sm-12', 'rounded-b-lg']),
    )
    expect(wrapper.attributes('cols')).toBe('12')
  })
})
