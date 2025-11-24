<template>
  <div class="assessment-container">
    <h1>Assessment Details</h1>
    <p>Assessment ID: {{ $route.params.id }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>

<style scoped>
.assessment-container {
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--color-bg);
}

h1 {
  color: var(--color-text);
  margin-bottom: 1rem;
}

p {
  color: var(--color-text-secondary);
}
</style>
