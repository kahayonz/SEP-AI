<template>
  <div class="auth-container">
    <div class="auth-card">
      <router-link to="/" class="back-link">← Back</router-link>
      
      <h1>Create Account</h1>
      <p class="auth-subtitle">Join SEP-AI today</p>

      <form @submit.prevent="handleSignup" class="auth-form">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="John Doe"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Create a strong password"
            required
          />
        </div>

        <div class="form-group">
          <label for="role">I am a</label>
          <select id="role" v-model="form.role" required>
            <option value="">Select a role</option>
            <option value="student">Student</option>
            <option value="professor">Professor</option>
          </select>
        </div>

        <button type="submit" :disabled="isLoading" class="btn btn-primary btn-full">
          {{ isLoading ? 'Creating account...' : 'Sign Up' }}
        </button>
      </form>

      <p class="auth-footer">
        Already have an account?
        <router-link to="/login">Sign in</router-link>
      </p>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  name: '',
  email: '',
  password: '',
  role: '',
})

const isLoading = ref(false)
const errorMessage = ref('')

const handleSignup = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    await authStore.signup(form.value.email, form.value.password, form.value.name, form.value.role)
    
    // Redirect based on role
    if (authStore.user?.role === 'professor') {
      router.push('/professor')
    } else {
      router.push('/student')
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Signup failed'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-bg);
  padding: 2rem;
}

.auth-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 3rem;
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-lg);
}

.back-link {
  display: inline-block;
  color: var(--color-text-secondary);
  text-decoration: none;
  margin-bottom: 1.5rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--color-text);
}

.auth-card h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.auth-subtitle {
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.875rem;
}

.form-group input,
.form-group select {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 1rem;
  transition: border-color 0.2s;
  font-family: var(--font-family);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}

.btn-full {
  width: 100%;
}

.auth-footer {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.auth-footer a {
  color: var(--color-primary);
  font-weight: 600;
}

.error-message {
  color: var(--color-danger);
  background-color: rgba(220, 38, 38, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border-left: 3px solid var(--color-danger);
}
</style>
