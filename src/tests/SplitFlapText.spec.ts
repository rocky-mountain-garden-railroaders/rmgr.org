import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import SplitFlapText from '../components/SplitFlapText.vue'

const visibleChars = (wrapper: ReturnType<typeof mount>) =>
  wrapper
    .findAll('.split-flap-word')
    .map((word) =>
      word
        .findAll('.split-flap-cell')
        .map((cell) => cell.attributes('data-char'))
        .join(''),
    )
    .join(' ')

const stubReducedMotion = (reduce: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )

describe('SplitFlapText', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('GIVEN any text WHEN rendered THEN the readable text is the original string, not the flap characters', () => {
    stubReducedMotion(false)
    const wrapper = mount(SplitFlapText, { props: { text: 'Zoo Lights' } })

    expect(wrapper.find('.split-flap-sr').text()).toBe('Zoo Lights')
    expect(wrapper.find('.split-flap-words').attributes('aria-hidden')).toBe('true')
  })

  it('GIVEN motion is allowed WHEN the animation runs THEN the flaps turn and then settle on the text', async () => {
    stubReducedMotion(false)
    const wrapper = mount(SplitFlapText, { props: { text: 'Zoo Lights', delay: 100 } })

    await vi.advanceTimersByTimeAsync(160)
    await nextTick()
    expect(wrapper.findAll('.split-flap-cell--turning').length).toBeGreaterThan(0)

    await vi.advanceTimersByTimeAsync(3000)
    await nextTick()
    expect(visibleChars(wrapper)).toBe('ZOO LIGHTS')
    expect(wrapper.findAll('.split-flap-cell--turning')).toHaveLength(0)
  })

  it('GIVEN reduced motion is preferred WHEN rendered THEN the final text shows immediately without turning', async () => {
    stubReducedMotion(true)
    const wrapper = mount(SplitFlapText, { props: { text: 'Supertrain 2027' } })
    await nextTick()

    expect(visibleChars(wrapper)).toBe('SUPERTRAIN 2027')
    expect(wrapper.findAll('.split-flap-cell--turning')).toHaveLength(0)
  })

  it('GIVEN the text changes WHEN the animation finishes THEN the flaps show the new text', async () => {
    stubReducedMotion(false)
    const wrapper = mount(SplitFlapText, { props: { text: 'Old' } })
    await vi.advanceTimersByTimeAsync(3000)

    await wrapper.setProps({ text: 'New' })
    await vi.advanceTimersByTimeAsync(3000)
    await nextTick()

    expect(visibleChars(wrapper)).toBe('NEW')
    expect(wrapper.find('.split-flap-sr').text()).toBe('New')
  })

  it('GIVEN part of the flaps are selected WHEN copied THEN the clipboard gets that part in its original case', async () => {
    vi.useRealTimers()
    stubReducedMotion(true)
    const wrapper = mount(SplitFlapText, {
      props: { text: '2715 Dovely Park SE', tiles: true },
      attachTo: document.body,
    })
    await nextTick()

    const cells = wrapper.findAll('.split-flap-cell').map((cell) => cell.element)
    const range = document.createRange()
    range.setStart(cells[1].firstChild!, 0)
    range.setEnd(cells[9].firstChild!, 1)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)

    const setData = vi.fn()
    const copyEvent = Object.assign(new Event('copy', { bubbles: true, cancelable: true }), {
      clipboardData: { setData },
    })
    cells[1].dispatchEvent(copyEvent)

    expect(setData).toHaveBeenCalledWith('text/plain', '715 Dovely')
    expect(copyEvent.defaultPrevented).toBe(true)
    wrapper.unmount()
  })
})
