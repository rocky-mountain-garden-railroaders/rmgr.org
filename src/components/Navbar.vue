<template>
  <header>
    <v-app-bar v-if="mobile" class="nav-bar" flat>
      <v-btn icon="mdi-menu" variant="text" @click="drawer = !drawer" />
      <img :src="logo" alt="RMGR logo" class="nav-logo" height="44" width="44" />
    </v-app-bar>

    <v-navigation-drawer
      :model-value="mobile ? drawer : true"
      :permanent="!mobile"
      :temporary="mobile"
      border="md"
      class="nav-drawer"
    >
      <div class="nav-logo-wrap">
        <img :src="logo" alt="RMGR logo" class="nav-logo" height="125" width="125" />
      </div>
      <v-list-item
        v-for="item in navItems"
        :key="item.title"
        :to="item.to"
        border="sm"
        class="v-list-item"
        color="white"
        link
        @click="mobile ? (drawer = false) : undefined"
      >
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-navigation-drawer>
  </header>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import logo from '@/assets/logo.png'
import { navItems } from '@/navItems'

const drawer = ref(false)
const { mdAndDown } = useDisplay()
const mobile = computed(() => mdAndDown.value)
</script>

<style scoped>
header {
  line-height: 1.5;
}

.nav-drawer {
  background-color: rgb(var(--v-theme-on-surface));
  text-align: center;
}

.nav-bar {
  background-color: rgb(var(--v-theme-on-surface));
  color: white;
}

.nav-logo-wrap {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.nav-logo {
  object-fit: contain;
}

.v-list-item {
  color: white;
}
</style>
