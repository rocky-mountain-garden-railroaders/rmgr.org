import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GallerySection from '@/components/GallerySection.vue'

const stubs = {
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-img': { template: '<div><slot /></div>' },
  'v-progress-circular': { template: '<div />' },
  'v-row': { template: '<div><slot /></div>' },
}

const images = [
  { src: '/one.jpg', alt: 'Club members operating the modular layout', caption: 'First' },
  { src: '/two.jpg', alt: 'A live steam locomotive at the station', caption: 'Second' },
]

const mountSection = (props: Record<string, unknown> = {}) =>
  mount(GallerySection, {
    props: { title: 'Featured Layouts', images, ...props },
    global: { stubs },
  })

describe('GallerySection', () => {
  it('GIVEN a gallery image WHEN clicked THEN it emits the selected image index', async () => {
    const wrapper = mountSection()

    await wrapper.find('button.image-hit-area').trigger('click')

    expect(wrapper.emitted('openImage')).toEqual([[0]])
  })

  it('GIVEN curated alt text WHEN rendering THEN the cover image exposes it to screen readers', () => {
    const wrapper = mountSection()

    expect(wrapper.find('[src]').attributes('alt')).toBe(images[0].alt)
  })

  it('GIVEN a description WHEN rendering THEN it is shown beneath the title', () => {
    const wrapper = mountSection({ description: 'Our booth at the annual show.' })

    expect(wrapper.find('.image-title-overlay').text()).toContain('Our booth at the annual show.')
  })

  it('GIVEN no description WHEN rendering THEN only the title is shown', () => {
    const wrapper = mountSection()

    expect(wrapper.find('.image-title-overlay').text()).toBe('Featured Layouts')
  })
})
