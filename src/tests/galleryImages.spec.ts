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
  it.each([
    ['Member Layout - Siwy', 'PXL_20230617_212811414.mp4'],
    ['Member Layout - Mayhew', '20250811_172614.mp4'],
    ['Zoo Lights - 2025', 'VID_20251207_202039929.mp4'],
    ['Supertrain - 2025', 'PXL_20250406_175034916.mp4'],
  ])('associates existing MP4 naming patterns with %s', (folder, fileName) => {
    expect(splitGalleryPath(`../assets/images/galleries/${folder}/${fileName}`)).toEqual({
      folder,
      fileName,
    })
    const [group] = buildGalleryGroups(
      {
        [folder]: { [fileName]: '/clip.mp4', 'cover.webp': '/cover.webp' },
      },
      galleryMetadata.galleries,
    )
    expect(group.cover?.src).toBe('/cover.webp')
    expect(group.media[1]).toMatchObject({ kind: 'video', fileName, src: '/clip.mp4' })
  })

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
  it('discovers MP4 slides after photos without changing their order or cover', () => {
    const [group] = buildGalleryGroups(
      {
        Layout: {
          'a.MP4': '/a.MP4',
          'b.webp': '/b.webp',
          'c.webp': '/c.webp',
          'z.mp4': '/z.mp4',
        },
      },
      {
        Layout: {
          images: {
            'z.mp4': { alt: 'Running trains', caption: 'A layout tour' },
            'c.webp': {},
            'b.webp': {},
          },
        },
      },
    )
    expect(group.media.map((item) => item.fileName)).toEqual(['c.webp', 'b.webp', 'z.mp4', 'a.MP4'])
    expect(group.cover).toEqual(group.media[0])
    expect(group.media.map((item) => item.kind)).toEqual(['image', 'image', 'video', 'video'])
    expect(group.media[2]).toMatchObject({ alt: 'Running trains', caption: 'A layout tour' })
    expect(group.media[3].alt).toBe('Video from the Layout gallery')
  })

  it('supports video-only galleries without passing their source to an image cover', () => {
    const [group] = buildGalleryGroups({ Clips: { 'train.mp4': '/train.mp4' } })
    expect(group.cover).toBeUndefined()
    expect(group.media[0].kind).toBe('video')
  })

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
    expect(group.media[0]).toEqual({
      kind: 'image',
      src: '/st24-a.jpg',
      fileName: 'CS5_1317-CR3_DxO_DeepPRIME.jpg',
      alt: 'Club members operating the modular layout',
      caption: 'Volunteers running trains for the crowd.',
    })
  })

  it('GIVEN no metadata WHEN building THEN alt falls back to the gallery name rather than the camera filename', () => {
    const [group] = buildGalleryGroups(sources)

    expect(group.media.map((image) => image.alt)).toEqual([
      'Photo from the Supertrain 2024 gallery',
      'Photo from the Supertrain 2024 gallery',
    ])
    expect(group.media.every((image) => !image.alt.includes('CS5'))).toBe(true)
  })

  it('GIVEN an empty alt but a caption WHEN building THEN the caption is reused as alt text', () => {
    const [group] = buildGalleryGroups(sources, {
      'Supertrain 2024': {
        images: {
          'CS5_1317-CR3_DxO_DeepPRIME.jpg': { alt: '   ', caption: 'A live steam 4-6-2 at speed.' },
        },
      },
    })

    expect(group.media[0].alt).toBe('A live steam 4-6-2 at speed.')
  })

  it('GIVEN missing captions WHEN building THEN the caption is empty so the view can hide it', () => {
    const [group] = buildGalleryGroups(sources, {
      'Supertrain 2024': { images: { 'CS5_1317-CR3_DxO_DeepPRIME.jpg': { alt: 'Curated alt' } } },
    })

    expect(group.media.map((image) => image.caption)).toEqual(['', ''])
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

    expect(group.media.map((image) => image.src)).toEqual(['/zz.jpg', '/b.jpg', '/a.jpg'])
  })

  it('GIVEN a folder with no images WHEN building THEN it is omitted', () => {
    expect(buildGalleryGroups({ 'Supertrain 2026': {} })).toEqual([])
  })

  it('GIVEN galleries with an order number WHEN building THEN the highest number comes first', () => {
    const groups = buildGalleryGroups(
      {
        'Supertrain 2024': { 'b.jpg': '/b.jpg' },
        'Supertrain 2025': { 'a.jpg': '/a.jpg' },
        'Zoo Lights': { 'c.jpg': '/c.jpg' },
      },
      {
        'Supertrain 2024': { order: 1 },
        'Supertrain 2025': { order: 2 },
        'Zoo Lights': { order: 3 },
      },
    )

    expect(groups.map((group) => group.title)).toEqual([
      'Zoo Lights',
      'Supertrain 2025',
      'Supertrain 2024',
    ])
  })

  it('GIVEN equal, missing or invalid order numbers WHEN building THEN ties are alphabetical and unnumbered galleries go last', () => {
    const groups = buildGalleryGroups(
      {
        'Open House': { 'a.jpg': '/a.jpg' },
        'Field Trip': { 'b.jpg': '/b.jpg' },
        'Club Layouts': { 'c.jpg': '/c.jpg' },
        Archive: { 'd.jpg': '/d.jpg' },
      },
      {
        'Open House': { order: 1 },
        'Field Trip': { order: 1 },
        Archive: { order: '5' as unknown as number },
      },
    )

    expect(groups.map((group) => group.title)).toEqual([
      'Field Trip',
      'Open House',
      'Archive',
      'Club Layouts',
    ])
  })
})

