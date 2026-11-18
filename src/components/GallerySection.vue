<script setup lang="ts">
import type { GalleryImage } from '@/utils/galleryImages'

defineOptions({ name: 'GallerySection' })

withDefaults(
  defineProps<{
    title: string
    cover?: GalleryImage
    mediaCount: number
    videoCount?: number
    description?: string
  }>(),
  { description: '', videoCount: 0 },
)

const emit = defineEmits<{
  openImage: [index: number]
}>()
</script>

<template>
  <v-card class="gallery-section h-100 d-flex flex-column" color="transparent" flat>
    <v-card
      class="image-shell overflow-hidden bg-surface rounded-lg elevation-3 w-100 d-flex flex-column flex-grow-1"
      flat
      hover
    >
      <button
        class="image-hit-area"
        type="button"
        :title="`View ${title} gallery (${mediaCount} ${videoCount ? 'item' : 'photo'}${mediaCount === 1 ? '' : 's'}${videoCount ? `, ${videoCount} video${videoCount === 1 ? '' : 's'}` : ''})`"
        @click="emit('openImage', 0)"
      >
        <v-img
          v-if="cover"
          :alt="cover.alt"
          :aspect-ratio="4 / 3"
          :src="cover.src"
          :eager="false"
          class="bg-grey-lighten-2"
          cover
        >
          <template #placeholder>
            <v-row align="center" class="fill-height ma-0" justify="center">
              <v-progress-circular color="primary" indeterminate />
            </v-row>
          </template>

          <div class="image-title-overlay">
            <span class="text-title-large font-weight-bold text-white d-block">
              {{ title }}
            </span>
            <span v-if="description" class="text-body-medium text-white d-block mt-1 opacity-90">
              {{ description }}
            </span>
          </div>
        </v-img>
        <div v-else class="video-gallery-cover bg-grey-darken-3 text-white">
          <v-icon icon="mdi-video" aria-hidden="true" size="48" />
          <span class="text-title-large font-weight-bold">{{ title }}</span>
          <span v-if="description">{{ description }}</span>
        </div>
      </button>
    </v-card>
  </v-card>
</template>

<style scoped>
.gallery-section {
  min-height: 100%;
}

.image-hit-area {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.image-title-overlay {
  position: absolute;
  inset: auto 0 0 0;
  padding: 1.1rem 1rem 0.95rem;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.7));
}

.video-gallery-cover {
  aspect-ratio: 4 / 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
}
</style>
