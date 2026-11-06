<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import GallerySection from '@/components/GallerySection.vue'
import { galleryGroups } from '@/utils/galleryImages'
import { useRoute } from 'vue-router'
import { useImageFullscreen } from '@/composables/useImageFullscreen'
import { useImageZoom } from '@/composables/useImageZoom'

defineOptions({ name: 'ImageGallery' })

const route = useRoute()
const isGalleryDebugEnabled = computed(() => route.query.galleryDebug === 'true')
const activeGroupIndex = ref<number | null>(null)
const activeMediaIndex = ref(0)
const isLightboxOpen = ref(false)
const { viewer, fullscreenSupported, isFullscreen, fullscreenError, toggleFullscreen } =
  useImageFullscreen(isLightboxOpen)
let slideshowTimer: ReturnType<typeof setTimeout> | null = null
const slideshowDelayMs = 5000

const activeGroup = computed(() =>
  activeGroupIndex.value === null ? null : (galleryGroups[activeGroupIndex.value] ?? null),
)
const activeMedia = computed(() =>
  isLightboxOpen.value ? (activeGroup.value?.media[activeMediaIndex.value] ?? null) : null,
)
const { imageStyle, isZoomed, onWheel, updateOrigin } = useImageZoom(
  computed(() => isLightboxOpen.value && isFullscreen.value && activeMedia.value?.kind === 'image'),
  () => activeMedia.value?.src,
)
const hasMultipleMedia = computed(() => (activeGroup.value?.media.length ?? 0) > 1)
const isMobileView = ref(false)
let mediaQuery: MediaQueryList | null = null
const mobileBreakpoint = '(max-width: 1279.98px)'
const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

const isSlideshowPaused = ref(false)
const activeVideo = ref<HTMLVideoElement | null>(null)
const videoError = ref('')
const videoAutoplayBlocked = ref(false)
watch(
  activeMedia,
  (media) => {
    activeVideo.value?.pause()
    videoError.value = ''
    videoAutoplayBlocked.value = false
    if (media?.kind === 'video') isSlideshowPaused.value = true
  },
  { flush: 'pre' },
)
watch(
  [activeMedia, isLightboxOpen],
  ([media, isOpen]) => {
    const video = activeVideo.value
    if (!isOpen || media?.kind !== 'video' || !video) return

    video.muted = true
    video.play().catch(() => {
      if (activeMedia.value === media && isLightboxOpen.value && activeVideo.value === video) {
        videoAutoplayBlocked.value = true
      }
    })
  },
  { flush: 'post' },
)
watch(isZoomed, (zoomed) => {
  if (zoomed) isSlideshowPaused.value = true
})
const shouldAutoplay = computed(
  () =>
    isLightboxOpen.value &&
    hasMultipleMedia.value &&
    !isSlideshowPaused.value &&
    activeMedia.value?.kind === 'image',
)

const prefersReducedMotion = () => window.matchMedia(reducedMotionQuery).matches

const updateMobileView = () => {
  isMobileView.value = mediaQuery?.matches ?? false
}

const galleryRows = computed(() => {
  const itemsPerRow = isMobileView.value ? 1 : 3
  const rows: (typeof galleryGroups)[] = []

  for (let index = 0; index < galleryGroups.length; index += itemsPerRow) {
    rows.push(galleryGroups.slice(index, index + itemsPerRow))
  }

  return rows
})

const openLightbox = (groupIndex: number, imageIndex: number) => {
  activeGroupIndex.value = groupIndex
  activeMediaIndex.value = imageIndex
  isSlideshowPaused.value = prefersReducedMotion()
  isLightboxOpen.value = true
}

const toggleSlideshow = () => {
  isSlideshowPaused.value = !isSlideshowPaused.value
}

const showPreviousSlide = () => {
  if (!activeGroup.value) return

  activeMediaIndex.value =
    (activeMediaIndex.value - 1 + activeGroup.value.media.length) % activeGroup.value.media.length
}

const showNextSlide = () => {
  if (!activeGroup.value) return

  activeMediaIndex.value = (activeMediaIndex.value + 1) % activeGroup.value.media.length
}

const clearSlideshowTimer = () => {
  if (slideshowTimer) {
    clearTimeout(slideshowTimer)
    slideshowTimer = null
  }
}

const startSlideshowTimer = () => {
  clearSlideshowTimer()

  if (!shouldAutoplay.value) return

  slideshowTimer = setTimeout(() => {
    showNextSlide()
    startSlideshowTimer()
  }, slideshowDelayMs)
}

watch([shouldAutoplay, activeGroupIndex, activeMediaIndex], startSlideshowTimer)

