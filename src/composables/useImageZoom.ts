import { computed, ref, watch, type Ref } from 'vue'

export const useImageZoom = (enabled: Ref<boolean>, source: () => string | undefined) => {
  const scale = ref(1)
  const origin = ref('50% 50%')
  const isZoomed = computed(() => scale.value > 1)
  const imageStyle = computed(() => ({
    transform: `scale(${scale.value})`,
    transformOrigin: origin.value,
  }))

  const updateOrigin = (event: MouseEvent) => {
    if (!enabled.value || !isZoomed.value) return

    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
    if (!bounds.width || !bounds.height) return

    const x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))
    const y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100))
    origin.value = `${x}% ${y}%`
  }

  const onWheel = (event: WheelEvent) => {
    if (!enabled.value || event.deltaY === 0) return

    event.preventDefault()
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 800 : 1
    const delta = Math.max(-200, Math.min(200, event.deltaY * unit))
    scale.value = Math.max(1, Math.min(4, scale.value * Math.exp(-delta * 0.002)))
    updateOrigin(event)
  }

  watch([enabled, source], () => {
    scale.value = 1
    origin.value = '50% 50%'
  })

  return { imageStyle, isZoomed, onWheel, updateOrigin }
}
