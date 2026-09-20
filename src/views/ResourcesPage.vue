<template>
  <v-container class="pa-4 pa-sm-8 bg-background" fluid>
    <v-row justify="center" no-gutters>
      <v-col class="bg-surface pa-6 pa-sm-12 rounded-t-lg" cols="12">
        <v-card class="w-100 bg-surface" flat>
          <v-card-item class="pa-0">
            <v-card-title class="text-h4 font-weight-black text-primary pa-0">
              Resources
            </v-card-title>
            <v-card-subtitle class="text-body-1 pa-0 mt-3 text-medium-emphasis text-wrap">
              Helpful links for clubs, modeling ideas, and railroading inspiration.
            </v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col class="bg-primary pa-6 pa-sm-12 rounded-b-lg" cols="12">
        <v-card class="w-100 text-surface" color="transparent" flat>
          <v-row>
            <v-col v-for="section in resourcesSections" :key="section.title" cols="12" md="4">
              <div class="text-h5 font-weight-bold mb-3">{{ section.title }}</div>
              <div v-if="section.description" class="text-body-2 opacity-80 mb-4">
                {{ section.description }}
              </div>

              <v-card
                v-for="item in section.items"
                :key="item.title"
                class="resource-card mb-3"
                color="surface"
                flat
                rounded="lg"
                :href="item.href"
                rel="noopener noreferrer"
                target="_blank"
              >
                <v-card-text class="d-flex align-center justify-space-between ga-3">
                  <div>
                    <div class="text-h6 font-weight-bold text-on-surface">
                      {{ item.title }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis mt-1">
                      {{ item.description }}
                    </div>
                  </div>
                  <v-icon class="text-secondary" icon="mdi-open-in-new" size="20"></v-icon>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { resourcesSections } from '@/data/resources'

defineOptions({ name: 'ResourcesPage' })
</script>

<style scoped>
.resource-card {
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.resource-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
  background-color: rgba(var(--v-theme-surface), 0.92);
}
</style>
