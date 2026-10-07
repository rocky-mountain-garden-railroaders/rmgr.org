import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { CALENDAR_ICS_URL } from '../calendarSource.mjs'

const scriptsDir = new URL('.', import.meta.url).pathname
const outputPath = join(scriptsDir, '..', 'public', 'calendar-ics')

const MAX_ATTEMPTS = 3
const TIMEOUT_MS = 10_000
const RETRY_DELAY_MS = 2_000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const CALENDAR_WITH_EVENT =
  /^BEGIN:VCALENDAR\r?$[\s\S]*?^BEGIN:VEVENT\r?$[\s\S]*?^END:VEVENT\r?$[\s\S]*?^END:VCALENDAR\r?$/m

export const isUsableIcs = (ics) => typeof ics === 'string' && CALENDAR_WITH_EVENT.test(ics)

export const fetchIcs = async ({
  url = CALENDAR_ICS_URL,
  fetchImpl = fetch,
  timeoutMs = TIMEOUT_MS,
} = {}) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar ICS feed: ${response.status} ${response.statusText}`)
    }

    const ics = await response.text()
    if (!isUsableIcs(ics)) {
      throw new Error(
        `Calendar ICS feed did not contain a VCALENDAR with at least one VEVENT (received ${ics.length} bytes)`,
      )
    }

    return ics
  } finally {
    clearTimeout(timeout)
  }
}

export const fetchIcsWithRetries = async ({
  maxAttempts = MAX_ATTEMPTS,
  retryDelayMs = RETRY_DELAY_MS,
  sleepImpl = sleep,
  ...fetchOptions
} = {}) => {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchIcs(fetchOptions)
    } catch (error) {
      lastError = error
      console.warn(`Attempt ${attempt}/${maxAttempts} to fetch calendar ICS feed failed: ${error.message}`)
      if (attempt < maxAttempts) await sleepImpl(retryDelayMs * attempt)
    }
  }
  throw lastError
}

const readExistingFeed = async (destPath) => {
  try {
    return await readFile(destPath, 'utf-8')
  } catch {
    return null
  }
}

export const run = async ({
  outputPath: destPath = outputPath,
  ...retryOptions
} = {}) => {
  await mkdir(dirname(destPath), { recursive: true })

  try {
    const ics = await fetchIcsWithRetries(retryOptions)
    await writeFile(destPath, ics, 'utf-8')
    console.log(`Wrote calendar ICS feed to ${destPath}`)
  } catch (error) {
    const existing = await readExistingFeed(destPath)

    if (isUsableIcs(existing)) {
      console.warn(
        `Calendar feed unavailable (${error.message}); keeping the existing feed at ${destPath}.`,
      )
      return
    }

    throw new Error(
      `Calendar feed unavailable and no usable cached feed exists at ${destPath}. ` +
        `Refusing to publish an empty calendar. Cause: ${error.message}`,
      { cause: error },
    )
  }
}

const isMainModule = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href

if (isMainModule) {
  run().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
