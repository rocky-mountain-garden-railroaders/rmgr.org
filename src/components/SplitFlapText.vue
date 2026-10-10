<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

defineOptions({ name: 'SplitFlapText' })

const props = withDefaults(
  defineProps<{
    text: string
    delay?: number
    tiles?: boolean
  }>(),
  { delay: 0, tiles: false },
)

const FLAP_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const FLIP_INTERVAL_MS = 55
const MIN_FLIPS = 4
const EXTRA_FLIPS = 6
const MAX_CASCADE_MS = 900

const target = computed(() => props.text.toUpperCase())
const shown = ref<string[]>([])
const settled = ref<boolean[]>([])
const running = ref(false)

let flipTimer: ReturnType<typeof setTimeout> | undefined
let startTimer: ReturnType<typeof setTimeout> | undefined
let observer: IntersectionObserver | undefined
const root = ref<HTMLElement | null>(null)

const randomFlapChar = () => FLAP_CHARSET[Math.floor(Math.random() * FLAP_CHARSET.length)]

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const stop = () => {
  if (flipTimer) clearTimeout(flipTimer)
  if (startTimer) clearTimeout(startTimer)
  flipTimer = undefined
  startTimer = undefined
  running.value = false
}

const showFinal = () => {
  stop()
  shown.value = [...target.value]
  settled.value = shown.value.map(() => true)
}

const animate = () => {
  const chars = [...target.value]
  const step = Math.min(35, MAX_CASCADE_MS / Math.max(chars.length, 1))
  const settleAt = chars.map(
    (_, index) =>
      index * step + (MIN_FLIPS + Math.floor(Math.random() * EXTRA_FLIPS)) * FLIP_INTERVAL_MS,
  )

  shown.value = chars.map((char) => (char === ' ' ? ' ' : randomFlapChar()))
  settled.value = chars.map((char) => char === ' ')
  running.value = true

  const startedAt = Date.now()

  const tick = () => {
    const elapsed = Date.now() - startedAt
    let remaining = false

    shown.value = chars.map((char, index) => {
      if (settled.value[index]) return char
      if (elapsed >= settleAt[index]) {
        settled.value[index] = true
        return char
      }
      remaining = true
      return randomFlapChar()
    })

    if (remaining) flipTimer = setTimeout(tick, FLIP_INTERVAL_MS)
    else running.value = false
  }

  flipTimer = setTimeout(tick, FLIP_INTERVAL_MS)
}

const showBlank = () => {
  shown.value = [...target.value].map(() => ' ')
  settled.value = shown.value.map(() => false)
}

const start = () => {
  stop()
  showBlank()
  startTimer = setTimeout(animate, props.delay)
}

const startWhenVisible = () => {
  observer?.disconnect()
  observer = undefined

  if (prefersReducedMotion()) {
    showFinal()
    return
  }

  if (typeof IntersectionObserver === 'undefined' || !root.value) {
    start()
    return
  }

  stop()
  showBlank()

  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer?.disconnect()
      observer = undefined
      start()
    }
  })
  observer.observe(root.value)
}

type FlapWord = { index: number; chars: { char: string; index: number }[]; gap?: number }

const words = computed(() => {
  const groups: FlapWord[] = []
  let current: { char: string; index: number }[] = []

  shown.value.forEach((_, index) => {
    if (target.value[index] === ' ') {
      if (current.length) groups.push({ index: groups.length, chars: current, gap: index })
      current = []
      return
    }
    current.push({ char: shown.value[index], index })
  })
  if (current.length) groups.push({ index: groups.length, chars: current })

  return groups
})

const charIndexOf = (node: Node) => {
  const element = node instanceof Element ? node : node.parentElement
  const owner = element?.closest<HTMLElement>('[data-index]')
  return owner && root.value?.contains(owner) ? Number(owner.dataset.index) : undefined
}

