import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { CALENDAR_ICS_URL } from '../calendarSource.mjs'

const scriptsDir = new URL('.', import.meta.url).pathname
const outputPath = join(scriptsDir, '..', 'public', 'calendar-ics')

const MAX_ATTEMPTS = 3
const TIMEOUT_MS = 10_000
const RETRY_DELAY_MS = 2_000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
    return await response.text()
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
    console.error(`Calendar feed unavailable; writing an empty feed: ${error.message}`)
    await writeFile(destPath, '', 'utf-8')
  }
}

const isMainModule = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href

if (isMainModule) {
  run().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
