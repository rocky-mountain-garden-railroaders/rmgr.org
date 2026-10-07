import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildManifest,
  findOrphanedMetadata,
  listBucketObjects,
  run,
} from './fetchGalleryManifest.mjs'

const jsonResponse = (body) => ({ ok: true, status: 200, statusText: 'OK', json: async () => body })

describe('buildManifest', () => {
  it('GIVEN folder/image objects WHEN building THEN they are grouped and sorted by folder and file', () => {
    const { manifest, skipped } = buildManifest([
      'Super Train 2025/b.jpg',
      'Super Train 2024/z.JPG',
      'Super Train 2025/a.png',
    ])

    expect(manifest).toEqual({
      galleries: {
        'Super Train 2024': ['z.JPG'],
        'Super Train 2025': ['a.png', 'b.jpg'],
      },
    })
    expect(skipped).toEqual([])
  })

  it('GIVEN folder placeholders, root files, nested paths and non-images WHEN building THEN they are left out', () => {
    const { manifest, skipped } = buildManifest([
      'Super Train 2024/',
      'loose.jpg',
      'Super Train 2024/raw/CS5_1317.jpg',
      'Super Train 2024/notes.txt',
      'Super Train 2024/keep.webp',
    ])

    expect(manifest).toEqual({ galleries: { 'Super Train 2024': ['keep.webp'] } })
    expect(skipped).toEqual([
      'loose.jpg',
      'Super Train 2024/raw/CS5_1317.jpg',
      'Super Train 2024/notes.txt',
    ])
  })
})

describe('listBucketObjects', () => {
  it('GIVEN a paginated listing WHEN listing THEN it follows every page with the bearer token', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ items: [{ name: 'A/1.jpg' }], nextPageToken: 'next' }))
      .mockResolvedValueOnce(jsonResponse({ items: [{ name: 'B/2.jpg' }] }))

    const names = await listBucketObjects({ bucket: 'rmgr-photos', accessToken: 'tok', fetchImpl })

    expect(names).toEqual(['A/1.jpg', 'B/2.jpg'])
    expect(fetchImpl).toHaveBeenCalledTimes(2)

    const [firstUrl, firstInit] = fetchImpl.mock.calls[0]
    expect(String(firstUrl)).toContain('/storage/v1/b/rmgr-photos/o?')
    expect(firstInit.headers.Authorization).toBe('Bearer tok')
    expect(fetchImpl.mock.calls[1][0].searchParams.get('pageToken')).toBe('next')
  })

  it('GIVEN an empty bucket page WHEN listing THEN it returns no names', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}))

    await expect(listBucketObjects({ bucket: 'b', accessToken: 't', fetchImpl })).resolves.toEqual([])
  })

  it('GIVEN a permission error WHEN listing THEN it throws with the status', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => 'missing storage.objects.list',
    })

    await expect(listBucketObjects({ bucket: 'b', accessToken: 't', fetchImpl })).rejects.toThrow(
      /403 Forbidden missing storage\.objects\.list/,
    )
  })
})

describe('findOrphanedMetadata', () => {
  it('GIVEN galleries.json entries missing from the bucket WHEN checking THEN they are reported', () => {
    expect(
      findOrphanedMetadata(
        { galleries: { Show: ['a.jpg'] } },
        { Show: { images: { 'a.jpg': {}, 'typo.jpg': {} } }, Gone: { images: { 'x.jpg': {} } } },
      ),
    ).toEqual(['Show/typo.jpg', 'Gone/x.jpg'])
  })
})

describe('run', () => {
  let dir

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'fetch-gallery-manifest-'))
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(dir, { recursive: true, force: true })
  })

  const options = (fetchImpl) => ({
    bucket: 'rmgr-photos',
    accessToken: 'tok',
    outputPath: join(dir, 'generated', 'galleryManifest.json'),
    metadataPath: join(dir, 'missing-galleries.json'),
    fetchImpl,
  })

  it('GIVEN a bucket with images WHEN run THEN it writes the manifest', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ items: [{ name: 'Show/a.jpg' }] }))
    const opts = options(fetchImpl)

    await run(opts)

    expect(JSON.parse(await readFile(opts.outputPath, 'utf-8'))).toEqual({
      galleries: { Show: ['a.jpg'] },
    })
  })

  it('GIVEN no access token WHEN run THEN it fails before calling the bucket', async () => {
    const fetchImpl = vi.fn()

    await expect(run({ ...options(fetchImpl), accessToken: '' })).rejects.toThrow(/GCS_ACCESS_TOKEN/)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('GIVEN a bucket with no gallery images WHEN run THEN it refuses to write an empty manifest', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ items: [{ name: 'readme.txt' }] }))
    const opts = options(fetchImpl)

    await expect(run(opts)).rejects.toThrow(/refusing to publish an empty gallery/)
    await expect(readFile(opts.outputPath, 'utf-8')).rejects.toThrow()
  })

  it('GIVEN galleries.json names a file the bucket lacks WHEN run THEN it warns about it', async () => {
    const metadataPath = join(dir, 'galleries.json')
    await writeFile(
      metadataPath,
      JSON.stringify({ galleries: { Show: { images: { 'typo.jpg': {} } } } }),
      'utf-8',
    )
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ items: [{ name: 'Show/a.jpg' }] }))

    await run({ ...options(fetchImpl), metadataPath })

    expect(console.warn).toHaveBeenCalledWith(
      'galleries.json lists "Show/typo.jpg" but it is not in gs://rmgr-photos.',
    )
  })
})
