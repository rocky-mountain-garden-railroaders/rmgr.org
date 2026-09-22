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

const parseIcsDate = (value: string, timeZone?: string) => {
  const parsed = value.trim()
  const compact = parsed.replace(/Z$/, '').replace(/^.*:/, '')

  if (/^\d{8}$/.test(compact)) {
    const year = Number(compact.slice(0, 4))
    const month = Number(compact.slice(4, 6)) - 1
    const day = Number(compact.slice(6, 8))
    return zonedTimeToUtc(year, month, day, 0, 0, 0, timeZone ?? CALENDAR_TIME_ZONE)
  }

  const year = Number(compact.slice(0, 4))
  const month = Number(compact.slice(4, 6)) - 1
  const day = Number(compact.slice(6, 8))
  const hour = Number(compact.slice(9, 11))
  const minute = Number(compact.slice(11, 13))
  const second = Number(compact.slice(13, 15))

  if (timeZone && !parsed.endsWith('Z')) {
    return zonedTimeToUtc(year, month, day, hour, minute, second, timeZone)
  }

  return new Date(Date.UTC(year, month, day, hour, minute, second))
}

const unfoldIcs = (ics: string) => ics.replace(/\r?\n[ \t]/g, '')

const decodeIcsValue = (value: string) =>
  value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .replace(/&amp;/g, '&')

const stripHtmlTags = (value: string) => value.replace(/<[^>]*>/g, '')

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

const parseRrule = (value?: string) => {
  if (!value) return null

  const parts = Object.fromEntries(
    value.split(';').map((part) => {
      const [key, rawValue] = part.split('=')
      return [key, rawValue]
    }),
  ) as Record<string, string | undefined>

  if (parts.FREQ !== 'MONTHLY' || parts.BYDAY !== '3TH') {
    return null
  }

  return { ordinal: 3, weekday: 4 }
}

const nthWeekdayOfMonth = (year: number, month: number, ordinal: number, weekday: number) => {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const offset = (weekday - firstWeekday + 7) % 7
  return 1 + offset + (ordinal - 1) * 7
}

const expandMonthlyByDayOccurrences = (
  start: Date,
  end: Date | undefined,
  rule: { ordinal: number; weekday: number },
  startTimeZone: string,
  endTimeZone: string,
  count: number,
) => {
  const startParts = getZonedDateParts(start, startTimeZone)
  const endParts = end ? getZonedDateParts(end, endTimeZone) : undefined
  const dayDelta = endParts
    ? Math.round(
        (Date.UTC(endParts.year, endParts.month, endParts.day) -
          Date.UTC(startParts.year, startParts.month, startParts.day)) /
          86_400_000,
      )
    : 0

  return Array.from({ length: count }, (_, index) => {
    const totalMonths = startParts.month + index
    const occurrenceYear = startParts.year + Math.floor(totalMonths / 12)
    const occurrenceMonth = ((totalMonths % 12) + 12) % 12
    const day = nthWeekdayOfMonth(occurrenceYear, occurrenceMonth, rule.ordinal, rule.weekday)

    const occurrenceStart = zonedTimeToUtc(
      occurrenceYear,
      occurrenceMonth,
      day,
      startParts.hour,
      startParts.minute,
      startParts.second,
      startTimeZone,
    )

    const occurrenceEnd = endParts
      ? zonedTimeToUtc(
          occurrenceYear,
          occurrenceMonth,
          day + dayDelta,
          endParts.hour,
          endParts.minute,
          endParts.second,
          endTimeZone,
        )
      : undefined

    return { start: occurrenceStart, end: occurrenceEnd }
  })
}

export const parseGoogleCalendarIcs = (ics: string): CalendarEvent[] => {
  const lines = unfoldIcs(ics).split(/\r?\n/)
  const events: CalendarEvent[] = []
  let current: Record<string, string> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {}
      continue
    }

    if (line === 'END:VEVENT') {
      if (current?.DTSTART) {
        const startValue = current.DTSTART
        const endValue = current.DTEND
        const isAllDay = /^\d{8}$/.test(startValue)
        const startTimeZone = current.DTSTART_TZID ?? (isAllDay ? CALENDAR_TIME_ZONE : 'UTC')
        const endTimeZone = current.DTEND_TZID ?? startTimeZone
        const start = parseIcsDate(startValue, current.DTSTART_TZID)
        const end = endValue ? parseIcsDate(endValue, current.DTEND_TZID) : undefined
        const rule = parseRrule(current.RRULE)
        const occurrences = rule
          ? expandMonthlyByDayOccurrences(start, end, rule, startTimeZone, endTimeZone, 12)
          : [{ start, end }]

        for (const occurrence of occurrences) {
          const rawDescription = decodeIcsValue(current.DESCRIPTION ?? '')
          const titleLink = current.URL ?? extractUrl(rawDescription)
          const description = stripUrlOnlyDescription(rawDescription, titleLink)
          events.push({
            title: current.SUMMARY ?? 'Untitled event',
            date: formatDate(occurrence.start.toISOString()),
            time:
              isAllDay || !occurrence.end
                ? 'All day'
                : formatTime(occurrence.start.toISOString(), occurrence.end.toISOString()),
            location: current.LOCATION ?? 'TBD',
            description,
            titleLink,
            url: current.URL ?? titleLink,
            startsAt: occurrence.start.toISOString(),
            endsAt: occurrence.end?.toISOString(),
          })
        }
      }
      current = null
      continue
    }

    if (!current) continue

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex)
    const value = decodeIcsValue(line.slice(colonIndex + 1).trim())
    const [normalizedKey, ...params] = key.split(';')
    const tzidParam = params.find((param) => param.startsWith('TZID='))
    if (tzidParam && (normalizedKey === 'DTSTART' || normalizedKey === 'DTEND')) {
      current[`${normalizedKey}_TZID`] = tzidParam.replace('TZID=', '')
    }
    current[normalizedKey] = value
  }

  return events.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
}
