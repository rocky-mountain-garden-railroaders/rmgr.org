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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-CA', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value))

const formatTime = (start: string, end?: string) => {
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const startTime = timeFormatter.format(new Date(start))
  if (!end) return startTime
  const endTime = timeFormatter.format(new Date(end))
  return `${startTime} - ${endTime}`
}

export const mapGoogleCalendarFeedToEvents = (items: Array<any>): CalendarEvent[] => {
  return items.map((item) => {
    const title = item.summary ?? 'Untitled event'
    const start = item.start?.dateTime ?? item.start?.date
    const end = item.end?.dateTime ?? item.end?.date
    const location = item.location ?? 'TBD'
    const description = item.description ?? ''
    const url = item.htmlLink ?? item.url

    return {
      title,
      date: formatDate(start),
      time: item.start?.dateTime ? formatTime(start, end) : 'All day',
      location,
      description,
      url,
      startsAt: new Date(start).toISOString(),
      endsAt: end ? new Date(end).toISOString() : undefined,
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
    return new Date(Date.UTC(year, month, day))
  }

  const year = Number(compact.slice(0, 4))
  const month = Number(compact.slice(4, 6)) - 1
  const day = Number(compact.slice(6, 8))
  const hour = Number(compact.slice(9, 11))
  const minute = Number(compact.slice(11, 13))
  const second = Number(compact.slice(13, 15))

  if (timeZone && !parsed.endsWith('Z')) {
    const localIso = `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}T${compact.slice(9, 11)}:${compact.slice(11, 13)}:${compact.slice(13, 15)}`
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

    const target = new Date(localIso)
    const parts = Object.fromEntries(
      dtf.formatToParts(target).map((part) => [part.type, part.value]),
    ) as Record<string, string>

    const tzUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    )
    const localUtc = Date.UTC(year, month, day, hour, minute, second)
    const offset = localUtc - tzUtc
    return new Date(localUtc + offset)
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

  return true
}

const addMonths = (value: Date, months: number) => {
  const copy = new Date(value.getTime())
  copy.setMonth(copy.getMonth() + months)
  return copy
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
        const start = parseIcsDate(startValue, current.DTSTART_TZID)
        const end = endValue ? parseIcsDate(endValue, current.DTEND_TZID) : undefined
        const occurrences = parseRrule(current.RRULE)
          ? Array.from({ length: 12 }, (_, index) => ({
              start: addMonths(start, index),
              end: end ? addMonths(end, index) : undefined,
            }))
          : [{ start, end }]

        for (const occurrence of occurrences) {
          const rawDescription = decodeIcsValue(current.DESCRIPTION ?? '')
          const titleLink = current.URL ?? extractUrl(rawDescription)
          const description = stripUrlOnlyDescription(rawDescription, titleLink)
          events.push({
            title: current.SUMMARY ?? 'Untitled event',
            date: formatDate(occurrence.start.toISOString()),
            time: occurrence.end
              ? formatTime(occurrence.start.toISOString(), occurrence.end.toISOString())
              : 'All day',
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
