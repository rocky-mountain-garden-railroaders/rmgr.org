import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export const useImageFullscreen = (isOpen: Ref<boolean>) => {
  const viewer = ref<HTMLDivElement | null>(null)
  const fullscreenSupported = ref(false)
  const isFullscreen = ref(false)
  const fullscreenError = ref('')

  const updateFullscreen = () => {
    isFullscreen.value = document.fullscreenElement === viewer.value && viewer.value !== null
  }

  const exitFullscreen = async () => {
    if (viewer.value && document.fullscreenElement === viewer.value) {
      await document.exitFullscreen()
    }
  }

  const toggleFullscreen = async () => {
    fullscreenError.value = ''
    try {
      if (isFullscreen.value) {
        await exitFullscreen()
      } else {
        await viewer.value?.requestFullscreen()
      }
    } catch {
      fullscreenError.value = 'Unable to change fullscreen mode. Please try again.'
    }
  }

  watch(isOpen, async (open) => {
    fullscreenError.value = ''
    if (!open) {
      try {
        await exitFullscreen()
      } catch {
        fullscreenError.value = 'Unable to exit fullscreen. Press Escape to exit.'
      }
    }
  })

  onMounted(() => {
    fullscreenSupported.value = Boolean(document.fullscreenEnabled)
    document.addEventListener('fullscreenchange', updateFullscreen)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', updateFullscreen)
  })

  return { viewer, fullscreenSupported, isFullscreen, fullscreenError, toggleFullscreen }
}
