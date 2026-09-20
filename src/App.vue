<template>
  <v-app>
    <Navbar />

    <v-main>
      <router-view v-slot="{ Component }">
        <transition mode="out-in" name="page-fade">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import Navbar from '@/components/Navbar.vue'
</script>

<style scoped>
body {
  padding: 0;
  margin: 0;
}
</style>

<style>
.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
