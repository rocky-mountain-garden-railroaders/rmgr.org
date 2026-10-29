import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useImageZoom } from '@/composables/useImageZoom'

enableAutoUnmount(afterEach)

const mountZoom = (initiallyEnabled = true) => {
  const enabled = ref(initiallyEnabled)
  const source = ref('/first.jpg')
  const wrapper = mount(
    defineComponent({
      setup() {
        const { imageStyle, isZoomed, onWheel, updateOrigin } = useImageZoom(
          enabled,
          () => source.value,
        )
        return () =>
          h('div', {
            style: imageStyle.value,
            'data-zoomed': isZoomed.value,
            onWheel,
            onMousemove: updateOrigin,
          })
      },
    }),
  )
  vi.spyOn(wrapper.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 20, 200, 100))
  const wheel = async (deltaY: number, deltaMode = 0) => {
    const event = new WheelEvent('wheel', {
      deltaY,
      deltaMode,
      clientX: 60,
      clientY: 45,
      cancelable: true,
    })
    wrapper.element.dispatchEvent(event)
    await nextTick()
    return event
  }
  return { wrapper, enabled, source, wheel }
}

describe('useImageZoom', () => {
  it('leaves scrolling and image scale unchanged outside fullscreen', async () => {
    const { wrapper, wheel } = mountZoom(false)
    expect((await wheel(-100)).defaultPrevented).toBe(false)
    expect(wrapper.element.style.transform).toBe('scale(1)')
  })

  it('zooms around the pointer and lets pointer movement explore the image', async () => {
    const { wrapper, wheel } = mountZoom()
    expect((await wheel(-100)).defaultPrevented).toBe(true)
    expect(wrapper.attributes('data-zoomed')).toBe('true')
    expect(wrapper.element.style.transform).toBe(`scale(${Math.exp(0.2)})`)
    expect(wrapper.element.style.transformOrigin).toBe('25% 25%')
    await wrapper.trigger('mousemove', { clientX: 210, clientY: 120 })
    expect(wrapper.element.style.transformOrigin).toBe('100% 100%')
    await wheel(100)
    expect(wrapper.element.style.transform).toBe('scale(1)')
  })

  it.each([0, 1, 2])('bounds zoom from 1x to 4x for wheel delta mode %s', async (mode) => {
    const { wrapper, wheel } = mountZoom()
    for (let i = 0; i < 10; i++) await wheel(-200, mode)
    expect(wrapper.element.style.transform).toBe('scale(4)')
    for (let i = 0; i < 10; i++) await wheel(200, mode)
    expect(wrapper.element.style.transform).toBe('scale(1)')
    expect(wrapper.attributes('data-zoomed')).toBe('false')
  })

  it('resets zoom when fullscreen ends or the image changes', async () => {
    const { wrapper, enabled, source, wheel } = mountZoom()
    await wheel(-100)
    source.value = '/second.jpg'
    await nextTick()
    expect(wrapper.element.style.transform).toBe('scale(1)')
    expect(wrapper.element.style.transformOrigin).toBe('50% 50%')
    await wheel(-100)
    enabled.value = false
    await nextTick()
    expect(wrapper.element.style.transform).toBe('scale(1)')
    enabled.value = true
    await nextTick()
    expect(wrapper.element.style.transform).toBe('scale(1)')
  })
})
