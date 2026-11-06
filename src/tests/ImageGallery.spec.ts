import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

const { galleryGroups } = vi.hoisted(() => ({
  galleryGroups: Array.from({ length: 5 }, (_, index) => ({
    title: `Gallery ${index + 1}`,
    description: index === 0 ? 'A described gallery.' : '',
    media: [
      {
        kind: 'image',
        src: `/gallery-${index + 1}-a.jpg`,
        fileName: `original-${index + 1}-a.jpg`,
        alt: `Gallery ${index + 1} image A alt`,
        caption: index === 0 ? `Gallery ${index + 1} image A caption` : '',
      },
      {
        kind: 'image',
        src: `/gallery-${index + 1}-b.jpg`,
        fileName: `original-${index + 1}-b.jpg`,
        alt: `Gallery ${index + 1} image B alt`,
        caption: '',
      },
    ],
  })),
}))

for (const group of galleryGroups) {
  Object.assign(group, { cover: group.media[0] })
}
galleryGroups[4].media.push({
  kind: 'video',
  src: '/layout-train.MP4',
  fileName: 'layout-train.MP4',
  alt: 'A train running through the layout',
  caption: 'An operating session.',
})

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

const createMatchMedia = (isMobile: boolean, prefersReducedMotion: boolean) =>
  vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? prefersReducedMotion : isMobile,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))

const mountGallery = async (
  isMobile: boolean,
  {
    prefersReducedMotion = false,
    galleryDebug,
  }: { prefersReducedMotion?: boolean; galleryDebug?: string } = {},
) => {
  vi.stubGlobal('matchMedia', createMatchMedia(isMobile, prefersReducedMotion))

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/gallery', component: ImageGallery }],
  })
  await router.push({
    path: '/gallery',
    query: galleryDebug === undefined ? {} : { galleryDebug },
  })
  await router.isReady()
  const wrapper = mount(ImageGallery, { global: { stubs, plugins: [router] } })
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

