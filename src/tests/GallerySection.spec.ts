import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GallerySection from '@/components/GallerySection.vue'
import type { GalleryImage } from '@/utils/galleryImages'

const stubs = {
  'v-icon': { template: '<i />' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-img': { template: '<div><slot /></div>' },
  'v-progress-circular': { template: '<div />' },
  'v-row': { template: '<div><slot /></div>' },
}

const images: GalleryImage[] = [
  {
    kind: 'image',
    fileName: 'one.jpg',
    src: '/one.jpg',
    alt: 'Club members operating the modular layout',
    caption: 'First',
  },
  {
    kind: 'image',
    fileName: 'two.jpg',
    src: '/two.jpg',
    alt: 'A live steam locomotive at the station',
    caption: 'Second',
  },
]

const mountSection = (props: Record<string, unknown> = {}) =>
  mount(GallerySection, {
    props: { title: 'Featured Layouts', cover: images[0], mediaCount: images.length, ...props },
    global: { stubs },
  })

describe('GIVEN gallery-section props WHEN rendering THEN', () => {
  it('GIVEN a video-only gallery WHEN rendering THEN its cover does not mount or request video media', () => {
    const wrapper = mountSection({ cover: undefined, mediaCount: 2, videoCount: 2 })
    expect(wrapper.findAll('[src]')).toHaveLength(0)
    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.find('.video-gallery-cover').text()).toContain('Featured Layouts')
    expect(wrapper.find('button').attributes('title')).toContain('2 videos')
  })

  it('GIVEN a gallery image WHEN clicked THEN it emits the selected image index', async () => {
    const wrapper = mountSection()

    await wrapper.find('button.image-hit-area').trigger('click')

    expect(wrapper.emitted('openImage')).toEqual([[0]])
  })

  it('GIVEN curated alt text WHEN rendering THEN the cover image exposes it to screen readers', () => {
    const wrapper = mountSection()

    expect(wrapper.find('[src]').attributes('alt')).toBe(images[0].alt)
  })

  it('GIVEN a gallery with photos WHEN rendered THEN only its lazy cover is exposed', () => {
    const wrapper = mountSection()

    expect(wrapper.findAll('[src]')).toHaveLength(1)
    expect(wrapper.find('[src]').attributes('src')).toBe(images[0].src)
    expect(wrapper.find('[src]').attributes('eager')).toBe('false')
    expect(wrapper.html()).not.toContain(images[1].src)
  })

  it('GIVEN a description WHEN rendering THEN it is shown beneath the title', () => {
    const wrapper = mountSection({ description: 'Our booth at the annual show.' })

    expect(wrapper.find('.image-title-overlay').text()).toContain('Our booth at the annual show.')
  })

  it('GIVEN no description WHEN rendering THEN only the title is shown', () => {
    const wrapper = mountSection()

    expect(wrapper.find('.image-title-overlay').text()).toBe('Featured Layouts')
  })

  it('GIVEN a gallery with multiple photos WHEN rendering THEN the hit area names the gallery and photo count', () => {
    const wrapper = mountSection()

    expect(wrapper.find('button.image-hit-area').attributes('title')).toBe(
      'View Featured Layouts gallery (2 photos)',
    )
  })
})
