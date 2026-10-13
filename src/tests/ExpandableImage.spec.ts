import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import { VDialog } from 'vuetify/components/VDialog'
import ExpandableImage from '@/components/ExpandableImage.vue'
import AboutPage from '@/views/AboutPage.vue'
import GScale from '@/views/GScale.vue'

enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

const stubs = {
  VDialog: {
    inheritAttrs: false,
    props: { modelValue: Boolean, fullscreen: Boolean },
    emits: ['update:modelValue'],
    template: `
      <slot name="activator" :props="{ 'aria-haspopup': 'dialog', onClick: () => $emit('update:modelValue', true) }" />
      <div v-if="modelValue" v-bind="$attrs" role="dialog" @keydown.esc="$emit('update:modelValue', false)"><slot /></div>
    `,
  },
  VCard: { template: '<div><slot /></div>' },
  VBtn: { template: '<button><slot /></button>' },
  VImg: { props: ['src', 'alt'], template: '<img :src="src" :alt="alt" />' },
}

describe('ExpandableImage', () => {
  it.each(['close button', 'Escape'])(
    'restores focus to the activator after dismissal with %s',
    async (dismissal) => {
      vi.stubGlobal('visualViewport', new EventTarget())
      const wrapper = mount(ExpandableImage, {
        props: { src: '/photo.jpg', alt: 'Garden railway' },
        attachTo: document.body,
        global: {
          plugins: [createVuetify({ components: { VDialog } })],
          stubs: { VCard: stubs.VCard, VBtn: stubs.VBtn, VImg: stubs.VImg },
        },
      })
      const trigger = wrapper.find<HTMLButtonElement>('.expandable-image')
      trigger.element.focus()
      await trigger.trigger('click')
      await vi.waitFor(() => {
        expect(document.querySelector('[aria-label="Close image"]')).not.toBeNull()
      })
      const closeButton = document.querySelector<HTMLButtonElement>('[aria-label="Close image"]')!
      closeButton.focus()
      if (dismissal === 'close button') closeButton.click()
      else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await vi.waitFor(() => {
        expect(wrapper.findComponent(VDialog).props('modelValue')).toBe(false)
        expect(document.activeElement).toBe(trigger.element)
      })
    },
  )

  it('opens the full-size image in a full-screen dialog and closes using the close button', async () => {
    const wrapper = mount(ExpandableImage, {
      props: { src: '/photo.jpg', alt: 'Garden railway' },
      global: { stubs },
    })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    const trigger = wrapper.find('.expandable-image')
    expect(trigger.attributes('type')).toBe('button')
    expect(trigger.attributes('aria-label')).toBe('View Garden railway full screen')
    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    expect(trigger.find('img').attributes('src')).toBe('/photo.jpg')

    await trigger.trigger('click')
    expect(wrapper.findComponent(stubs.VDialog).props('fullscreen')).toBe(true)
    const popup = wrapper.find('[role="dialog"]')
    expect(popup.attributes('aria-label')).toBe('Garden railway')
    expect(popup.find('img').attributes('src')).toBe('/photo.jpg')
    expect(popup.find('img').attributes('alt')).toBe('Garden railway')
    await popup.find('[aria-label="Close image"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('accepts dialog dismissal and can be reopened', async () => {
    const wrapper = mount(ExpandableImage, {
      props: { src: '/photo.jpg', alt: 'Garden railway' },
      global: { stubs },
    })
    await wrapper.find('.expandable-image').trigger('click')
    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    await wrapper.find('.expandable-image').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it.each([
    ['About Us', AboutPage],
    ['G-Scale', GScale],
  ] as const)('opens the embedded photo on %s without changing its source', async (_name, page) => {
    const wrapper = mount(page, { global: { stubs } })
    const image = wrapper.find('.expandable-image img')
    const src = image.attributes('src')
    const alt = image.attributes('alt')
    await wrapper.find('.expandable-image').trigger('click')
    expect(wrapper.find('[role="dialog"] img').attributes('src')).toBe(src)
    expect(wrapper.find('[role="dialog"] img').attributes('alt')).toBe(alt)
  })
})
