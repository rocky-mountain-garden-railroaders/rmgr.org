import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchIcsWithRetries, run } from './fetchCalendarIcs.mjs'

const okResponse = (body) => ({ ok: true, status: 200, statusText: 'OK', text: async () => body })
const errorResponse = (status = 500, statusText = 'Server Error') => ({ ok: false, status, statusText })

describe('fetchIcsWithRetries', () => {
  it('GIVEN a successful fetch WHEN retrying THEN it returns the body on the first attempt', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse('BEGIN:VCALENDAR'))

    const ics = await fetchIcsWithRetries({ fetchImpl, sleepImpl: vi.fn() })

    expect(ics).toBe('BEGIN:VCALENDAR')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('GIVEN transient failures WHEN retrying THEN it succeeds within the attempt budget', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(okResponse('BEGIN:VCALENDAR'))
    const sleepImpl = vi.fn().mockResolvedValue(undefined)

    const ics = await fetchIcsWithRetries({ fetchImpl, sleepImpl, maxAttempts: 3 })

    expect(ics).toBe('BEGIN:VCALENDAR')
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
    const fetchImpl = vi.fn().mockResolvedValue(okResponse('FRESH-FEED'))

    await run({ outputPath, fetchImpl, sleepImpl: vi.fn() })

    await expect(readFile(outputPath, 'utf-8')).resolves.toBe('FRESH-FEED')
  })

  it('GIVEN the feed is unreachable WHEN run THEN it writes an empty feed instead of failing', async () => {
    const outputPath = join(dir, 'calendar-ics')
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'))

    await run({ outputPath, fetchImpl, sleepImpl: vi.fn(), maxAttempts: 2 })

    await expect(readFile(outputPath, 'utf-8')).resolves.toBe('')
  })
})
