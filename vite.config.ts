import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  server: {
    proxy: {
      '/calendar-ics': {
        target: 'https://calendar.google.com',
        changeOrigin: true,
        secure: true,
        rewrite: () =>
          '/calendar/ical/6dd4b4e6f943529cc0dc677309d804dc1da233690360da12fe55770e6dfacccf%40group.calendar.google.com/public/basic.ics',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
