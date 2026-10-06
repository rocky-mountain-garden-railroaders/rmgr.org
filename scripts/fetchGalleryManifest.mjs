import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const scriptsDir = new URL('.', import.meta.url).pathname
const outputPath = join(scriptsDir, '..', 'src', 'generated', 'galleryManifest.json')
const metadataPath = join(scriptsDir, '..', 'src', 'assets', 'images', 'galleries', 'galleries.json')

const DEFAULT_BUCKET = 'rmgr-photos'
const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|avif)$/i

/**
 * Groups bucket object names ("Folder/file.jpg") into galleries. Only objects exactly
 * one folder deep become gallery images; anything else is reported and skipped so a
 * stray upload cannot create a broken gallery.
 */
export const buildManifest = (objectNames) => {
  const galleries = {}
  const skipped = []

  for (const name of objectNames) {
    if (name.endsWith('/')) continue

    const segments = name.split('/')
    if (segments.length !== 2 || !segments[0] || !IMAGE_EXTENSION.test(segments[1])) {
      skipped.push(name)
      continue
    }

    const [folder, fileName] = segments
    ;(galleries[folder] ??= []).push(fileName)
  }

  for (const files of Object.values(galleries)) files.sort((a, b) => a.localeCompare(b))

  const sorted = Object.fromEntries(
    Object.entries(galleries).sort(([a], [b]) => a.localeCompare(b)),
  )

  return { manifest: { galleries: sorted }, skipped }
}

export const listBucketObjects = async ({ bucket, accessToken, fetchImpl = fetch }) => {
  const names = []
  let pageToken

  do {
    const url = new URL(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o`)
    url.searchParams.set('fields', 'items(name),nextPageToken')
    url.searchParams.set('maxResults', '1000')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(
        `Failed to list gs://${bucket}: ${response.status} ${response.statusText} ${body}`.trim(),
      )
    }

    const page = await response.json()
    for (const item of page.items ?? []) names.push(item.name)
    pageToken = page.nextPageToken
  } while (pageToken)

  return names
}

/** Metadata entries with no matching bucket object are almost always typos in galleries.json. */
export const findOrphanedMetadata = (manifest, metadata) => {
  const orphans = []
  for (const [folder, folderMetadata] of Object.entries(metadata)) {
    const files = new Set(manifest.galleries[folder] ?? [])
    for (const fileName of Object.keys(folderMetadata.images ?? {})) {
      if (!files.has(fileName)) orphans.push(`${folder}/${fileName}`)
    }
  }
  return orphans
}

const readMetadata = async (path) => {
  try {
    return JSON.parse(await readFile(path, 'utf-8')).galleries ?? {}
  } catch {
    return {}
  }
}

export const run = async ({
  bucket = process.env.GALLERY_BUCKET || DEFAULT_BUCKET,
  accessToken = process.env.GCS_ACCESS_TOKEN,
  outputPath: destPath = outputPath,
  metadataPath: sourceMetadataPath = metadataPath,
  fetchImpl,
} = {}) => {
  if (!accessToken) {
    throw new Error(
      'GCS_ACCESS_TOKEN is not set. In CI it comes from the Google auth step; locally run ' +
        '`GCS_ACCESS_TOKEN=$(gcloud auth print-access-token) npm run gallery:manifest`.',
    )
  }

  const names = await listBucketObjects({ bucket, accessToken, fetchImpl })
  const { manifest, skipped } = buildManifest(names)

  for (const name of skipped) {
    console.warn(`Skipping gs://${bucket}/${name}: gallery images must be "<folder>/<image>".`)
  }

  const imageCount = Object.values(manifest.galleries).reduce((total, files) => total + files.length, 0)
  // Publishing an empty manifest would silently wipe every gallery from the live site.
  if (imageCount === 0) {
    throw new Error(`No gallery images found in gs://${bucket}; refusing to publish an empty gallery.`)
  }

  for (const orphan of findOrphanedMetadata(manifest, await readMetadata(sourceMetadataPath))) {
    console.warn(`galleries.json lists "${orphan}" but it is not in gs://${bucket}.`)
  }

  await mkdir(dirname(destPath), { recursive: true })
  await writeFile(destPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8')
  console.log(
    `Wrote ${imageCount} images in ${Object.keys(manifest.galleries).length} galleries to ${destPath}`,
  )
}

const isMainModule = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href

if (isMainModule) {
  run().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
