export type GalleryImage = {
  src: string
  alt: string
  caption: string
}

export type GalleryGroup = {
  title: string
  images: GalleryImage[]
}

const imageModules = import.meta.glob('../assets/images/galleries/**/*.{jpg,jpeg,png,webp,gif}', {
  eager: true,
  import: 'default',
})

const humanize = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())

const fileLabel = (path: string) => {
  const parts = path.split('/').filter(Boolean)
  const fileName = parts[parts.length - 1] ?? ''
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
}

const folderLabel = (path: string) => {
  const parts = path.split('/').filter(Boolean)
  return parts[4] ?? 'uncategorized'
}

const groupedImages = Object.entries(imageModules).reduce<Record<string, GalleryImage[]>>((groups, [path, src]) => {
  const title = fileLabel(path)
  const folder = folderLabel(path)

  if (!groups[folder]) groups[folder] = []
  groups[folder].push({
    src: src as string,
    alt: title || 'Gallery image',
    caption: title || 'Gallery image',
  })

  return groups
}, {})

export const galleryGroups: GalleryGroup[] = Object.entries(groupedImages)
  .map(([folderName, images]) => ({
    title: humanize(folderName),
    images,
  }))
  .sort((left, right) => left.title.localeCompare(right.title))
