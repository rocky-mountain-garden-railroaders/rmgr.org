import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Navbar from '../components/Navbar.vue'

enableAutoUnmount(afterEach)

const stubs = {
  VBtn: { name: 'VBtn', template: '<button><slot /></button>' },
}

const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>About Us</div>' } },
      { path: '/:pathMatch(.*)*', component: { template: '<div>Page</div>' } },
    ],
  })

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
        plugins: [vuetify, createTestRouter()],
        stubs,
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
        plugins: [vuetify, createTestRouter()],
        stubs,
      },
    })

    expect((wrapper.vm as unknown as { mobile: boolean }).mobile).toBe(false)
  })

  it.each([1024, 1440])(
    'GIVEN a %spx viewport WHEN any logo is clicked THEN it navigates home and closes the drawer',
    async (width) => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
      const router = createTestRouter()
      await router.push('/resources')
      await router.isReady()
      const wrapper = mount(Navbar, {
        global: { plugins: [createVuetify(), router], stubs },
      })
      const logos = wrapper.findAll('.nav-logo-link')
      expect(logos).toHaveLength(width === 1024 ? 2 : 1)

      for (const logo of logos) {
        await router.push('/resources')
        if (width === 1024) await wrapper.findComponent({ name: 'VBtn' }).trigger('click')
        expect(logo.attributes('href')).toBe('/')
        expect(logo.attributes('aria-label')).toBe('Home / About Us')
        await logo.trigger('click')
        await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
        expect((wrapper.vm as unknown as { drawer: boolean }).drawer).toBe(false)
      }
    },
  )
})
