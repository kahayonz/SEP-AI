<template>
  <div class="account-settings">
    <div class="settings-container">
      <div class="settings-header">
        <h2>⚙️ Account Settings</h2>
        <p class="header-subtitle">Manage your profile information</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <p>Loading your settings...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
        <button @click="error = ''" class="btn btn-secondary btn-small">Dismiss</button>
      </div>

      <!-- Success State -->
      <div v-else-if="successMessage" class="success-message">
        <p>✓ {{ successMessage }}</p>
        <button @click="successMessage = ''" class="btn btn-secondary btn-small">Dismiss</button>
      </div>

      <!-- Settings Form -->
      <form v-if="!loading" @submit.prevent="saveSettings" class="settings-form">
        <!-- Profile Section -->
        <div class="form-section">
          <h3>👤 Profile Information</h3>
          
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              v-model="user.email" 
              disabled 
              class="form-input disabled"
              title="Email cannot be changed"
            />
            <p class="input-hint">Email address cannot be changed. Contact support to update it.</p>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input 
                type="text" 
                id="firstName" 
                v-model="formData.first_name" 
                class="form-input"
                placeholder="Enter your first name"
                required
              />
            </div>
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName" 
                v-model="formData.last_name" 
                class="form-input"
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="university">University/Institution</label>
            <input 
              type="text" 
              id="university" 
              v-model="formData.university" 
              class="form-input"
              placeholder="Enter your university or institution"
              required
            />
          </div>
        </div>

        <!-- Account Type Section -->
        <div class="form-section">
          <h3>🔐 Account Type</h3>
          
          <div class="info-box">
            <p>
              <strong>Current Role:</strong> 
              <span class="badge" :class="`badge-${user.role}`">
                {{ user.role === 'student' ? '👨‍🎓 Student' : '👨‍🏫 Professor' }}
              </span>
            </p>
            <p class="info-text">Your account role cannot be changed. Contact support if you need assistance.</p>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="form-section">
          <h3>⚡ Quick Actions</h3>
          
          <div class="button-group">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="isSaving || !isFormChanged"
            >
              {{ isSaving ? '💾 Saving...' : '💾 Save Changes' }}
            </button>
            <button 
              type="button" 
              @click="resetForm" 
              class="btn btn-secondary"
              :disabled="!isFormChanged"
            >
              🔄 Reset
            </button>
            <button 
              type="button" 
              @click="handleLogout" 
              class="btn btn-danger"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import apiClient from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const isSaving = ref(false)
const error = ref('')
const successMessage = ref('')

const user = ref({
  email: '',
  role: 'student',
  first_name: '',
  last_name: '',
  university: '',
})

const formData = ref({
  first_name: '',
  last_name: '',
  university: '',
})

const originalFormData = ref({
  first_name: '',
  last_name: '',
  university: '',
})

const isFormChanged = computed(() => {
  return (
    formData.value.first_name !== originalFormData.value.first_name ||
    formData.value.last_name !== originalFormData.value.last_name ||
    formData.value.university !== originalFormData.value.university
  )
})

onMounted(() => {
  loadUserSettings()
})

const loadUserSettings = async () => {
  loading.value = true
  error.value = ''
  
  try {
    if (authStore.user) {
      user.value = {
        email: authStore.user.email || '',
        role: authStore.user.role || 'student',
        first_name: authStore.user.first_name || '',
        last_name: authStore.user.last_name || '',
        university: authStore.user.university || '',
      }
      
      formData.value = {
        first_name: user.value.first_name,
        last_name: user.value.last_name,
        university: user.value.university,
      }
      
      originalFormData.value = { ...formData.value }
    }
  } catch (err: any) {
    error.value = 'Failed to load account settings'
    console.error('Error loading settings:', err)
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  if (!isFormChanged.value) return
  
  isSaving.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    const response = await apiClient.put('/me', {
      first_name: formData.value.first_name,
      last_name: formData.value.last_name,
      university: formData.value.university,
    })

    // Update auth store
    if (response.data.user) {
      authStore.user = {
        ...authStore.user!,
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name,
        university: response.data.user.university,
        name: `${response.data.user.first_name} ${response.data.user.last_name}`.trim(),
      }
    }

    user.value = {
      ...user.value,
      first_name: formData.value.first_name,
      last_name: formData.value.last_name,
      university: formData.value.university,
    }
    
    originalFormData.value = { ...formData.value }
    successMessage.value = 'Your settings have been saved successfully!'
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Failed to save settings'
    console.error('Error saving settings:', err)
  } finally {
    isSaving.value = false
  }
}

const resetForm = () => {
  formData.value = { ...originalFormData.value }
}

const handleLogout = async () => {
  if (confirm('Are you sure you want to logout?')) {
    authStore.logout()
    await router.push('/login')
  }
}
</script>

<style scoped>
.account-settings {
  padding: 2rem;
  background-color: var(--color-bg);
  min-height: 100vh;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  background-color: var(--color-bg-secondary);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: var(--shadow-base);
}

.settings-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--color-primary);
}

.settings-header h2 {
  font-size: 1.75rem;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.header-subtitle {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 1rem;
}

.loading-state,
.error-message,
.success-message {
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.error-message {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--color-danger);
}

.success-message {
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: var(--color-success);
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: var(--color-bg);
  border-radius: 0.75rem;
  border: 1px solid var(--color-border);
}

.form-section h3 {
  font-size: 1.125rem;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.95rem;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background-color: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: var(--color-bg);
}

.form-input.disabled {
  background-color: var(--color-bg-tertiary);
  cursor: not-allowed;
  opacity: 0.6;
}

.input-hint {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.info-box {
  background-color: rgba(59, 130, 246, 0.1);
  border-left: 4px solid var(--color-primary);
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.info-box p {
  margin: 0 0 0.75rem 0;
  color: var(--color-text);
}

.info-box p:last-child {
  margin: 0;
}

.info-text {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.badge-student {
  background-color: rgba(59, 130, 246, 0.2);
  color: var(--color-primary);
}

.badge-professor {
  background-color: rgba(147, 51, 234, 0.2);
  color: #9333ea;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background-color: var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-border-light);
  transform: translateY(-2px);
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .account-settings {
    padding: 1rem;
  }

  .settings-container {
    padding: 1.5rem;
  }

  .settings-header h2 {
    font-size: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