const copyOriginalText = (event: ClipboardEvent) => {
  const selection = window.getSelection()
  if (!root.value || !event.clipboardData || !selection?.rangeCount || selection.isCollapsed) return

  const range = selection.getRangeAt(0)
  if (!root.value.contains(range.startContainer)) return

  const source = props.text.length === target.value.length ? props.text : target.value
  const startIndex = charIndexOf(range.startContainer)
  const endIndex = charIndexOf(range.endContainer)
  const start = startIndex === undefined ? 0 : startIndex + (range.startOffset > 0 ? 1 : 0)
  const end = endIndex === undefined ? source.length : endIndex + (range.endOffset > 0 ? 1 : 0)

  const endsInside = root.value.contains(range.endContainer)
  if (!endsInside && selection.toString().trim() !== target.value.slice(start).trim()) return

  event.clipboardData.setData('text/plain', source.slice(start, end).trim())
  event.preventDefault()
}

onMounted(startWhenVisible)

watch(target, startWhenVisible)

onBeforeUnmount(() => {
  stop()
  observer?.disconnect()
})
</script>

<template>
  <span ref="root" :class="{ 'split-flap--tiles': tiles }" class="split-flap" @copy="copyOriginalText">
    <span class="split-flap-sr">{{ text }}</span>
    <span aria-hidden="true" class="split-flap-words">
      <template v-for="word in words" :key="word.index">
        <span class="split-flap-word">
          <span
            v-for="cell in word.chars"
            :key="cell.index"
            :class="{
              'split-flap-cell--turning': running && !settled[cell.index],
              'split-flap-cell--settled': settled[cell.index],
            }"
            :data-char="cell.char"
            :data-index="cell.index"
            class="split-flap-cell"
          >{{ cell.char }}</span>
        </span>
        <span v-if="word.gap !== undefined" :data-index="word.gap" class="split-flap-gap">{{ ' ' }}</span>
      </template>
    </span>
  </span>
</template>

<style scoped>
.split-flap {
  --flap-face: rgb(var(--v-theme-on-surface, 30, 28, 15));
  --flap-highlight: color-mix(in srgb, var(--flap-face) 88%, white);
  --flap-shadow: color-mix(in srgb, var(--flap-face) 70%, black);

  display: inline-block;
  max-width: 100%;
}

.split-flap-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  user-select: none;
}

.split-flap-word {
  white-space: nowrap;
}

.split-flap--tiles .split-flap-gap {
  font-size: 0.6em;
}

.split-flap-cell {
  position: relative;
  isolation: isolate;
  display: inline-block;
  min-width: 1ch;
  text-align: center;
}

.split-flap--tiles .split-flap-cell {
  min-width: 1ch;
  margin-right: 1px;
  padding: 0.1em 0.1em;
  line-height: 1.15;
  letter-spacing: 0;
  background: var(--flap-face);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px var(--flap-shadow);
}

.split-flap-cell::selection,
.split-flap-gap::selection {
  color: inherit;
  background: rgba(var(--v-theme-secondary, 183, 140, 41), 0.45);
}

.split-flap--tiles .split-flap-cell::before,
.split-flap--tiles .split-flap-cell::after {
  position: absolute;
  content: '';
  opacity: 1;
  transition: opacity 240ms ease;
}

.split-flap--tiles .split-flap-cell::before {
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    var(--flap-highlight),
    var(--flap-face) 50%,
    var(--flap-highlight) 50%,
    var(--flap-face)
  );
}

.split-flap--tiles .split-flap-cell::after {
  inset: calc(50% - 0.5px) 0 auto;
  height: 1px;
  background: var(--flap-shadow);
}

.split-flap--tiles .split-flap-cell--settled::before,
.split-flap--tiles .split-flap-cell--settled::after {
  opacity: 0;
}

.split-flap-cell--turning {
  animation: flap-turn 55ms linear infinite;
  transform-origin: center;
}

@keyframes flap-turn {
  0% {
    transform: perspective(200px) rotateX(0deg);
  }

  50% {
    transform: perspective(200px) rotateX(-70deg);
    filter: brightness(0.7);
  }

  100% {
    transform: perspective(200px) rotateX(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .split-flap--tiles .split-flap-cell::before,
  .split-flap--tiles .split-flap-cell::after {
    transition: none;
  }

  .split-flap-cell--turning {
    animation: none;
  }
}
</style>
