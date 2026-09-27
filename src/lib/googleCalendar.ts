import ICAL from 'ical.js'

export type CalendarEvent = {
  title: string
  date: string
  time: string
  location: string
  description: string
  titleLink?: string
  url?: string
  highlight?: boolean
  startsAt: string
  endsAt?: string
}

const CALENDAR_TIME_ZONE = 'America/Edmonton'

const getZonedDateParts = (date: Date, timeZone: string) => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((part) => [part.type, part.value]),
  ) as Record<string, string>

  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    day: Number(parts.day),
    hour: parts.hour === '24' ? 0 : Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

const zonedTimeToUtc = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
) => {
  const localUtc = Date.UTC(year, month, day, hour, minute, second)
  const target = new Date(localUtc)
  const parts = getZonedDateParts(target, timeZone)

  const tzUtc = Date.UTC(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second)
  const offset = localUtc - tzUtc
  return new Date(localUtc + offset)
}

const dateOnlyToInstant = (value: string, timeZone: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return zonedTimeToUtc(year, month - 1, day, 0, 0, 0, timeZone)
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-CA', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    timeZone: CALENDAR_TIME_ZONE,
  }).format(new Date(value))

const formatTime = (start: string, end?: string) => {
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: CALENDAR_TIME_ZONE,
  })

  const startTime = timeFormatter.format(new Date(start))
  if (!end) return startTime
  const endTime = timeFormatter.format(new Date(end))
  return `${startTime} - ${endTime}`
}

export const mapGoogleCalendarFeedToEvents = (items: Array<any>): CalendarEvent[] => {
  return items.map((item) => {
    const title = item.summary ?? 'Untitled event'
    const isAllDay = !item.start?.dateTime
    const start = item.start?.dateTime ?? item.start?.date
    const end = item.end?.dateTime ?? item.end?.date
    const location = item.location ?? 'TBD'
    const description = item.description ?? ''
    const url = item.htmlLink ?? item.url

    const startInstant = isAllDay
      ? dateOnlyToInstant(start, CALENDAR_TIME_ZONE)
      : new Date(start)
    const endInstant = end
      ? isAllDay
        ? dateOnlyToInstant(end, CALENDAR_TIME_ZONE)
        : new Date(end)
      : undefined

    return {
      title,
      date: formatDate(startInstant.toISOString()),
      time: isAllDay ? 'All day' : formatTime(start, end),
      location,
      description,
      url,
      startsAt: startInstant.toISOString(),
      endsAt: endInstant?.toISOString(),
    }
  })
}

const stripHtmlTags = (value: string) => value.replace(/<[^>]*>/g, '')

const decodeHtmlEntities = (value: string) => value.replace(/&amp;/g, '&')

const extractUrlFromGoogleRedirect = (value: string) => {
  try {
    const parsed = new URL(value)
    const target = parsed.searchParams.get('q')
    return target ? decodeURIComponent(target) : value
  } catch {
    return value
  }
}

