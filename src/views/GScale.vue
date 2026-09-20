<script lang="ts" setup>
import historyImage from '@/assets/20260624_135226.jpg'

defineOptions({ name: 'GScaleInfo' })
</script>

<template>
  <v-container class="pa-4 pa-sm-8 bg-background" fluid>
    <v-row justify="center" no-gutters>
      <v-col class="bg-surface pa-6 pa-sm-12 rounded-t-lg" cols="12">
        <v-card class="w-100 bg-surface" flat>
          <v-card-item class="pa-0 mb-6">
            <v-card-title class="text-h4 font-weight-black text-primary pa-0">
              What is G-Scale Model Railroading?
            </v-card-title>
          </v-card-item>

          <v-card-text class="pa-0 text-body-1 text-on-surface">
            <v-row class="mb-2" align="center">
              <v-col class="pe-md-6 mb-4 mb-md-0" cols="12" md="6">
                <p class="body-copy mb-0">
                  <span class="font-weight-bold text-primary">G-Scale</span> (also known as
                  G-Gauge) is a model scale (size) best known for <em>garden railways</em>—outdoor
                  layouts where model trains run through real landscapes (The G in G-Scale means
                  garden). Trains run on <span class="font-weight-medium">45mm track</span>, and
                  the scale of the models typically range from 1:20.3 to 1:32, with 1:22.5 being
                  the most common.
                </p>

                <div class="text-h5 font-weight-bold text-primary mt-6 mb-3">History of G-Scale</div>
                <p class="body-copy mb-4">
                  First introduced in the 1930s, G-Scale was initially popular among European
                  modelers who wanted larger, more detailed trains for backyard garden and attic
                  layouts. After WWII, residential shifts caused manufacturing trends to heavily
                  favor much smaller model train scales.
                </p>

                <div class="text-h5 font-weight-bold text-primary mb-3">The Outdoor Revolution</div>
                <p class="body-copy mb-0">
                  In 1968, the German company LGB (Lehmann Gross Bahn) fundamentally revolutionized
                  the market by introducing durable, completely weather-resistant trains made
                  specifically for permanent outdoor use. Their mechanical innovation helped fully
                  reinvigorate large-scale modeling into a thriving movement.
                </p>
              </v-col>

              <v-col cols="12" md="6">
                <div class="content-image-frame elevation-4">
                  <img
                    :src="historyImage"
                    alt="G-Scale garden railway layout"
                    class="content-image"
                  />
                </div>
              </v-col>
            </v-row>

          </v-card-text>
        </v-card>
      </v-col>

      <v-col class="bg-primary pa-6 pa-sm-12 rounded-b-lg" cols="12">
        <v-card class="w-100 text-surface" color="transparent" flat>
          <v-row class="mb-6">
            <v-col class="pe-md-6 mb-6 mb-md-0" cols="12" md="6">
              <div class="text-h5 font-weight-bold mb-3">Rise in Popularity</div>
              <p class="body-copy mb-4 opacity-90">
                By the mid-1980s, G-Scale had become well established. A broad variety of
                high-fidelity locomotives, rolling stock, modular buildings, and landscape
                accessories became widely available globally.
              </p>
              <p class="body-copy opacity-90">
                Industry-focused publications inspired thousands of modelers to push
                boundaries—blending creative modeling and meticulous scale craftsmanship with
                outdoor horticulture.
              </p>
            </v-col>

            <v-col cols="12" md="6">
              <div class="text-h5 font-weight-bold mb-3">Why G-Scale?</div>
              <p class="mb-4 opacity-90">
                G-Scale is loved for its substantial, hands-on size, massive visual impact, and
                rugged outdoor durability. Heavy duty solid brass rails can safely be left out in
                weather and snow year-round.
              </p>
              <p class="opacity-90">
                Many modern trains feature onboard digital sound profiles, synchronized steam smoke
                generation, and directional lighting rigs that deliver an ultra-realistic scale
                operational experience.
              </p>
            </v-col>
          </v-row>

          <v-divider class="my-8 opacity-10" color="surface"></v-divider>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.body-copy {
  line-height: 1.6 !important;
}

.content-image-frame {
  width: 100%;
  max-width: 803px;
  max-height: 420px;
  border-radius: 12px;
  overflow: hidden;
}

.content-image {
  width: 100%;
  height: 100%;
  max-height: 420px;
  object-fit: cover;
  display: block;
}

a.text-secondary:hover {
  opacity: 0.83;
}
</style>
