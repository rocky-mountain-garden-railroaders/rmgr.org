<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import GallerySection from '@/components/GallerySection.vue'
import { galleryGroups } from '@/utils/galleryImages'

defineOptions({ name: 'ImageGallery' })

const activeGroupIndex = ref(0)
const activeImageIndex = ref(0)
const isLightboxOpen = ref(false)
let slideshowTimer: ReturnType<typeof setTimeout> | null = null
const slideshowDelayMs = 5000

const activeGroup = computed(() => galleryGroups[activeGroupIndex.value] ?? null)
const activeImage = computed(() => activeGroup.value?.images[activeImageIndex.value] ?? null)
const isMobileView = ref(false)
let mediaQuery: MediaQueryList | null = null
const mobileBreakpoint = '(max-width: 1279.98px)'

const updateMobileView = () => {
  isMobileView.value = mediaQuery?.matches ?? false
}

const galleryRows = computed(() => {
  const itemsPerRow = isMobileView.value ? 1 : 3
  const rows: typeof galleryGroups[] = []

  for (let index = 0; index < galleryGroups.length; index += itemsPerRow) {
    rows.push(galleryGroups.slice(index, index + itemsPerRow))
  }

  return rows
})

const openLightbox = (groupIndex: number, imageIndex: number) => {
  activeGroupIndex.value = groupIndex
  activeImageIndex.value = imageIndex
  isLightboxOpen.value = true
}

const showPreviousImage = () => {
  if (!activeGroup.value) return

  activeImageIndex.value =
    (activeImageIndex.value - 1 + activeGroup.value.images.length) % activeGroup.value.images.length
}

const showNextImage = () => {
  if (!activeGroup.value) return

  activeImageIndex.value = (activeImageIndex.value + 1) % activeGroup.value.images.length
}

const clearSlideshowTimer = () => {
  if (slideshowTimer) {
    clearTimeout(slideshowTimer)
    slideshowTimer = null
  }
}

const startSlideshowTimer = () => {
  clearSlideshowTimer()

  if (!isLightboxOpen.value || !activeGroup.value || activeGroup.value.images.length < 2) return

  slideshowTimer = setTimeout(() => {
    showNextImage()
    startSlideshowTimer()
  }, slideshowDelayMs)
}

watch([isLightboxOpen, activeGroupIndex, activeImageIndex], () => {
  if (isLightboxOpen.value) {
    startSlideshowTimer()
  } else {
    clearSlideshowTimer()
  }
})

onBeforeUnmount(() => {
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
            <v-card-title class="text-h4 font-weight-black text-primary pa-0">
              Image Gallery
            </v-card-title>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col class="bg-primary pa-6 pa-sm-12 rounded-b-lg" cols="12">
        <table class="gallery-table">
          <tbody>
            <tr v-for="(row, rowIndex) in galleryRows" :key="rowIndex">
              <td v-for="(group, columnIndex) in row" :key="group.title" class="gallery-cell">
                <GallerySection
                  :images="group.images"
                  :title="group.title"
                  @open-image="openLightbox(rowIndex * (isMobileView ? 1 : 3) + columnIndex, $event)"
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
        <v-card v-if="activeImage" class="bg-surface rounded-lg overflow-hidden" flat>
          <div class="modal-image-shell">
            <v-img
              :alt="activeImage.alt"
              :src="activeImage.src"
              class="bg-black"
              contain
              max-height="75vh"
            />

            <v-btn class="modal-close" color="white" icon="mdi-close" variant="text" @click="isLightboxOpen = false" />
            <v-btn class="modal-nav modal-nav-left" icon size="small" variant="text" @click="showPreviousImage">
              <v-icon icon="mdi-chevron-left" size="36" />
            </v-btn>

            <v-btn class="modal-nav modal-nav-right" icon size="small" variant="text" @click="showNextImage">
              <v-icon icon="mdi-chevron-right" size="36" />
            </v-btn>
          </div>

          <v-card-text class="text-body-1 bg-surface py-4 px-6 text-left text-on-surface border-t">
            {{ activeImage.caption }}
          </v-card-text>
        </v-card>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.border-t {
  border-top: 1px solid rgba(var(--v-theme-primary), 0.1);
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

.modal-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 2;
  color: white;
  background: rgba(0, 0, 0, 0.35);
}

.modal-nav {
  position: absolute;
  top: 0;
  bottom: 0;
  height: auto;
  color: white;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.modal-image-shell:hover .modal-nav {
  opacity: 1;
}

.modal-nav-left {
  left: 0;
}

.modal-nav-right {
  right: 0;
}
</style>
