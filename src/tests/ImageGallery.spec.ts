import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ImageGallery from '@/views/ImageGallery.vue'

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

describe('ImageGallery', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders three gallery sections per row on lg and up', async () => {
    vi.stubGlobal('matchMedia', createMatchMedia(false))

    const wrapper = mount(ImageGallery, {
      global: { stubs },
    })

    await nextTick()

    expect(wrapper.findAll('tr')).toHaveLength(1)
    expect(wrapper.findAll('tr')[0].findAll('td.gallery-cell').filter((cell) => !cell.classes().includes('gallery-cell-empty'))).toHaveLength(2)
  })

  it('renders one gallery section per row below lg', async () => {
    vi.stubGlobal('matchMedia', createMatchMedia(true))

    const wrapper = mount(ImageGallery, {
      global: { stubs },
    })

    await nextTick()

    expect(wrapper.findAll('tr')).toHaveLength(2)
    expect(wrapper.findAll('tr').map((row) => row.findAll('td.gallery-cell').filter((cell) => !cell.classes().includes('gallery-cell-empty')).length)).toEqual([1, 1])
  })

  it('renders the close button inside the lightbox image shell', async () => {
    vi.stubGlobal('matchMedia', createMatchMedia(false))

    const wrapper = mount(ImageGallery, {
      global: { stubs },
    })

    await nextTick()
    await wrapper.findComponent({ name: 'GallerySection' }).trigger('click')
    await nextTick()

    expect(wrapper.find('.modal-image-shell .modal-close').exists()).toBe(true)
  })
})
