<template>
  <div id="app" class="min-h-screen">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'

const themeStore = useThemeStore()
const authStore = useAuthStore()

onMounted(async () => {
  // Initialize theme
  themeStore.applyTheme()
  
  // Try to fetch user if token exists
  if (authStore.token) {
    await authStore.fetchUser()
  }
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Doto:wght@400;700&display=swap');
</style>
