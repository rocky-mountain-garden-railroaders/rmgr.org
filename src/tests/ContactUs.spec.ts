import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createVuetify } from 'vuetify'
import { VForm, VSelect, VTextarea, VTextField } from 'vuetify/components'
import ContactUs from '../views/ContactUs.vue'

enableAutoUnmount(afterEach)

const mountContactUs = () =>
  mount(ContactUs, {
    global: {
      plugins: [createVuetify({ components: { VForm, VSelect, VTextarea, VTextField } })],
    },
  })

describe('ContactUs', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('GIVEN the form is filled WHEN submitted THEN it posts to Formspree and resets the form', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response)
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>

    const wrapper = mountContactUs()

    const vm = wrapper.vm as unknown as {
      formData: { name: string; email: string; subject: string | null; message: string }
      isFormValid: boolean
      showSnackbar: boolean
    }

    vm.formData.name = 'Tyler S'
    vm.formData.email = 'tyler@example.com'
    vm.formData.subject = 'General Inquiry'
    vm.formData.message = 'I would like more information about the club.'
    await flushPromises()
    vm.isFormValid = true

    await (wrapper.vm as unknown as { handleSubmit: () => Promise<void> }).handleSubmit()
    await flushPromises()

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://formspree.io/f/xrpbgrek',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Tyler S',
          email: 'tyler@example.com',
          subject: 'General Inquiry',
          message: 'I would like more information about the club.',
        }),
      }),
    )
    expect(fetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({
        name: 'Tyler S',
        email: 'tyler@example.com',
        subject: 'General Inquiry',
        message: 'I would like more information about the club.',
      }),
    )
    expect(vm.showSnackbar).toBe(true)
    expect(wrapper.findComponent(VTextField).find('input').element.value).toBe('')
    expect(wrapper.findComponent(VTextarea).find('textarea').element.value).toBe('')
    expect(wrapper.findComponent(VSelect).props('modelValue')).toBeNull()
    expect(wrapper.findAllComponents(VTextField).every((field) => !field.props('modelValue'))).toBe(true)
  })

  it('GIVEN the form is invalid WHEN submitted THEN it does not show the snackbar', async () => {
    const wrapper = mountContactUs()

    const vm = wrapper.vm as unknown as {
      isFormValid: boolean
      showSnackbar: boolean
      handleSubmit: () => Promise<void>
    }

    vm.isFormValid = false

    await vm.handleSubmit()
    await nextTick()

    expect(vm.showSnackbar).toBe(false)
  })

  it('GIVEN the API returns an error WHEN submitted THEN it shows an error message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)

    const wrapper = mountContactUs()

    const vm = wrapper.vm as unknown as {
      formData: { name: string; email: string; subject: string | null; message: string }
      isFormValid: boolean
      showSnackbar: boolean
      errorMessage: string
      handleSubmit: () => Promise<void>
    }

    vm.formData.name = 'Tyler S'
    vm.formData.email = 'tyler@example.com'
    vm.formData.subject = 'General Inquiry'
    vm.formData.message = 'I would like more information about the club.'
    await flushPromises()
    vm.isFormValid = true

    await vm.handleSubmit()
    await nextTick()

    expect(vm.showSnackbar).toBe(false)
    expect(vm.errorMessage).toBe('Unable to send your message.')
  })
})
