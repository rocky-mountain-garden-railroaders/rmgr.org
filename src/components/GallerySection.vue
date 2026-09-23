<script setup lang="ts">
type GalleryImage = {
  src: string
  alt: string
  caption: string
}

defineOptions({ name: 'GallerySection' })

defineProps<{
  title: string
  images: GalleryImage[]
}>()

const emit = defineEmits<{
  openImage: [index: number]
}>()
</script>

<template>
  <v-card class="gallery-section h-100 d-flex flex-column" color="transparent" flat>
    <v-card class="image-shell overflow-hidden bg-surface rounded-lg elevation-3 w-100 d-flex flex-column flex-grow-1" flat hover>
      <button class="image-hit-area" type="button" @click="emit('openImage', 0)">
        <v-img :alt="images[0].alt" :aspect-ratio="4 / 3" :src="images[0].src" class="bg-grey-lighten-2" cover>
          <template #placeholder>
            <v-row align="center" class="fill-height ma-0" justify="center">
              <v-progress-circular color="primary" indeterminate />
            </v-row>
          </template>

          <div class="image-title-overlay">
            <span class="text-h6 font-weight-bold text-white">
              {{ title }}
            </span>
          </div>
        </v-img>
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

</style>
