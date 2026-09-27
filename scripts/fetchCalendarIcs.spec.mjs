import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchIcsWithRetries, isUsableIcs, run } from './fetchCalendarIcs.mjs'

const VALID_ICS = 'BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Meeting\nEND:VEVENT\nEND:VCALENDAR'
const CACHED_ICS = 'BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Cached\nEND:VEVENT\nEND:VCALENDAR'

const okResponse = (body) => ({ ok: true, status: 200, statusText: 'OK', text: async () => body })
const errorResponse = (status = 500, statusText = 'Server Error') => ({ ok: false, status, statusText })

describe('fetchIcsWithRetries', () => {
  it('GIVEN a successful fetch WHEN retrying THEN it returns the body on the first attempt', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse(VALID_ICS))

    const ics = await fetchIcsWithRetries({ fetchImpl, sleepImpl: vi.fn() })

    expect(ics).toBe(VALID_ICS)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('GIVEN transient failures WHEN retrying THEN it succeeds within the attempt budget', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(okResponse(VALID_ICS))
    const sleepImpl = vi.fn().mockResolvedValue(undefined)

    const ics = await fetchIcsWithRetries({ fetchImpl, sleepImpl, maxAttempts: 3 })

    expect(ics).toBe(VALID_ICS)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(sleepImpl).toHaveBeenCalledTimes(1)
  })

  it('GIVEN a non-2xx response on every attempt WHEN retrying THEN it exhausts attempts and throws', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(errorResponse(503, 'Unavailable'))
    const sleepImpl = vi.fn().mockResolvedValue(undefined)

    await expect(fetchIcsWithRetries({ fetchImpl, sleepImpl, maxAttempts: 3 })).rejects.toThrow(
      'Failed to fetch calendar ICS feed: 503 Unavailable',
    )
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    expect(sleepImpl).toHaveBeenCalledTimes(2)
  })
})

describe('run', () => {
  let dir

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'fetch-calendar-ics-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('GIVEN a reachable feed WHEN run THEN it writes the output', async () => {
    const outputPath = join(dir, 'nested', 'calendar-ics')
    const fetchImpl = vi.fn().mockResolvedValue(okResponse(VALID_ICS))

    await run({ outputPath, fetchImpl, sleepImpl: vi.fn() })

    await expect(readFile(outputPath, 'utf-8')).resolves.toBe(VALID_ICS)
  })

  it('GIVEN the feed is unreachable AND a cached feed exists WHEN run THEN it preserves the cached feed', async () => {
    const outputPath = join(dir, 'calendar-ics')
    await writeFile(outputPath, CACHED_ICS, 'utf-8')
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))

    await run({ outputPath, fetchImpl, sleepImpl: vi.fn(), maxAttempts: 2 })

    await expect(readFile(outputPath, 'utf-8')).resolves.toBe(CACHED_ICS)
  })

  it('GIVEN the feed is unreachable AND no cached feed exists WHEN run THEN it fails instead of publishing an empty calendar', async () => {
    const outputPath = join(dir, 'calendar-ics')
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))

    await expect(run({ outputPath, fetchImpl, sleepImpl: vi.fn(), maxAttempts: 2 })).rejects.toThrow(
      /Refusing to publish an empty calendar/,
    )

    await expect(readFile(outputPath, 'utf-8')).rejects.toThrow()
  })

  it('GIVEN an empty cached feed WHEN the fetch fails THEN it fails rather than keeping the empty file', async () => {
    const outputPath = join(dir, 'calendar-ics')
    await writeFile(outputPath, '', 'utf-8')
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))

    await expect(run({ outputPath, fetchImpl, sleepImpl: vi.fn(), maxAttempts: 2 })).rejects.toThrow(
      /Refusing to publish an empty calendar/,
    )
  })

  it('GIVEN the feed returns 200 with an error page WHEN run THEN it does not overwrite the cached feed', async () => {
    const outputPath = join(dir, 'calendar-ics')
    await writeFile(outputPath, CACHED_ICS, 'utf-8')
    const fetchImpl = vi.fn().mockResolvedValue(okResponse('<html>Service unavailable</html>'))

    await run({ outputPath, fetchImpl, sleepImpl: vi.fn(), maxAttempts: 2 })

    await expect(readFile(outputPath, 'utf-8')).resolves.toBe(CACHED_ICS)
  })
})

describe('isUsableIcs', () => {
  it.each([
    { label: 'a full calendar', input: VALID_ICS, expected: true },
    { label: 'an empty string', input: '', expected: false },
    { label: 'an HTML error page', input: '<html>Service unavailable</html>', expected: false },
    { label: 'a truncated calendar', input: 'BEGIN:VCALENDAR\nBEGIN:VEVENT', expected: false },
    { label: 'a null value', input: null, expected: false },
  ])('GIVEN $label WHEN validating THEN it reports usable=$expected', ({ input, expected }) => {
    expect(isUsableIcs(input)).toBe(expected)
  })
})