onBeforeUnmount(() => {
  activeVideo.value?.pause()
  clearSlideshowTimer()
})

onMounted(() => {
  mediaQuery = window.matchMedia(mobileBreakpoint)
  updateMobileView()
  mediaQuery.addEventListener('change', updateMobileView)
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', updateMobileView)
})
</script>

<template>
  <v-container class="pa-6 pa-md-8 bg-background" fluid>
    <v-row class="gallery-page-shell" justify="center" no-gutters>
      <v-col class="bg-surface pa-6 pa-sm-12 rounded-t-lg" cols="12">
        <v-card class="w-100 bg-surface" flat>
          <v-card-item class="pa-0">
            <v-card-title class="text-headline-large font-weight-black text-primary pa-0">
              Image Gallery
            </v-card-title>
            <v-card-subtitle class="pa-0 mt-2 text-body-large text-medium-emphasis text-wrap">
              Each preview below is a gallery folder &mdash; click one to browse a slideshow of all
              of its photos and videos.
            </v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col class="bg-primary pa-6 pa-sm-12 rounded-b-lg" cols="12">
        <table class="gallery-table">
          <tbody>
            <tr v-for="(row, rowIndex) in galleryRows" :key="rowIndex">
              <td v-for="(group, columnIndex) in row" :key="group.title" class="gallery-cell">
                <GallerySection
                  :description="group.description"
                  :cover="group.cover"
                  :media-count="group.media.length"
                  :video-count="group.media.filter((item) => item.kind === 'video').length"
                  :title="group.title"
                  @open-image="
                    openLightbox(rowIndex * (isMobileView ? 1 : 3) + columnIndex, $event)
                  "
                />
              </td>
              <td
                v-for="emptyIndex in (isMobileView ? 1 : 3) - row.length"
                :key="`empty-${rowIndex}-${emptyIndex}`"
                class="gallery-cell gallery-cell-empty"
              />
            </tr>
          </tbody>
        </table>
      </v-col>
    </v-row>

    <v-dialog v-model="isLightboxOpen" max-width="1000" scrollable>
      <v-card class="text-right" color="transparent" flat>
        <div ref="viewer" class="gallery-fullscreen-viewer">
          <v-card
            v-if="activeMedia"
            class="bg-surface rounded-lg overflow-hidden lightbox-viewer"
            flat
          >
            <div class="modal-image-shell">
              <v-btn
                v-if="fullscreenSupported"
                class="modal-fullscreen-toggle"
                :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
                :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
                :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
                :aria-pressed="isFullscreen"
                color="white"
                variant="text"
                @click="toggleFullscreen"
              />
              <div
                v-if="activeMedia.kind === 'image'"
                class="modal-image-viewport"
                :class="{ 'is-zoomed': isZoomed }"
                @wheel="onWheel"
                @mousemove="updateOrigin"
              >
                <v-img
                  :key="activeMedia.src"
                  :alt="activeMedia.alt"
                  :src="activeMedia.src"
                  :style="imageStyle"
                  class="bg-black"
                  contain
                  eager
                  max-height="75vh"
                />
              </div>
              <div v-else class="modal-video-viewport">
                <video
                  :key="activeMedia.src"
                  ref="activeVideo"
                  class="gallery-video"
                  :src="activeMedia.src"
                  :aria-label="activeMedia.alt"
                  muted
                  controls
                  playsinline
                  preload="none"
                  @playing="videoAutoplayBlocked = false"
                  @error="
                    videoError =
                      'This video could not be played. Try opening the MP4 directly or use a browser that supports its codec.'
                  "
                >
                  Your browser does not support MP4 video.
                </video>
                <p v-if="videoError" role="alert" class="video-error">{{ videoError }}</p>
                <p v-else-if="videoAutoplayBlocked" role="status" class="video-help">
                  Autoplay was blocked. Press Play to start the video; playback starts muted.
                </p>
                <p class="video-help">
                  Video starts muted. Use the video controls to play or unmute.
                  <a :href="activeMedia.src" target="_blank" rel="noopener">Open MP4 directly</a>
                </p>
              </div>

              <v-btn
                v-if="hasMultipleMedia && activeMedia.kind === 'image'"
                :aria-label="isSlideshowPaused ? 'Play slideshow' : 'Pause slideshow'"
                class="modal-slideshow-toggle"
                color="white"
                icon
                :title="isSlideshowPaused ? 'Play slideshow' : 'Pause slideshow'"
                variant="text"
                @click="toggleSlideshow"
              >
                <v-icon aria-hidden="true" :icon="isSlideshowPaused ? 'mdi-play' : 'mdi-pause'" />
              </v-btn>
              <v-btn
                aria-label="Close gallery viewer"
                class="modal-close"
                color="white"
                icon="mdi-close"
                variant="text"
                @click="isLightboxOpen = false"
              />
              <v-btn
                v-if="hasMultipleMedia"
                aria-label="Previous slide"
                class="modal-nav modal-nav-left"
                icon
                :ripple="false"
                size="small"
                variant="text"
                @click="showPreviousSlide"
              >
                <v-icon aria-hidden="true" icon="mdi-chevron-left" size="36" />
              </v-btn>

              <v-btn
                v-if="hasMultipleMedia"
                aria-label="Next slide"
                class="modal-nav modal-nav-right"
                icon
                :ripple="false"
                size="small"
                variant="text"
                @click="showNextSlide"
              >
                <v-icon aria-hidden="true" icon="mdi-chevron-right" size="36" />
              </v-btn>
            </div>
            <p v-if="fullscreenError" role="alert" class="fullscreen-error">
              {{ fullscreenError }}
            </p>

            <v-card-text
              v-if="isGalleryDebugEnabled"
              class="gallery-debug-filename bg-surface py-2 px-6 text-left border-t"
            >
              Filename: <code>{{ activeMedia.fileName }}</code>
            </v-card-text>

            <v-card-text
              v-if="activeMedia.caption"
              class="text-body-large bg-surface py-4 px-6 text-left text-on-surface border-t"
            >
              {{ activeMedia.caption }}
            </v-card-text>
          </v-card>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.border-t {
  border-top: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.gallery-debug-filename {
  overflow-wrap: anywhere;
  user-select: text;
}

.gallery-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 2rem;
  empty-cells: show;
}

