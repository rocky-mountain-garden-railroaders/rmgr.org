import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const { galleryGroups } = vi.hoisted(() => ({
  galleryGroups: Array.from({ length: 5 }, (_, index) => ({
    title: `Gallery ${index + 1}`,
    description: index === 0 ? 'A described gallery.' : '',
    images: [
      {
        src: `/gallery-${index + 1}-a.jpg`,
        alt: `Gallery ${index + 1} image A alt`,
        // Only the first gallery has curated captions, so the view must hide the rest.
        caption: index === 0 ? `Gallery ${index + 1} image A caption` : '',
      },
      {
        src: `/gallery-${index + 1}-b.jpg`,
        alt: `Gallery ${index + 1} image B alt`,
        caption: '',
      },
    ],
  })),
}))

vi.mock('@/utils/galleryImages', () => ({ galleryGroups }))

const ImageGallery = (await import('@/views/ImageGallery.vue')).default

const DESKTOP_COLUMNS = 3
const MOBILE_COLUMNS = 1

const chunkSizes = (total: number, perRow: number) =>
  Array.from({ length: Math.ceil(total / perRow) }, (_, rowIndex) =>
    Math.min(perRow, total - rowIndex * perRow),
  )

const stubs = {
  'v-btn': { template: '<button><slot /></button>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-item': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-container': { template: '<div><slot /></div>' },
  'v-dialog': { template: '<div><slot /></div>' },
  'v-icon': { template: '<i />' },
  'v-img': { template: '<div><slot /></div>' },
  'v-progress-circular': { template: '<div />' },
  'v-row': { template: '<div><slot /></div>' },
}

const createMatchMedia = (matches: boolean) =>
  vi.fn().mockImplementation(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))

const mountGallery = async (isMobile: boolean) => {
  vi.stubGlobal('matchMedia', createMatchMedia(isMobile))

  const wrapper = mount(ImageGallery, { global: { stubs } })
  await nextTick()

  return wrapper
}

const filledCellsPerRow = (wrapper: ReturnType<typeof mount>) =>
  wrapper
    .findAll('tr')
    .map(
      (row) =>
        row
          .findAll('td.gallery-cell')
          .filter((cell) => !cell.classes().includes('gallery-cell-empty')).length,
    )

const cellsPerRow = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('tr').map((row) => row.findAll('td.gallery-cell').length)

describe('ImageGallery', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it(`GIVEN lg and up WHEN rendering THEN it lays out ${DESKTOP_COLUMNS} gallery sections per row`, async () => {
    const wrapper = await mountGallery(false)

    const expectedRows = chunkSizes(galleryGroups.length, DESKTOP_COLUMNS)

    expect(wrapper.findAll('tr')).toHaveLength(expectedRows.length)
    expect(filledCellsPerRow(wrapper)).toEqual(expectedRows)
  })

  it('GIVEN lg and up WHEN the last row is short THEN it is padded to a full three-column row', async () => {
    const wrapper = await mountGallery(false)

    expect(cellsPerRow(wrapper)).toEqual(
      chunkSizes(galleryGroups.length, DESKTOP_COLUMNS).map(() => DESKTOP_COLUMNS),
    )
  })

  it(`GIVEN below lg WHEN rendering THEN it lays out ${MOBILE_COLUMNS} gallery section per row`, async () => {
    const wrapper = await mountGallery(true)

    const expectedRows = chunkSizes(galleryGroups.length, MOBILE_COLUMNS)

    expect(wrapper.findAll('tr')).toHaveLength(expectedRows.length)
    expect(filledCellsPerRow(wrapper)).toEqual(expectedRows)
  })

  it.each([
    { label: 'lg and up', isMobile: false },
    { label: 'below lg', isMobile: true },
  ])(
    'GIVEN $label WHEN a gallery section in the last row is opened THEN the lightbox shows that section first image',
    async ({ isMobile }) => {
      const wrapper = await mountGallery(isMobile)

      const lastIndex = galleryGroups.length - 1
      await wrapper.findAll('button.image-hit-area')[lastIndex].trigger('click')
      await nextTick()

      expect(wrapper.find('.modal-image-shell').exists()).toBe(true)

      const lightboxImage = wrapper.find('.modal-image-shell [src]')
      expect(lightboxImage.attributes('src')).toBe(galleryGroups[lastIndex].images[0].src)
      expect(lightboxImage.attributes('alt')).toBe(galleryGroups[lastIndex].images[0].alt)
    },
  )

  it('GIVEN an image with a caption WHEN opened THEN the caption panel renders', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain(galleryGroups[0].images[0].caption)
  })

  it('GIVEN an image without a caption WHEN opened THEN no caption panel renders', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[1].trigger('click')
    await nextTick()

    expect(wrapper.find('.modal-image-shell').exists()).toBe(true)
    expect(wrapper.find('.border-t').exists()).toBe(false)
  })

  it('GIVEN the lightbox is open WHEN inspecting the controls THEN each has an accessible name', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    await nextTick()

    expect(wrapper.find('.modal-nav-left').attributes('aria-label')).toBe('Previous image')
    expect(wrapper.find('.modal-nav-right').attributes('aria-label')).toBe('Next image')
    expect(wrapper.find('.modal-close').attributes('aria-label')).toBe('Close image viewer')
  })

  it('GIVEN the decorative chevrons WHEN rendered THEN they are hidden from assistive tech', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    await nextTick()

    expect(wrapper.find('.modal-nav-left i').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.modal-nav-right i').attributes('aria-hidden')).toBe('true')
  })

  it('GIVEN the previous control WHEN activated THEN it wraps to the last image of the group', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    await nextTick()
    await wrapper.find('.modal-nav-left').trigger('click')
    await nextTick()

    const lastImage = galleryGroups[0].images[galleryGroups[0].images.length - 1]
    expect(wrapper.find('.modal-image-shell [src]').attributes('src')).toBe(lastImage.src)
  })

  it('GIVEN an opened image WHEN the lightbox renders THEN the close button sits inside the image shell', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    await nextTick()

    expect(wrapper.find('.modal-image-shell .modal-close').exists()).toBe(true)
  })
})
