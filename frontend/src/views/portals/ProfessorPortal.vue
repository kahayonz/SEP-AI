<template>
  <div class="portal">
    <!-- Header -->
    <header class="portal-header">
      <div class="header-content">
        <h1>Professor Dashboard</h1>
        <div class="header-actions">
          <button @click="themeStore.toggleDarkMode()" class="theme-toggle">
            {{ themeStore.isDark ? '☀️' : '🌙' }}
          </button>
          <button @click="showSettings = !showSettings" class="settings-btn" title="Account Settings">
            ⚙️
          </button>
          <div class="user-menu">
            <span class="user-name">{{ authStore.user?.name }}</span>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="portal-content">
      <!-- Account Settings View -->
      <AccountSettings v-if="showSettings" />

      <!-- Dashboard View -->
      <template v-else>
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <p>📊 Loading your dashboard...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="loadDashboardData" class="btn btn-primary">Retry</button>
        </div>

        <!-- Stats Grid -->
        <section v-else class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalSubmissions }}</div>
            <div class="stat-label">Total Submissions</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.pendingReview }}</div>
            <div class="stat-label">Pending Review</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ Math.round(stats.avgScore) }}%</div>
            <div class="stat-label">Average Score</div>
          </div>
        </section>

        <!-- Submissions Table -->
        <section v-if="!loading" class="submissions-section">
          <h2>📋 Recent Submissions (Last 5)</h2>
          
          <div v-if="submissions.length === 0" class="empty-state">
            <p>No submissions yet. Students will submit their projects here.</p>
          </div>

          <table v-else class="submissions-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Assessment</th>
                <th>Class</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="submission in submissions" :key="submission.id">
                <td>{{ submission.student_name }}</td>
                <td>{{ submission.assessment_title }}</td>
                <td>{{ submission.class_name }}</td>
                <td>{{ formatDate(submission.submission_date) }}</td>
                <td>
                  <span class="status-badge" :style="{ backgroundColor: getStatusColor(submission.status) }">
                    {{ getStatusLabel(submission.status) }}
                  </span>
                </td>
                <td>{{ typeof submission.score === 'number' ? Math.round(submission.score) + '%' : submission.score }}</td>
                <td class="action-cell">
                  <button @click="viewSubmission(submission.id)" class="action-btn view-btn">👁️ View</button>
                  <button v-if="submission.status?.toLowerCase() !== 'released'" @click="gradeSubmission(submission.id)" class="action-btn grade-btn">✏️ Grade</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Quick Actions -->
        <section class="quick-actions">
          <h2>⚡ Quick Actions</h2>
          <div class="actions-grid">
            <button class="action-card" @click="router.push('/professor/create-assessment')">
              <div class="action-icon">📝</div>
              <div class="action-label">Create Assessment</div>
              <div class="action-text">New assessment</div>
            </button>
            <button class="action-card" @click="router.push('/professor/manage-classes')">
              <div class="action-icon">👥</div>
              <div class="action-label">Manage Classes</div>
              <div class="action-text">View & edit</div>
            </button>
            <button class="action-card" @click="router.push('/professor/manage-assessments')">
              <div class="action-icon">📋</div>
              <div class="action-label">Manage Assessments</div>
              <div class="action-text">All assessments</div>
            </button>
            <button class="action-card" @click="loadDashboardData">
              <div class="action-icon">🔄</div>
              <div class="action-label">Refresh</div>
              <div class="action-text">Update data</div>
            </button>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import AccountSettings from '@/components/AccountSettings.vue'
import apiClient from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const showSettings = ref(false)
const loading = ref(true)
const error = ref('')

interface Submission {
  id: string
  student_name: string
  assessment_title: string
  class_name: string
  submission_date: string
  status: string
  score: number | string
}

const stats = ref({
  totalSubmissions: 0,
  pendingReview: 0,
  avgScore: 0,
  courses: 0,
})

const submissions = ref<Submission[]>([])

const formatDate = (dateString: string | null) => {
  if (!dateString || dateString === '-') return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '#f59e0b'
    case 'reviewing':
      return '#3b82f6'
    case 'released':
    case 'graded':
      return '#22c55e'
    default:
      return '#6b7280'
  }
}

