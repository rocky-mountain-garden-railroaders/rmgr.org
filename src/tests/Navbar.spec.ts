import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Navbar from '../components/Navbar.vue'

describe('Navbar', () => {
  const originalInnerWidth = window.innerWidth

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    })
    vi.restoreAllMocks()
  })

  it('GIVEN a mobile viewport WHEN the hamburger is clicked THEN the drawer opens', async () => {
    const vuetify = createVuetify()

    const wrapper = mount(Navbar, {
      global: {
        plugins: [vuetify],
      },
    })

    expect((wrapper.vm as unknown as { mobile: boolean }).mobile).toBe(true)

    await wrapper.findComponent({ name: 'VBtn' }).trigger('click')

    expect((wrapper.vm as unknown as { drawer: boolean }).drawer).toBe(true)
  })

  it('GIVEN a desktop viewport WHEN rendered THEN the drawer stays open', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1440,
    })

    const vuetify = createVuetify()

    const wrapper = mount(Navbar, {
      global: {
        plugins: [vuetify],
      },
    })

    expect((wrapper.vm as unknown as { mobile: boolean }).mobile).toBe(false)
  })
})
