import galleryMetadata from '../assets/images/galleries/galleries.json'

export type GalleryImage = {
  src: string
  alt: string
  caption: string
}

export type GalleryGroup = {
  title: string
  description: string
  images: GalleryImage[]
}

export type GalleryImageMetadata = {
  alt?: string
  caption?: string
}

export type GalleryFolderMetadata = {
  title?: string
  description?: string
  images?: Record<string, GalleryImageMetadata>
}

export type GalleryMetadata = Record<string, GalleryFolderMetadata>

const metadataByFolder: GalleryMetadata =
  (galleryMetadata as { galleries?: GalleryMetadata }).galleries ?? {}

const imageModules = import.meta.glob('../assets/images/galleries/**/*.{jpg,jpeg,png,webp,gif}', {
  eager: true,
  import: 'default',
})

const GALLERIES_SEGMENT = 'galleries'

const humanize = (value: string) => value.replace(/[-_]+/g, ' ').trim()

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

  const fallbackAlt = (folder: string) => `Photo from the ${groupTitle(folder)} gallery`

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

      const images = orderedFileNames(folder, Object.keys(sources)).map((fileName) => {
        const imageMetadata = folderMetadata?.images?.[fileName]
        const caption = imageMetadata?.caption?.trim() ?? ''
        const alt = imageMetadata?.alt?.trim() || caption || fallbackAlt(folder)

        return { src: sources[fileName], alt, caption }
      })

      return {
        title: groupTitle(folder),
        description: folderMetadata?.description?.trim() ?? '',
        images,
      }
    })
    .filter((group) => group.images.length > 0)
    .sort((left, right) => left.title.localeCompare(right.title))
}

const sourcesByFolder = Object.entries(imageModules).reduce<Record<string, Record<string, string>>>(
  (groups, [path, src]) => {
    const { folder, fileName } = splitGalleryPath(path)
    if (!fileName) return groups

    groups[folder] ??= {}
    groups[folder][fileName] = src as string

    return groups
  },
  {},
)

export const galleryGroups: GalleryGroup[] = buildGalleryGroups(sourcesByFolder, metadataByFolder)