.gallery-cell {
  width: 33.333%;
  vertical-align: top;
}

@media (max-width: 1279.98px) {
  .gallery-cell {
    width: 100%;
  }
}

.gallery-cell-empty {
  padding: 0;
}

.gallery-page-shell {
  max-width: 1680px;
  margin: 0 auto;
}

.modal-image-shell {
  position: relative;
}

.modal-image-viewport {
  overflow: hidden;
}

.modal-video-viewport {
  padding-top: 3.75rem;
  background: black;
  color: white;
  text-align: center;
}

.gallery-video {
  display: block;
  width: 100%;
  height: min(60vh, 560px);
  object-fit: contain;
}

.video-help,
.video-error {
  padding: 0.75rem 3rem;
}

.video-help a {
  color: white;
  text-decoration: underline;
}

.gallery-fullscreen-viewer:fullscreen .gallery-video {
  height: calc(100dvh - 12rem);
}

.modal-video-viewport ~ .modal-nav {
  top: 3.75rem;
  bottom: auto;
  height: 3rem;
}

.gallery-fullscreen-viewer:fullscreen .modal-image-viewport {
  cursor: zoom-in;
}

.gallery-fullscreen-viewer:fullscreen .modal-image-viewport.is-zoomed {
  cursor: move;
}

.modal-close,
.modal-fullscreen-toggle,
.modal-slideshow-toggle {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 2;
  color: white;
  background: rgba(0, 0, 0, 0.35);
}

.modal-slideshow-toggle {
  right: 3.75rem;
}

.modal-fullscreen-toggle {
  right: 7rem;
}

.gallery-fullscreen-viewer:fullscreen {
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;
  overflow: auto;
}

.gallery-fullscreen-viewer:fullscreen .lightbox-viewer {
  width: 100%;
  border-radius: 0 !important;
}

.gallery-fullscreen-viewer:fullscreen :deep(.v-img) {
  max-height: calc(100dvh - 8rem) !important;
  height: calc(100dvh - 8rem);
}

.fullscreen-error {
  padding: 8px;
  color: white;
  background: black;
}

.modal-nav {
  position: absolute;
  top: 0;
  bottom: 0;
  height: auto;
  color: white;
  opacity: 1;
  background: transparent;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.85));
}

.modal-nav:hover,
.modal-nav:focus-visible {
  background: transparent;
}

.modal-nav :deep(.v-btn__overlay),
.modal-nav :deep(.v-btn__underlay) {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .modal-nav {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .modal-image-shell:hover .modal-nav,
  .modal-image-shell:focus-within .modal-nav,
  .modal-nav:focus-visible {
    opacity: 1;
  }
}

.modal-nav:focus-visible,
.modal-close:focus-visible,
.modal-slideshow-toggle:focus-visible {
  outline: 2px solid white;
  outline-offset: -2px;
}

@media (prefers-reduced-motion: reduce) {
  .modal-nav {
    transition: none;
  }
}

.modal-nav-left {
  left: 0;
}

.modal-nav-right {
  right: 0;
}
</style>
