import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref<boolean>(localStorage.getItem('sepai-theme') === 'dark')

  const toggleDarkMode = () => {
    isDark.value = !isDark.value
    localStorage.setItem('sepai-theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  const applyTheme = () => {
    const root = document.documentElement
    if (isDark.value) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // Watch for changes and apply theme
  watch(isDark, applyTheme)

  // Apply theme on store creation
  applyTheme()

  return {
    isDark,
    toggleDarkMode,
    applyTheme,
  }
})
