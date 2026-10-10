import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import Navbar from '../components/Navbar.vue'

const NavbarWithinAppLayout = defineComponent({
  components: { Navbar },
  template: '<v-app><Navbar ref="navbar" /></v-app>',
})

const mountNavbar = (vuetify: ReturnType<typeof createVuetify>) => {
  const wrapper = mount(NavbarWithinAppLayout, {
    global: {
      plugins: [vuetify],
    },
  })
  return wrapper.findComponent(Navbar)
}

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
    const vuetify = createVuetify({ components, directives })

    const navbar = mountNavbar(vuetify)

    expect((navbar.vm as unknown as { mobile: boolean }).mobile).toBe(true)

    await navbar.findComponent({ name: 'VBtn' }).trigger('click')

    expect((navbar.vm as unknown as { drawer: boolean }).drawer).toBe(true)
  })

  it('GIVEN a desktop viewport WHEN rendered THEN the drawer stays open', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1440,
    })

    const vuetify = createVuetify({ components, directives })

    const navbar = mountNavbar(vuetify)

    expect((navbar.vm as unknown as { mobile: boolean }).mobile).toBe(false)
  })
})
