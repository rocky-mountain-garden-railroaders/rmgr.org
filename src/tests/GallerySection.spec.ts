import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GallerySection from '@/components/GallerySection.vue'

describe('GallerySection', () => {
  it('emits the selected image index when a gallery image is clicked', async () => {
    const wrapper = mount(GallerySection, {
      props: {
        title: 'Featured Layouts',
        images: [
          { src: '/one.jpg', alt: 'one', caption: 'First' },
          { src: '/two.jpg', alt: 'two', caption: 'Second' },
        ],
      },
      global: {
        stubs: {
          'v-card': { template: '<div><slot /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-img': { template: '<div><slot /></div>' },
          'v-progress-circular': { template: '<div />' },
          'v-row': { template: '<div><slot /></div>' },
        },
      },
    })

    await wrapper.findAll('div')[3].trigger('click')

    expect(wrapper.emitted('openImage')).toEqual([[0]])
  })
})