const extractUrl = (value: string) => {
  const htmlHref = value.match(/href="([^"]+)"/)?.[1]
  if (htmlHref) {
    return extractUrlFromGoogleRedirect(htmlHref)
  }

  const plainUrl = value.match(/https?:\/\/[^\s<>"')\]]+/)?.[0]
  if (!plainUrl) return undefined

  return extractUrlFromGoogleRedirect(plainUrl)
}

const stripUrlOnlyDescription = (value: string, url?: string) => {
  if (!url) return value
  const normalized = stripHtmlTags(value).trim()
  if (normalized === url) return ''
  if (normalized.replace(/\s+/g, ' ') === url) return ''
  return value
}

const MONTHS_OF_PAST_OCCURRENCES = 6
const MONTHS_OF_FUTURE_OCCURRENCES = 18

/**
 * Recurring series are expanded from DTSTART, so an unbounded rule that started
 * years ago would otherwise yield only stale occurrences. The iteration cap is
 * generous enough for a daily series running for decades, so the walk always
 * reaches the live window before giving up.
 */
const MAX_RECURRENCE_ITERATIONS = 20_000

/**
 * Past and future occurrences get separate budgets. A shared budget would let a
 * frequent series (a daily rule, say) spend the whole allowance on past dates
 * and surface no upcoming events at all.
 */
const MAX_PAST_OCCURRENCES_PER_SERIES = 12
const MAX_FUTURE_OCCURRENCES_PER_SERIES = 48

const addMonths = (date: Date, months: number) => {
  const shifted = new Date(date.getTime())
  shifted.setUTCMonth(shifted.getUTCMonth() + months)
  return shifted
}

const icalTimeToInstant = (time: ICAL.Time, fallbackTimeZone: string) => {
  const zone = time.zone?.tzid
  const timeZone = !zone || zone === 'floating' ? fallbackTimeZone : zone

  if (timeZone === 'UTC' || timeZone === 'Z') {
    return new Date(
      Date.UTC(time.year, time.month - 1, time.day, time.hour, time.minute, time.second),
    )
  }

  return zonedTimeToUtc(
    time.year,
    time.month - 1,
    time.day,
    time.hour,
    time.minute,
    time.second,
    timeZone,
  )
}

const DAY_MS = 86_400_000

const getTzid = (component: ICAL.Component, property: string) =>
  (component.getFirstProperty(property)?.getParameter('tzid') as string | undefined) ?? undefined

const isCancelled = (event: ICAL.Event) =>
  String(event.component.getFirstPropertyValue('status') ?? '').toUpperCase() === 'CANCELLED'

/**
 * Recurrence exceptions carry their own SUMMARY, LOCATION, DESCRIPTION, URL and
 * TZIDs, so metadata is always read from the occurrence's own event rather than
 * the series master.
 */
const occurrenceZones = (item: ICAL.Event, fallbackTimeZone: string) => {
  const startTimeZone = getTzid(item.component, 'dtstart') ?? fallbackTimeZone
  return {
    startTimeZone,
    endTimeZone: getTzid(item.component, 'dtend') ?? startTimeZone,
    hasEnd: Boolean(item.component.getFirstProperty('dtend')),
  }
}

const toCalendarEvent = (
  event: ICAL.Event,
  start: ICAL.Time,
  end: ICAL.Time | undefined,
  startTimeZone: string,
  endTimeZone: string,
): CalendarEvent => {
  const isAllDay = start.isDate
  const startInstant = icalTimeToInstant(start, startTimeZone)
  const endInstant = end ? icalTimeToInstant(end, endTimeZone) : undefined

  const rawDescription = decodeHtmlEntities(event.description ?? '')
  const explicitUrl = event.component.getFirstPropertyValue('url') as string | undefined
  const titleLink = explicitUrl ?? extractUrl(rawDescription)
  const description = stripUrlOnlyDescription(rawDescription, titleLink)

  return {
    title: event.summary ?? 'Untitled event',
    date: formatDate(startInstant.toISOString()),
    time:
      isAllDay || !endInstant
        ? 'All day'
        : formatTime(startInstant.toISOString(), endInstant.toISOString()),
    location: event.location ?? 'TBD',
    description,
    titleLink,
    url: titleLink,
    startsAt: startInstant.toISOString(),
    endsAt: endInstant?.toISOString(),
  }
}

export const parseGoogleCalendarIcs = (
  ics: string,
  { now = new Date() }: { now?: Date } = {},
): CalendarEvent[] => {
  if (!ics.trim()) return []

  const windowStart = addMonths(now, -MONTHS_OF_PAST_OCCURRENCES).getTime()
  const windowEnd = addMonths(now, MONTHS_OF_FUTURE_OCCURRENCES).getTime()

  let vCalendar: ICAL.Component
  try {
    vCalendar = new ICAL.Component(ICAL.parse(ics))
  } catch {
    return []
  }

  const vEvents = vCalendar.getAllSubcomponents('vevent')
  const masters: ICAL.Event[] = []
  const exceptions: ICAL.Event[] = []

  for (const vEvent of vEvents) {
    const event = new ICAL.Event(vEvent)
    if (event.isRecurrenceException()) {
      exceptions.push(event)
    } else {
      masters.push(event)
    }
  }

  for (const exception of exceptions) {
    for (const master of masters) {
      if (master.uid === exception.uid) {
        master.relateException(exception)
      }
    }
  }

  const events: CalendarEvent[] = []

  for (const event of masters) {
    if (!event.startDate) continue
    // A cancelled master means the event (or the whole series) was called off.
    if (isCancelled(event)) continue

    const startTimeZone = getTzid(event.component, 'dtstart') ?? CALENDAR_TIME_ZONE
    const endTimeZone = getTzid(event.component, 'dtend') ?? startTimeZone
    const hasEnd = Boolean(event.component.getFirstProperty('dtend'))

    if (!event.isRecurring()) {
      events.push(
        toCalendarEvent(
          event,
          event.startDate,
          hasEnd ? event.endDate : undefined,
          startTimeZone,
          endTimeZone,
        ),
      )
      continue
    }

    const iterator = event.iterator()
    const nowMs = now.getTime()
    const recentPast: ICAL.Time[] = []
    const upcoming: ICAL.Time[] = []

    for (let index = 0; index < MAX_RECURRENCE_ITERATIONS; index += 1) {
      if (upcoming.length >= MAX_FUTURE_OCCURRENCES_PER_SERIES) break

      const next = iterator.next()
      if (!next) break

      const approxStart = next.toUnixTime() * 1000
      if (approxStart > windowEnd + DAY_MS) break
      if (approxStart < windowStart - DAY_MS) continue

      const occurrenceStart = icalTimeToInstant(next, startTimeZone).getTime()

      if (occurrenceStart > windowEnd) break
      if (occurrenceStart < windowStart) continue

      if (occurrenceStart < nowMs) {
        recentPast.push(next)
        if (recentPast.length > MAX_PAST_OCCURRENCES_PER_SERIES) recentPast.shift()
      } else {
        upcoming.push(next)
      }
    }

    for (const occurrence of [...recentPast, ...upcoming]) {
      const details = event.getOccurrenceDetails(occurrence)
      const item = details.item ?? event

      // A cancelled exception means that single instance was called off.
      if (isCancelled(item)) continue

      const zones = occurrenceZones(item, startTimeZone)

      events.push(
        toCalendarEvent(
          item,
          details.startDate,
          zones.hasEnd ? details.endDate : undefined,
          zones.startTimeZone,
          zones.endTimeZone,
        ),
      )
    }
  }

  return events.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
}