describe('galleryGroups', () => {
  it('includes exactly the 14 compressed videos in their original gallery folders', async () => {
    const { stat } = await import('node:fs/promises')
    const { resolve } = await import('node:path')
    const videoCounts = Object.fromEntries(
      galleryGroups
        .map((group) => [group.title, group.media.filter((item) => item.kind === 'video').length])
        .filter(([, count]) => count !== 0),
    )
    expect(videoCounts).toEqual({
      'Member Layout - Siwy': 7,
      'Member Layout - Mayhew': 5,
      'Zoo Lights - 2025': 2,
    })

    for (const [folder, metadata] of Object.entries(galleryMetadata.galleries)) {
      const group = galleryGroups.find((group) => group.title === metadata.title)
      const videoNames = Object.keys(metadata.images).filter((file) => /\.mp4$/i.test(file))
      expect(
        group?.media.filter((item) => item.kind === 'video').map((item) => item.fileName),
      ).toEqual(videoNames)
      expect(group?.cover?.fileName).toBe(Object.keys(metadata.images)[0])
      for (const file of videoNames) {
        const info = await stat(resolve('src/assets/images/galleries', folder, file))
        expect(info.size, `${folder}/${file} must stay below 100 MiB`).toBeLessThan(100 * 1024 ** 2)
        expect(info.size).toBeGreaterThan(0)
      }
    }
  })

  it('GIVEN a gallery is omitted from the manifest WHEN loaded THEN its photos remain unpublished', async () => {
    const { readdir } = await import('node:fs/promises')
    const { resolve } = await import('node:path')
    const folder = 'Supertrain - 2026'

    expect(galleryMetadata.galleries).not.toHaveProperty(folder)
    expect(galleryGroups.some((group) => group.title === folder)).toBe(false)
    expect(await readdir(resolve(process.cwd(), 'src/assets/images/galleries', folder))).toEqual(
      expect.arrayContaining(['5e35d5a4c5c7096179da2d60a671e3e4.webp', 'IMG_5680.webp']),
    )
  })

  it('GIVEN converted gallery photos WHEN loaded THEN every photo uses WebP', () => {
    expect(galleryGroups.length).toBeGreaterThan(0)

    for (const group of galleryGroups) {
      for (const image of group.media.filter((item) => item.kind === 'image')) {
        expect(image.fileName).toMatch(/\.webp$/)
      }
    }
  })

  it('GIVEN curated gallery priorities WHEN loaded THEN recent events precede alphabetical member layouts and older events', () => {
    expect(galleryGroups.map((group) => group.title)).toEqual([
      'Zoo Lights - 2025',
      'Supertrain - 2025',
      'Supertrain - 2024',
      'Member Layout - Baldwin',
      'Member Layout - Beck',
      'Member Layout - Burk Jr.',
      'Member Layout - Burk Sr.',
      'Member Layout - Graham',
      'Member Layout - Huthmann',
      'Member Layout - Jalving',
      'Member Layout - Lee',
      'Member Layout - Mayhew',
      'Member Layout - McKay',
      'Member Layout - Morris',
      'Member Layout - Riegel',
      'Member Layout - Siwy',
      'Member Layout - Stoneham',
      'Member Layout - Toews',
      'Member Layout - Vaughan',
      'Member Layout - Vern and Kathleen',
      'Member Layout - Weins',
      "Aspen Crossing - Father's Day - 2021",
      'Supertrain - 2019',
      'Supertrain - 2018',
      'Heritage Park - Christmas Display - 2017',
      'Supertrain - 2017',
      'Heritage Park - Christmas Display - 2016',
      'Heritage Park - Christmas Display - 2013',
      "Aspen Crossing - Father's Day - 2012",
      'Heritage Park - Christmas Display - 2012',
      "Aspen Crossing - Father's Day - 2011",
      "Aspen Crossing - Father's Day - 2010",
      "Aspen Crossing - Father's Day - 2009",
      'Supertrain - 2006',
      'Supertrain - 2005',
      'Supertrain - 2004',
      'Supertrain - 2003',
    ])
  })

  it('GIVEN the real galleries.json WHEN loaded THEN no alt text is a bare camera filename', () => {
    expect(galleryGroups.length).toBeGreaterThan(0)

    for (const group of galleryGroups) {
      for (const image of group.media) {
        expect(image.alt.trim()).not.toBe('')
        expect(image.alt).not.toMatch(/^[A-Z]{2,3}\d?[\s_-]?\d{3,}/i)
      }
    }
  })

  it('GIVEN published galleries WHEN compared to disk THEN all photos are curated and MP4s are discovered', async () => {
    const { readdir } = await import('node:fs/promises')
    const { resolve } = await import('node:path')

    const galleriesDir = resolve(process.cwd(), 'src/assets/images/galleries')
    const metadata = galleryMetadata.galleries as GalleryMetadata

    for (const folder of Object.keys(metadata)) {
      const allFiles = await readdir(`${galleriesDir}/${folder}`)
      const files = allFiles.filter((file) => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))

      expect(
        Object.keys(metadata[folder]?.images ?? {})
          .filter((file) => !/\.mp4$/i.test(file))
          .sort(),
        `galleries.json must list exactly the supported images in "${folder}"`,
      ).toEqual(files.sort())
      for (const file of Object.keys(metadata[folder]?.images ?? {})) {
        expect(
          allFiles,
          `Metadata for "${folder}/${file}" must reference an existing file`,
        ).toContain(file)
      }
      const group = galleryGroups.find(
        (group) => group.title === (metadata[folder].title ?? folder),
      )
      expect(
        group?.media
          .filter((item) => item.kind === 'video')
          .map((item) => item.fileName)
          .sort(),
      ).toEqual(allFiles.filter((file) => /\.mp4$/i.test(file)).sort())
    }
  })

  it('GIVEN the Mayhew manifest WHEN building THEN its featured photo stays first and remaining photos are newest to oldest', () => {
    const folder = 'Member Layout - Mayhew'
    const files = [
      '20260624_135146.webp',
      '20260624_135226.webp',
      '20260624_135201.webp',
      '20260618_180715.webp',
      '20260618_180658.webp',
      '20250828_201613.webp',
      '20250828_201559.webp',
      '20250811_172331.webp',
    ]
    const [group] = buildGalleryGroups(
      { [folder]: Object.fromEntries([...files].reverse().map((file) => [file, file])) },
      galleryMetadata.galleries,
    )

    expect(group.media.map((image) => image.src)).toEqual(files)
  })
})
