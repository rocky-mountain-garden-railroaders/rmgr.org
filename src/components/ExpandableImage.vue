<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  src: string
  alt: string
}>()

const isOpen = ref(false)
</script>

<template>
  <button
    class="expandable-image"
    type="button"
    :aria-label="`View ${alt} full screen`"
    aria-haspopup="dialog"
    @click="isOpen = true"
  >
    <slot>
      <img :src="src" :alt="alt" class="content-image" />
    </slot>
  </button>
  <v-dialog v-model="isOpen" fullscreen :aria-label="alt">
    <v-card class="image-popup" color="black" rounded="0">
      <v-btn
        class="image-popup-close"
        icon="mdi-close"
        aria-label="Close image"
        color="white"
        variant="text"
        @click="isOpen = false"
      />
      <v-img :src="src" :alt="alt" class="image-popup-photo" height="100%" />
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

.image-popup-photo {
  min-height: 0;
}

.image-popup-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.6);
}
</style>