const getStatusLabel = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '⏳ Pending'
    case 'reviewing':
      return '📋 Reviewing'
    case 'released':
    case 'graded':
      return '✅ Graded'
    default:
      return '❓ ' + (status || 'Unknown')
  }
}

const loadDashboardData = async () => {
  loading.value = true
  error.value = ''
  try {
    // Load stats
    const statsResponse = await apiClient.get('/api/professor/dashboard-stats')
    stats.value = {
      totalSubmissions: statsResponse.data.total_submissions || 0,
      pendingReview: statsResponse.data.pending_submissions || 0,
      avgScore: statsResponse.data.average_score || 0,
      courses: 0, // This would need a separate endpoint to get active courses count
    }

    // Load recent submissions
    const submissionsResponse = await apiClient.get('/api/professor/recent-submissions')
    submissions.value = submissionsResponse.data || []
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Failed to load dashboard data'
    console.error('Error loading dashboard:', err)
  } finally {
    loading.value = false
  }
}

const viewSubmission = (id: string) => {
  console.log('View submission:', id)
  // TODO: Navigate to submission details page
}

const gradeSubmission = (id: string) => {
  console.log('Grade submission:', id)
  // TODO: Open grading modal/page
}

const handleLogout = async () => {
  authStore.logout()
  await router.push('/login')
}

const showAlert = (title: string, message: string) => {
  alert(`${title}\n${message}`)
}

onMounted(() => {
  if (!authStore.isAuthenticated || authStore.user?.role !== 'professor') {
    router.push('/login')
  }
  loadDashboardData()
})
</script>

<style scoped>
.portal {
  min-height: 100vh;
  background-color: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.portal-header {
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  padding: 1.5rem 2rem;
  box-shadow: var(--shadow-sm);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  color: var(--color-text);
  font-size: var(--font-size-2xl);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.3s ease;
}

.theme-toggle:hover {
  background-color: var(--color-border-light);
}

.settings-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.settings-btn:hover {
  background-color: var(--color-border-light);
  transform: rotate(30deg);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-left: 1rem;
  border-left: 1px solid var(--color-border);
}

.user-name {
  color: var(--color-text);
  font-weight: 500;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: var(--color-danger);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.3s ease;
}

.logout-btn:hover {
  background-color: var(--color-danger-hover);
}

.portal-content {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.loading-state,
.error-state {
  padding: 2rem;
  border-radius: 0.75rem;
  text-align: center;
  font-size: 1.125rem;
}

.loading-state {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
}

.error-state {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.error-state .btn {
  margin-top: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-base);
}

.stat-number {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.submissions-section h2,
.quick-actions h2 {
  color: var(--color-text);
  font-size: var(--font-size-2xl);
  margin: 0 0 1.5rem 0;
}

.empty-state {
  background-color: var(--color-bg-secondary);
  border: 2px dashed var(--color-border);
  border-radius: 0.75rem;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.submissions-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--color-bg-secondary);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.submissions-table thead {
  background-color: var(--color-border-light);
}

.submissions-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.submissions-table td {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-text);
}

.submissions-table tbody tr:hover {
  background-color: var(--color-border-light);
}

.status-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
}

.score {
  color: var(--color-primary);
  font-weight: 600;
}

.score-pending {
  color: var(--color-text-secondary);
}

.action-cell {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.4rem 0.8rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
}

.view-btn {
  background-color: #3b82f6;
}

.grade-btn {
  background-color: #22c55e;
}

.quick-actions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
  background-color: var(--color-bg);
}

.action-icon {
  font-size: 2.5rem;
  display: block;
}

.action-label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 1.125rem;
}

.action-text {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
}

.action-view {
  background-color: #3b82f6;
}

.action-view:hover {
  background-color: #1d4ed8;
}

.action-grade {
  background-color: #22c55e;
}

.action-grade:hover {
  background-color: #16a34a;
}

@media (max-width: 768px) {
  .portal-content {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    justify-content: center;
    width: 100%;
  }

  .user-menu {
    border-left: none;
    border-top: 1px solid var(--color-border);
    padding-left: 0;
    padding-top: 1rem;
    width: 100%;
  }

  .submissions-table {
    font-size: 0.85rem;
  }

  .submissions-table th,
  .submissions-table td {
    padding: 0.75rem 0.5rem;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}</style>
