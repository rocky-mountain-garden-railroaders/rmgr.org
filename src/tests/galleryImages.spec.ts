import { describe, expect, it } from 'vitest'
import galleryMetadata from '../assets/images/galleries/galleries.json'
import {
  buildGalleryGroups,
  galleryGroups,
  splitGalleryPath,
  type GalleryMetadata,
} from '@/utils/galleryImages'

const sources = {
  'Supertrain 2024': {
    'CS5_1317-CR3_DxO_DeepPRIME.jpg': '/st24-a.jpg',
    'CS5_1328-CR3_DxO_DeepPRIME.jpg': '/st24-b.jpg',
  },
}

describe('splitGalleryPath', () => {
  it('GIVEN a glob path WHEN splitting THEN it returns the gallery folder and file name', () => {
    expect(splitGalleryPath('../assets/images/galleries/Supertrain 2024/CS5_1317.jpg')).toEqual({
      folder: 'Supertrain 2024',
      fileName: 'CS5_1317.jpg',
    })
  })

  it('GIVEN an image directly under galleries WHEN splitting THEN it is uncategorized', () => {
    expect(splitGalleryPath('../assets/images/galleries/loose.jpg')).toEqual({
      folder: 'uncategorized',
      fileName: 'loose.jpg',
    })
  })
})

describe('buildGalleryGroups', () => {
  it('GIVEN curated metadata WHEN building THEN it uses the curated title, description, alt and caption', () => {
    const metadata: GalleryMetadata = {
      'Supertrain 2024': {
        title: 'Supertrain 2024 Showcase',
        description: 'Our booth at the annual show.',
        images: {
          'CS5_1317-CR3_DxO_DeepPRIME.jpg': {
            alt: 'Club members operating the modular layout',
            caption: 'Volunteers running trains for the crowd.',
          },
        },
      },
    }

    const [group] = buildGalleryGroups(sources, metadata)

    expect(group.title).toBe('Supertrain 2024 Showcase')
    expect(group.description).toBe('Our booth at the annual show.')
    expect(group.images[0]).toEqual({
      src: '/st24-a.jpg',
      alt: 'Club members operating the modular layout',
      caption: 'Volunteers running trains for the crowd.',
    })
  })

  it('GIVEN no metadata WHEN building THEN alt falls back to the gallery name rather than the camera filename', () => {
    const [group] = buildGalleryGroups(sources)

    expect(group.images.map((image) => image.alt)).toEqual([
      'Photo from the Supertrain 2024 gallery',
      'Photo from the Supertrain 2024 gallery',
    ])
    expect(group.images.every((image) => !image.alt.includes('CS5'))).toBe(true)
  })

  it('GIVEN an empty alt but a caption WHEN building THEN the caption is reused as alt text', () => {
    const [group] = buildGalleryGroups(sources, {
      'Supertrain 2024': {
        images: {
          'CS5_1317-CR3_DxO_DeepPRIME.jpg': { alt: '   ', caption: 'A live steam 4-6-2 at speed.' },
        },
      },
    })

    expect(group.images[0].alt).toBe('A live steam 4-6-2 at speed.')
  })

  it('GIVEN missing captions WHEN building THEN the caption is empty so the view can hide it', () => {
    const [group] = buildGalleryGroups(sources, {
      'Supertrain 2024': { images: { 'CS5_1317-CR3_DxO_DeepPRIME.jpg': { alt: 'Curated alt' } } },
    })

    expect(group.images.map((image) => image.caption)).toEqual(['', ''])
  })

  it('GIVEN blank metadata strings WHEN building THEN it falls back instead of rendering whitespace', () => {
    const [group] = buildGalleryGroups(sources, {
      'Supertrain 2024': { title: '  ', description: '  ' },
    })

    expect(group.title).toBe('Supertrain 2024')
    expect(group.description).toBe('')
  })

  it('GIVEN metadata listing images WHEN building THEN curated order wins and unlisted files follow alphabetically', () => {
    const [group] = buildGalleryGroups(
      {
        'Supertrain 2024': {
          'b.jpg': '/b.jpg',
          'a.jpg': '/a.jpg',
          'zz.jpg': '/zz.jpg',
        },
      },
      { 'Supertrain 2024': { images: { 'zz.jpg': {}, 'b.jpg': {} } } },
    )

    expect(group.images.map((image) => image.src)).toEqual(['/zz.jpg', '/b.jpg', '/a.jpg'])
  })

  it('GIVEN a folder with no images WHEN building THEN it is omitted', () => {
    expect(buildGalleryGroups({ 'Supertrain 2026': {} })).toEqual([])
  })

  it('GIVEN several folders WHEN building THEN groups are sorted by title', () => {
    const groups = buildGalleryGroups({
      'Supertrain 2025': { 'a.jpg': '/a.jpg' },
      'Supertrain 2024': { 'b.jpg': '/b.jpg' },
    })

    expect(groups.map((group) => group.title)).toEqual(['Supertrain 2024', 'Supertrain 2025'])
  })
})

describe('galleryGroups', () => {
  it('GIVEN the real galleries.json WHEN loaded THEN no alt text is a bare camera filename', () => {
    expect(galleryGroups.length).toBeGreaterThan(0)

    for (const group of galleryGroups) {
      for (const image of group.images) {
        expect(image.alt.trim()).not.toBe('')
        expect(image.alt).not.toMatch(/^[A-Z]{2,3}\d?[\s_-]?\d{3,}/i)
      }
    }
  })

  it('GIVEN the image folders on disk WHEN compared to galleries.json THEN every folder and file has an entry', async () => {
    const { readdir } = await import('node:fs/promises')
    const { resolve } = await import('node:path')

    const galleriesDir = resolve(process.cwd(), 'src/assets/images/galleries')
    const metadata = galleryMetadata.galleries as GalleryMetadata

    const folders = (await readdir(galleriesDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)

    for (const folder of folders) {
      expect(metadata[folder], `galleries.json is missing the "${folder}" folder`).toBeDefined()

      const files = (await readdir(`${galleriesDir}/${folder}`)).filter((file) =>
        /\.(jpg|jpeg|png|webp|gif)$/i.test(file),
      )

      for (const file of files) {
        expect(
          metadata[folder]?.images?.[file],
          `galleries.json is missing "${folder}/${file}"`,
        ).toBeDefined()
      }
    }
  })
})
