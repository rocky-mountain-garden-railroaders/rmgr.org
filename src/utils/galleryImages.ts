import galleryMetadata from '../assets/images/galleries/galleries.json'

type GalleryMediaDetails = {
  src: string
  fileName: string
  alt: string
  caption: string
}

export type GalleryImage = GalleryMediaDetails & { kind: 'image' }
export type GalleryVideo = GalleryMediaDetails & { kind: 'video' }
export type GalleryMedia = GalleryImage | GalleryVideo

export type GalleryGroup = {
  title: string
  description: string
  media: GalleryMedia[]
  cover?: GalleryImage
}

export type GalleryImageMetadata = {
  alt?: string
  caption?: string
}

export type GalleryFolderMetadata = {
  title?: string
  description?: string
  /** Display priority in the gallery list: higher numbers are listed first. */
  order?: number
  images?: Record<string, GalleryImageMetadata>
}

export type GalleryMetadata = Record<string, GalleryFolderMetadata>

const metadataByFolder: GalleryMetadata =
  (galleryMetadata as { galleries?: GalleryMetadata }).galleries ?? {}

const mediaModules = import.meta.glob(
  '../assets/images/galleries/**/*.{jpg,jpeg,png,webp,gif,[mM][pP]4}',
  {
    eager: true,
    import: 'default',
    // Import URLs only, including for small photos that Vite would otherwise inline.
    query: '?url&no-inline',
  },
)

const GALLERIES_SEGMENT = 'galleries'

const humanize = (value: string) => value.replace(/[-_]+/g, ' ').trim()

// Galleries without a valid order sort after every numbered gallery.
const galleryOrder = (metadata?: GalleryFolderMetadata) => {
  const order = metadata?.order
  return typeof order === 'number' && Number.isFinite(order) ? order : Number.NEGATIVE_INFINITY
}

export const splitGalleryPath = (path: string) => {
  const parts = path.split('/').filter((part) => part && part !== '.' && part !== '..')
  const galleriesIndex = parts.lastIndexOf(GALLERIES_SEGMENT)
  const relative = galleriesIndex === -1 ? parts : parts.slice(galleriesIndex + 1)

  return {
    folder: relative.length > 1 ? relative[0] : 'uncategorized',
    fileName: relative[relative.length - 1] ?? '',
  }
}

export const buildGalleryGroups = (
  sourcesByFolder: Record<string, Record<string, string>>,
  metadata: GalleryMetadata = {},
): GalleryGroup[] => {
  const groupTitle = (folder: string) => metadata[folder]?.title?.trim() || humanize(folder)

  const isVideo = (fileName: string) => /\.mp4$/i.test(fileName)

  const orderedFileNames = (folder: string, fileNames: string[]) => {
    const curatedRank = new Map(
      Object.keys(metadata[folder]?.images ?? {}).map((name, index) => [name, index]),
    )

    return [...fileNames].sort((left, right) => {
      const leftRank = curatedRank.get(left)
      const rightRank = curatedRank.get(right)

      if (leftRank !== undefined && rightRank !== undefined) return leftRank - rightRank
      if (leftRank !== undefined) return -1
      if (rightRank !== undefined) return 1
      return left.localeCompare(right)
    })
  }

  return Object.entries(sourcesByFolder)
    .map(([folder, sources]) => {
      const folderMetadata = metadata[folder]

      // Keep every photo in its curated order; append videos without displacing the cover.
      const fileNames = orderedFileNames(folder, Object.keys(sources))
      const orderedMedia = [
        ...fileNames.filter((name) => !isVideo(name)),
        ...fileNames.filter(isVideo),
      ]
      const media = orderedMedia.map((fileName): GalleryMedia => {
        const kind = isVideo(fileName) ? 'video' : 'image'
        const imageMetadata = folderMetadata?.images?.[fileName]
        const caption = imageMetadata?.caption?.trim() ?? ''
        const alt =
          imageMetadata?.alt?.trim() ||
          caption ||
          `${kind === 'video' ? 'Video' : 'Photo'} from the ${groupTitle(folder)} gallery`

        return { kind, src: sources[fileName], fileName, alt, caption }
      })

      return {
        group: {
          title: groupTitle(folder),
          description: folderMetadata?.description?.trim() ?? '',
          media,
          cover: media.find((item): item is GalleryImage => item.kind === 'image'),
        },
        order: galleryOrder(folderMetadata),
      }
    })
    .filter(({ group }) => group.media.length > 0)
    .sort((left, right) => {
      if (left.order !== right.order) return left.order < right.order ? 1 : -1
      return left.group.title.localeCompare(right.group.title)
    })
    .map(({ group }) => group)
}

const sourcesByFolder = Object.entries(mediaModules).reduce<Record<string, Record<string, string>>>(
  (groups, [path, src]) => {
    const { folder, fileName } = splitGalleryPath(path)
    if (!fileName || !Object.prototype.hasOwnProperty.call(metadataByFolder, folder)) return groups

    groups[folder] ??= {}
    groups[folder][fileName] = src as string

    return groups
  },
  {},
)

export const galleryGroups: GalleryGroup[] = buildGalleryGroups(sourcesByFolder, metadataByFolder)