describe('GIVEN gallery state WHEN rendering or interacting THEN', () => {
  enableAutoUnmount(afterEach)

  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it.each([false, true])(
    'GIVEN a %s viewport WHEN opening galleries THEN only covers and the current slide are mounted',
    async (isMobile) => {
      const wrapper = await mountGallery(isMobile)
      const coverSources = galleryGroups.map((group) => group.media[0].src)
      const sources = () => wrapper.findAll('[src]').map((image) => image.attributes('src'))

      expect(sources()).toEqual(coverSources)
      expect(wrapper.find('.modal-image-shell').exists()).toBe(false)

      await wrapper.findAll('button.image-hit-area')[1].trigger('click')
      expect(sources()).toEqual([...coverSources, galleryGroups[1].media[0].src])
      expect(wrapper.find('.modal-image-shell [src]').attributes('eager')).toBeDefined()

      await wrapper.find('[aria-label="Next slide"]').trigger('click')
      expect(sources()).toEqual([...coverSources, galleryGroups[1].media[1].src])

      await wrapper.find('[aria-label="Close gallery viewer"]').trigger('click')
      expect(sources()).toEqual(coverSources)
      expect(wrapper.find('.modal-image-shell').exists()).toBe(false)

      await wrapper.findAll('button.image-hit-area')[2].trigger('click')
      expect(sources()).toEqual([...coverSources, galleryGroups[2].media[0].src])
    },
  )

  it.each([false, true])(
    'GIVEN a %s viewport WHEN selecting a video slide THEN only that video is mounted and controlled',
    async (isMobile) => {
      vi.useFakeTimers()
      const wrapper = await mountGallery(isMobile, { galleryDebug: 'true' })
      expect(wrapper.find('video').exists()).toBe(false)
      expect(wrapper.html()).not.toContain('/layout-train.MP4')

      await wrapper.findAll('button.image-hit-area')[4].trigger('click')
      await wrapper.find('[aria-label="Previous slide"]').trigger('click')
      const video = wrapper.find('video')
      expect(video.attributes('src')).toBe('/layout-train.MP4')
      expect(video.attributes('preload')).toBe('none')
      expect(video.attributes('controls')).toBeDefined()
      expect(video.attributes('playsinline')).toBeDefined()
      expect(video.attributes('autoplay')).toBeUndefined()
      expect(video.element.muted).toBe(true)
      expect(video.element.play).toHaveBeenCalledOnce()
      expect(video.attributes('aria-label')).toBe('A train running through the layout')
      expect(wrapper.findAll('.modal-image-shell [src]')).toHaveLength(1)
      expect(wrapper.find('.modal-image-viewport').exists()).toBe(false)
      expect(wrapper.find('.modal-slideshow-toggle').exists()).toBe(false)
      expect(wrapper.find('.gallery-debug-filename').text()).toContain('layout-train.MP4')
      expect(wrapper.text()).toContain('An operating session.')
      vi.advanceTimersByTime(15000)
      await nextTick()
      expect(wrapper.find('video').attributes('src')).toBe('/layout-train.MP4')

      await video.trigger('error')
      expect(wrapper.find('[role="alert"]').text()).toContain('could not be played')
      expect(wrapper.find('.video-help a').attributes('href')).toBe('/layout-train.MP4')

      await wrapper.find('[aria-label="Next slide"]').trigger('click')
      expect(video.element.pause).toHaveBeenCalledOnce()
      expect(wrapper.find('video').exists()).toBe(false)
      expect(wrapper.find('[aria-label="Play slideshow"]').exists()).toBe(true)
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)

      await wrapper.find('[aria-label="Previous slide"]').trigger('click')
      await wrapper.find('[aria-label="Close gallery viewer"]').trigger('click')
      expect(video.element.pause).toHaveBeenCalledTimes(2)
      expect(wrapper.find('video').exists()).toBe(false)
    },
  )

  it('GIVEN a running slideshow WHEN it reaches a video and unmounts THEN it pauses and stops playback', async () => {
    vi.useFakeTimers()
    const wrapper = await mountGallery(false)
    await wrapper.findAll('button.image-hit-area')[4].trigger('click')
    vi.advanceTimersByTime(5000)
    await nextTick()
    vi.advanceTimersByTime(5000)
    await nextTick()
    expect(wrapper.find('video').exists()).toBe(true)
    vi.advanceTimersByTime(15000)
    await nextTick()
    expect(wrapper.find('video').attributes('src')).toBe('/layout-train.MP4')
    const pause = wrapper.find<HTMLVideoElement>('video').element.pause
    wrapper.unmount()
    expect(pause).toHaveBeenCalledOnce()
  })

  it('GIVEN muted autoplay is rejected WHEN a video slide opens THEN the native Play control remains available', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValue(new DOMException('Playback requires a user gesture', 'NotAllowedError'))
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[4].trigger('click')
    await wrapper.find('[aria-label="Previous slide"]').trigger('click')
    await flushPromises()

    const video = wrapper.find<HTMLVideoElement>('video')
    expect(play).toHaveBeenCalledOnce()
    expect(video.element.muted).toBe(true)
    expect(video.attributes('controls')).toBeDefined()
    expect(video.attributes('playsinline')).toBeDefined()
    expect(wrapper.find('[role="status"]').text()).toContain('Autoplay was blocked')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)

    await video.trigger('playing')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('GIVEN the viewer is fullscreen WHEN navigating and closing THEN controls remain available and fullscreen exits', async () => {
    let fullscreenElement: Element | null = null
    let fullscreenRequestTarget: HTMLElement | null = null
    const originalEnabled = Object.getOwnPropertyDescriptor(document, 'fullscreenEnabled')
    const originalElement = Object.getOwnPropertyDescriptor(document, 'fullscreenElement')
    const originalRequest = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'requestFullscreen',
    )
    const originalExit = Object.getOwnPropertyDescriptor(document, 'exitFullscreen')
    const exit = vi.fn(async () => {
      fullscreenElement = null
      document.dispatchEvent(new Event('fullscreenchange'))
    })
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    })
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: async () => {
        if (!fullscreenRequestTarget) throw new Error('No fullscreen request target was configured')
        fullscreenElement = fullscreenRequestTarget
        document.dispatchEvent(new Event('fullscreenchange'))
      },
    })
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit })
    try {
      const wrapper = await mountGallery(false)
      await wrapper.find('button.image-hit-area').trigger('click')
      fullscreenRequestTarget = wrapper.find<HTMLElement>('.gallery-fullscreen-viewer').element
      await wrapper.find('.modal-image-viewport').trigger('wheel', { deltaY: -100 })
      expect(wrapper.find('.modal-image-viewport').classes()).not.toContain('is-zoomed')
      await wrapper.find('[aria-label="Enter fullscreen"]').trigger('click')
      await flushPromises()
      expect(fullscreenElement).toBe(wrapper.find('.gallery-fullscreen-viewer').element)
      expect(wrapper.find('[aria-label="Exit fullscreen"]').exists()).toBe(true)
      await wrapper.find('.modal-image-viewport').trigger('wheel', { deltaY: -100 })
      expect(wrapper.find('.modal-image-viewport').classes()).toContain('is-zoomed')
      expect(wrapper.find('[aria-label="Play slideshow"]').exists()).toBe(true)
      await wrapper.find('[aria-label="Next slide"]').trigger('click')
      expect(wrapper.find('.modal-image-shell [src]').attributes('src')).toBe('/gallery-1-b.jpg')
      expect(wrapper.find('.modal-image-viewport').classes()).not.toContain('is-zoomed')
      expect(wrapper.find('[aria-label="Play slideshow"]').exists()).toBe(true)
      await wrapper.find('[aria-label="Close gallery viewer"]').trigger('click')
      await flushPromises()
      expect(exit).toHaveBeenCalledOnce()
      wrapper.unmount()
    } finally {
      for (const [target, key, descriptor] of [
        [document, 'fullscreenEnabled', originalEnabled],
        [document, 'fullscreenElement', originalElement],
        [HTMLElement.prototype, 'requestFullscreen', originalRequest],
        [document, 'exitFullscreen', originalExit],
      ] as const) {
        if (descriptor) Object.defineProperty(target, key, descriptor)
        else Reflect.deleteProperty(target, key)
      }
    }
  })

  it('GIVEN the slideshow is running WHEN the gallery unmounts THEN no timers remain', async () => {
    vi.useFakeTimers()
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    await nextTick()
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  describe('GIVEN slideshow state WHEN opened or controlled THEN', () => {
    const SLIDESHOW_DELAY_MS = 5000
    const group = galleryGroups[0]

    const openFirstGallery = async (options?: { prefersReducedMotion?: boolean }) => {
      vi.useFakeTimers()
      const wrapper = await mountGallery(false, options)
      await wrapper.findAll('button.image-hit-area')[0].trigger('click')
      await nextTick()
      return wrapper
    }

    const currentSrc = (wrapper: ReturnType<typeof mount>) =>
      wrapper.find('.modal-image-shell [src]').attributes('src')

    const advance = async (ms = SLIDESHOW_DELAY_MS) => {
      vi.advanceTimersByTime(ms)
      await nextTick()
    }

    it('GIVEN the lightbox is open WHEN the delay elapses THEN it advances to the next image', async () => {
      const wrapper = await openFirstGallery()

      await advance()

      expect(currentSrc(wrapper)).toBe(group.media[1].src)
    })

    it('GIVEN a multi-image gallery WHEN opened THEN a labelled pause control is shown', async () => {
      const wrapper = await openFirstGallery()

      const toggle = wrapper.find('.modal-slideshow-toggle')
      expect(toggle.attributes('aria-label')).toBe('Pause slideshow')
      expect(toggle.find('i').attributes('aria-hidden')).toBe('true')
    })

    it('GIVEN the pause control WHEN activated THEN the slideshow stops until played again', async () => {
      const wrapper = await openFirstGallery()

      await wrapper.find('.modal-slideshow-toggle').trigger('click')
      expect(wrapper.find('.modal-slideshow-toggle').attributes('aria-label')).toBe(
        'Play slideshow',
      )
      expect(vi.getTimerCount()).toBe(0)

      await advance(SLIDESHOW_DELAY_MS * 3)
      expect(currentSrc(wrapper)).toBe(group.media[0].src)

      await wrapper.find('.modal-slideshow-toggle').trigger('click')
      await advance()
      expect(currentSrc(wrapper)).toBe(group.media[1].src)
    })

    it('GIVEN the pointer is over the viewer WHEN the delay elapses THEN the slideshow still advances', async () => {
      const wrapper = await openFirstGallery()
      const viewer = wrapper.find('.lightbox-viewer')

      await viewer.trigger('mouseenter')
      await advance()
      expect(currentSrc(wrapper)).toBe(group.media[1].src)
    })

    it('GIVEN reduced motion is preferred WHEN the lightbox opens THEN the slideshow starts paused', async () => {
      const wrapper = await openFirstGallery({ prefersReducedMotion: true })

      expect(wrapper.find('.modal-slideshow-toggle').attributes('aria-label')).toBe(
        'Play slideshow',
      )
      await advance(SLIDESHOW_DELAY_MS * 3)
      expect(currentSrc(wrapper)).toBe(group.media[0].src)
    })
  })

  it(`GIVEN the desktop viewport WHEN rendering THEN it lays out ${DESKTOP_COLUMNS} gallery sections per row`, async () => {
    const wrapper = await mountGallery(false)

    const expectedRows = chunkSizes(galleryGroups.length, DESKTOP_COLUMNS)

    expect(wrapper.findAll('tr')).toHaveLength(expectedRows.length)
    expect(filledCellsPerRow(wrapper)).toEqual(expectedRows)
  })

  it('GIVEN a short final desktop row WHEN rendering THEN it is padded to three columns', async () => {
    const wrapper = await mountGallery(false)

    expect(cellsPerRow(wrapper)).toEqual(
      chunkSizes(galleryGroups.length, DESKTOP_COLUMNS).map(() => DESKTOP_COLUMNS),
    )
  })

  it(`GIVEN the mobile viewport WHEN rendering THEN it lays out ${MOBILE_COLUMNS} gallery section per row`, async () => {
    const wrapper = await mountGallery(true)

    const expectedRows = chunkSizes(galleryGroups.length, MOBILE_COLUMNS)

    expect(wrapper.findAll('tr')).toHaveLength(expectedRows.length)
    expect(filledCellsPerRow(wrapper)).toEqual(expectedRows)
  })

  it.each([
    { label: 'lg and up', isMobile: false },
    { label: 'below lg', isMobile: true },
  ])(
    'GIVEN the $label viewport WHEN opening the last gallery THEN its first image appears in the lightbox',
    async ({ isMobile }) => {
      const wrapper = await mountGallery(isMobile)

      const lastIndex = galleryGroups.length - 1
      await wrapper.findAll('button.image-hit-area')[lastIndex].trigger('click')
      await nextTick()

      expect(wrapper.find('.modal-image-shell').exists()).toBe(true)

      const lightboxImage = wrapper.find('.modal-image-shell [src]')
      expect(lightboxImage.attributes('src')).toBe(galleryGroups[lastIndex].media[0].src)
      expect(lightboxImage.attributes('alt')).toBe(galleryGroups[lastIndex].media[0].alt)
    },
  )

  it('GIVEN an image with a caption WHEN opened THEN the caption panel renders', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain(galleryGroups[0].media[0].caption)
  })

  it('GIVEN an image without a caption WHEN opened THEN no caption panel renders', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[1].trigger('click')
    await nextTick()

    expect(wrapper.find('.modal-image-shell').exists()).toBe(true)
    expect(wrapper.find('.border-t').exists()).toBe(false)
  })

  it.each([undefined, 'false', '1'])(
    'GIVEN galleryDebug=%s WHEN opening the slideshow THEN filenames remain hidden',
    async (galleryDebug) => {
      const wrapper = await mountGallery(false, { galleryDebug })
      await wrapper.findAll('button.image-hit-area')[0].trigger('click')

      expect(wrapper.find('.gallery-debug-filename').exists()).toBe(false)
    },
  )

  it('GIVEN galleryDebug=true WHEN navigating photos THEN the active filename appears even without a caption', async () => {
    const wrapper = await mountGallery(false, { galleryDebug: 'true' })
    await wrapper.findAll('button.image-hit-area')[0].trigger('click')

    expect(wrapper.find('.gallery-debug-filename code').text()).toBe('original-1-a.jpg')
    expect(wrapper.text()).toContain(galleryGroups[0].media[0].caption)
    await wrapper.find('.modal-nav-right').trigger('click')
    expect(wrapper.find('.gallery-debug-filename code').text()).toBe('original-1-b.jpg')
  })

  it('GIVEN debug filenames are displayed WHEN the URL flag is removed THEN filenames disappear', async () => {
    const wrapper = await mountGallery(false, { galleryDebug: 'true' })
    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    expect(wrapper.find('.gallery-debug-filename').exists()).toBe(true)

    await wrapper.vm.$router.push('/gallery')
    await nextTick()

    expect(wrapper.find('.gallery-debug-filename').exists()).toBe(false)
  })

  it('GIVEN the lightbox is open WHEN inspecting controls THEN each has an accessible name', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    await nextTick()

    expect(wrapper.find('.modal-nav-left').attributes('aria-label')).toBe('Previous slide')
    expect(wrapper.find('.modal-nav-right').attributes('aria-label')).toBe('Next slide')
    expect(wrapper.find('.modal-close').attributes('aria-label')).toBe('Close gallery viewer')
  })

  it('GIVEN the decorative chevrons WHEN rendered THEN they are hidden from assistive technology', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    await nextTick()

    expect(wrapper.find('.modal-nav-left i').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.modal-nav-right i').attributes('aria-hidden')).toBe('true')
  })

  it('GIVEN the previous control WHEN activated on the first image THEN it wraps to the last image', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    await nextTick()
    await wrapper.find('.modal-nav-left').trigger('click')
    await nextTick()

    const lastImage = galleryGroups[0].media[galleryGroups[0].media.length - 1]
    expect(wrapper.find('.modal-image-shell [src]').attributes('src')).toBe(lastImage.src)
  })

  it('GIVEN an image is opened WHEN the lightbox renders THEN the close button is inside the image shell', async () => {
    const wrapper = await mountGallery(false)

    await wrapper.findAll('button.image-hit-area')[0].trigger('click')
    await nextTick()

    expect(wrapper.find('.modal-image-shell .modal-close').exists()).toBe(true)
  })
})
