import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { VApp, VAppBar, VBtn, VNavigationDrawer } from 'vuetify/components'
import { h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Navbar from '../components/Navbar.vue'

enableAutoUnmount(afterEach)

const mountNavbar = () =>
  mount(VApp, {
    slots: { default: () => h(Navbar) },
    global: {
      plugins: [createVuetify({ components: { VAppBar, VBtn, VNavigationDrawer } })],
    },
  })

describe('Navbar', () => {
  const originalInnerWidth = window.innerWidth

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
      },
    )
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
    vi.unstubAllGlobals()
  })

  it('GIVEN a mobile viewport WHEN the hamburger is clicked THEN the drawer opens', async () => {
    const wrapper = mountNavbar()
    const drawer = wrapper.findComponent(VNavigationDrawer)
    expect(drawer.props('temporary')).toBe(true)
    expect(drawer.props('modelValue')).toBe(false)

    await wrapper.findComponent(VBtn).trigger('click')

    expect(drawer.props('modelValue')).toBe(true)
  })

  it('GIVEN a desktop viewport WHEN rendered THEN the drawer stays open', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1440,
    })

    const wrapper = mountNavbar()
    const drawer = wrapper.findComponent(VNavigationDrawer)
    expect(drawer.props('permanent')).toBe(true)
    expect(drawer.props('modelValue')).toBe(true)
    expect(wrapper.findComponent(VAppBar).exists()).toBe(false)
  })
})
