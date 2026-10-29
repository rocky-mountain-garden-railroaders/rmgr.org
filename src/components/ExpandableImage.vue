<script setup lang="ts">
import { computed, ref } from 'vue'
import { useImageFullscreen } from '@/composables/useImageFullscreen'
import { useImageZoom } from '@/composables/useImageZoom'

const props = defineProps<{
  src: string
  alt: string
}>()

const isOpen = ref(false)
const { viewer, fullscreenSupported, isFullscreen, fullscreenError, toggleFullscreen } =
  useImageFullscreen(isOpen)
const { imageStyle, isZoomed, onWheel, updateOrigin } = useImageZoom(
  computed(() => isOpen.value && isFullscreen.value),
  () => props.src,
)
</script>

<template>
  <v-dialog v-model="isOpen" fullscreen :aria-label="alt">
    <template #activator="{ props: activatorProps }">
      <button
        v-bind="activatorProps"
        class="expandable-image"
        type="button"
        :aria-label="`View ${alt} full screen`"
      >
        <slot>
          <img :src="src" :alt="alt" class="content-image" />
        </slot>
      </button>
    </template>
    <v-card class="image-popup" color="black" rounded="0">
      <div ref="viewer" class="image-popup-viewer">
        <v-btn
          v-if="fullscreenSupported"
          class="image-popup-fullscreen"
          :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          :aria-pressed="isFullscreen"
          color="white"
          variant="text"
          @click="toggleFullscreen"
        />
        <v-btn
          class="image-popup-close"
          icon="mdi-close"
          aria-label="Close image"
          color="white"
          variant="text"
          @click="isOpen = false"
        />
        <div
          class="image-popup-viewport"
          :class="{ 'is-zoomed': isZoomed }"
          @wheel="onWheel"
          @mousemove="updateOrigin"
        >
          <v-img
            :src="src"
            :alt="alt"
            :style="imageStyle"
            class="image-popup-photo"
            height="100%"
          />
        </div>
        <p v-if="fullscreenError" role="alert" class="image-popup-error">{{ fullscreenError }}</p>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.expandable-image {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: zoom-in;
}

.expandable-image:focus-visible {
  outline: 3px solid rgb(var(--v-theme-secondary));
  outline-offset: -3px;
}

.image-popup {
  height: 100%;
}

.image-popup-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  background: black;
}

.image-popup-photo {
  min-height: 0;
}

.image-popup-viewport {
  height: 100%;
  overflow: hidden;
}

.image-popup-viewer:fullscreen .image-popup-viewport {
  cursor: zoom-in;
}

.image-popup-viewer:fullscreen .image-popup-viewport.is-zoomed {
  cursor: move;
}

.image-popup-close,
.image-popup-fullscreen {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.6);
}

.image-popup-fullscreen {
  right: 72px;
}

.image-popup-error {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  padding: 8px;
  color: white;
  background: rgba(0, 0, 0, 0.8);
}
</style>
