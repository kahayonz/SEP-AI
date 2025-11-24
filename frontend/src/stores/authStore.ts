import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/services/api'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  name: string
  role: 'student' | 'professor'
  created_at: string
  university?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('sepai-access-token'))
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const login = async (email: string, password: string) => {
    console.log('Login attempt with:', { email, password })
    const response = await apiClient.post('/login', { email, password })
    console.log('Login response:', response.data)
    token.value = response.data.access_token
    localStorage.setItem('sepai-access-token', response.data.access_token)
    // After login, fetch full user data
    if (response.data.access_token) {
      await fetchUser()
    }
    return response.data
  }

  const signup = async (email: string, password: string, name: string, role: string) => {
    const nameParts = name.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || ''
    
    const response = await apiClient.post('/signup', { 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      university: 'N/A' 
    })
    token.value = response.data.access_token
    localStorage.setItem('sepai-access-token', response.data.access_token)
    // After signup, fetch full user data
    if (response.data.access_token) {
      await fetchUser()
    }
    return response.data
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('sepai-access-token')
  }

  const fetchUser = async () => {
    if (!token.value) return
    try {
      const response = await apiClient.get('/me')
      const userData = response.data.user
      user.value = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        role: userData.role as 'student' | 'professor',
        created_at: userData.created_at || new Date().toISOString(),
        university: userData.university || '',
      }
      // Ensure token is saved in localStorage after fetching user
      if (token.value) {
        localStorage.setItem('sepai-access-token', token.value)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      logout()
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    signup,
    logout,
    fetchUser,
  }
})
