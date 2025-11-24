<template>
  <div class="portal">
    <!-- Header -->
    <header class="portal-header">
      <div class="header-content">
        <h1>Student Dashboard</h1>
        <div class="header-actions">
          <button @click="themeStore.toggleDarkMode()" class="theme-toggle">
            {{ themeStore.isDark ? '☀️' : '🌙' }}
          </button>
          <button @click="showSettings = !showSettings" class="settings-btn" title="Account Settings">
            ⚙️
          </button>
          <div class="user-menu">
            <span class="user-name">{{ authStore.user?.first_name }} {{ authStore.user?.last_name }}</span>
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
      <div v-if="loading" class="loading-state">
        <p>Loading your assessments...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadData" class="btn btn-primary">Retry</button>
      </div>

      <!-- Main Project Submission Section -->
      <section v-else class="project-submission-main">
        <div class="submission-title">
          <h2>🔍 Pre-Evaluation</h2>
          <p class="subtitle">Get instant AI feedback on your project</p>
        </div>

        <div class="submission-container">
          <!-- Upload Area -->
          <div class="upload-area-wrapper">
            <div class="file-upload">
              <input 
                type="file" 
                ref="fileInput" 
                accept=".zip"
                @change="handleFileSelect"
                class="file-input"
                id="zip-upload"
              />
              <label for="zip-upload" class="upload-label-large">
                <div class="upload-content">
                  <div v-if="!selectedFile" class="empty-state">
                    <span class="upload-icon-large">📂</span>
                    <p class="upload-text">Drag and drop your project ZIP file here, or click to browse</p>
                    <p class="upload-hint">Only .zip files accepted. Maximum file size: 50MB</p>
                  </div>
                  <div v-else class="file-selected-state">
                    <span class="check-icon-large">✓</span>
                    <p class="selected-filename">{{ selectedFile.name }}</p>
                    <p class="file-size-info">Size: {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Guidelines & Submit -->
          <div class="submission-info-wrapper">
            <div class="submission-guidelines">
              <h3>📋 How It Works</h3>
              <ul>
                <li>✓ Upload a ZIP file of your project</li>
                <li>✓ Get instant AI evaluation</li>
                <li>✓ Review feedback and improve</li>
                <li>✓ Then submit to assessments when ready</li>
              </ul>
            </div>

            <button 
              @click="submitFileForEvaluation" 
              class="btn btn-primary btn-submit"
              :disabled="!selectedFile || isSubmitting"
            >
              {{ isSubmitting ? '⏳ Evaluating...' : '🔍 Get Feedback' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Active Assessments Section -->
      <section class="assessments-section">
        <h2>Active Assessments</h2>
        
        <div v-if="activeAssessments.length === 0" class="empty-state">
          <p>No active assessments. Check back soon!</p>
        </div>

        <div v-else class="assessments-grid">
          <div v-for="assessment in activeAssessments" :key="assessment.id" class="assessment-card">
            <div class="assessment-header">
              <h3>{{ assessment.title }}</h3>
              <span :class="`priority priority-${getStatusPriority(assessment)}`">
                {{ getStatusLabel(assessment) }}
              </span>
            </div>
            <p class="assessment-description">{{ assessment.instructions }}</p>
            <div class="assessment-meta">
              <span class="meta-item">
                <strong>Due:</strong> {{ formatDate(assessment.deadline) }}
              </span>
              <span class="meta-item">
                <strong>Status:</strong> {{ getStatusLabel(assessment) }}
              </span>
            </div>
            <div class="assessment-actions">
              <button 
                v-if="hasSubmitted(assessment.id)"
                @click="showSubmissionDetails(assessment.id)"
                class="btn btn-secondary"
              >
                📋 View Submission
              </button>
              <button 
                v-else
                @click="submitForAssessment(assessment.id)"
                class="btn btn-primary"
              >
                📤 Submit
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section v-if="!loading" class="quick-actions">
        <h2>⚡ Quick Actions</h2>
        <div class="actions-grid">
          <button class="action-card" @click="scrollToSubmission">
            <div class="action-icon">📤</div>
            <div class="action-label">Submit Project</div>
            <div class="action-text">General submission</div>
          </button>
          <button class="action-card" @click="downloadGuidelines">
            <div class="action-icon">📋</div>
            <div class="action-label">Guidelines</div>
            <div class="action-text">Submission tips</div>
          </button>
          <button class="action-card" @click="viewAllSubmissions">
            <div class="action-icon">📁</div>
            <div class="action-label">My Submissions</div>
            <div class="action-text">View history</div>
          </button>
        </div>
      </section>

      <!-- My Submissions Section -->
      <section v-if="!loading && submissions.length > 0" class="submissions-section">
        <h2>My Submissions</h2>
        
        <div class="submissions-list">
          <div v-for="submission in submissions" :key="submission.id" class="submission-item">
            <div class="submission-info">
              <h4>{{ getAssessmentTitle(submission.assessment_id) }}</h4>
              <p class="submission-date">Submitted: {{ formatDate(submission.created_at) }}</p>
            </div>
            <div class="submission-status">
              <span :class="`status-badge status-${submission.status.toLowerCase()}`">
                {{ submission.status }}
              </span>
              <span v-if="submission.ai_score !== null" class="score">Score: {{ Math.round(submission.ai_score) }}/100</span>
            </div>
            <div class="submission-actions">
              <button @click="viewFeedback(submission)" class="action-btn">
                {{ submission.status === 'released' ? 'View Feedback' : 'View Details' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Overview -->
      <section v-if="!loading" class="stats-section">
        <h2>Your Progress</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalSubmissions }}</div>
            <div class="stat-label">Submissions</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.avgScore.toFixed(1) }}%</div>
            <div class="stat-label">Average Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.graded }}</div>
            <div class="stat-label">Graded</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stats.pending }}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>
      </section>
      </template>
    </main>

    <!-- Feedback Modal -->
    <div v-if="showFeedbackModal" class="modal-overlay" @click="closeFeedbackModal">
      <div class="modal-content feedback-modal" @click.stop>
        <div class="modal-header">
          <h2>Submission Feedback</h2>
          <button @click="closeFeedbackModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="feedback-section">
            <h3>AI Evaluation</h3>
            <div class="score-display">
              <div class="score-value">{{ Math.round(selectedSubmission?.ai_score || 0) }}/100</div>
            </div>
            <p class="feedback-text">{{ selectedSubmission?.ai_feedback || 'No AI feedback available' }}</p>
          </div>
          <div v-if="selectedSubmission?.status === 'released'" class="feedback-section">
            <h3>Professor Feedback</h3>
            <p class="feedback-text">{{ selectedSubmission?.professor_feedback || 'No additional feedback' }}</p>
            <div class="final-score">
              <strong>Final Score:</strong> {{ Math.round(selectedSubmission?.final_score || 0) }}/100
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assessment Submission Modal -->
    <div v-if="showAssessmentSubmissionModal" class="modal-overlay" @click="closeAssessmentSubmissionModal">
      <div class="modal-content assessment-submission-modal" @click.stop>
        <div class="modal-header">
          <h2>Submit to Assessment</h2>
          <button @click="closeAssessmentSubmissionModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <h3>{{ getAssessmentTitle(selectedAssessmentId) }}</h3>
          
          <div class="file-upload-modal">
            <input 
              type="file" 
              ref="assessmentFileInput" 
              accept=".zip"
              @change="handleAssessmentFileSelect"
              class="file-input"
              id="assessment-zip-upload"
            />
            <label for="assessment-zip-upload" class="upload-label">
              <div v-if="!assessmentSelectedFile" class="upload-placeholder">
                <span>📂</span>
                <p>Click to select ZIP file or drag and drop</p>
              </div>
              <div v-else class="file-selected">
                <span>✓</span>
                <p>{{ assessmentSelectedFile.name }}</p>
                <small>{{ (assessmentSelectedFile.size / 1024 / 1024).toFixed(2) }} MB</small>
              </div>
            </label>
          </div>

          <div class="modal-actions">
            <button @click="closeAssessmentSubmissionModal" class="btn btn-secondary">
              Cancel
            </button>
            <button 
              @click="submitToAssessment" 
              class="btn btn-primary"
              :disabled="!assessmentSelectedFile || isAssessmentSubmitting"
            >
              {{ isAssessmentSubmitting ? '⏳ Submitting...' : '📤 Submit to Assessment' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import AccountSettings from '@/components/AccountSettings.vue'
import apiClient from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const showSettings = ref(false)

interface Assessment {
  id: string
  title: string
  instructions: string
  deadline: string
  class_id: string
}

interface Submission {
  id: string
  assessment_id: string
  student_id: string
  ai_feedback: string
  ai_score: number
  professor_feedback?: string
  final_score?: number
  status: string
  created_at: string
  zip_path?: string
}

const loading = ref(true)
const error = ref('')
const activeAssessments = ref<Assessment[]>([])
const submissions = ref<Submission[]>([])
const showFeedbackModal = ref(false)
const showAssessmentSubmissionModal = ref(false)
const selectedFile = ref<File | null>(null)
const assessmentSelectedFile = ref<File | null>(null)
const assessmentFileInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()
const isSubmitting = ref(false)
const isAssessmentSubmitting = ref(false)
const selectedSubmission = ref<Submission | null>(null)
const selectedAssessmentId = ref<string>('')

const stats = computed(() => {
  const total = submissions.value.length
  const graded = submissions.value.filter(s => s.status === 'released').length
  const pending = submissions.value.filter(s => s.status !== 'released').length
  const gradedSubmissions = submissions.value.filter(s => s.ai_score !== null && s.status === 'released')
  const avgScore = gradedSubmissions.length > 0 
    ? gradedSubmissions.reduce((sum, s) => sum + s.ai_score, 0) / gradedSubmissions.length
    : 0

  return {
    totalSubmissions: total,
    avgScore,
    graded,
    pending,
  }
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusLabel = (assessment: Assessment) => {
  const now = new Date()
  const deadline = new Date(assessment.deadline)
  
  if (now > deadline) {
    return 'Overdue'
  }
  
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 3) {
    return `${daysLeft} days left`
  }
  
  return 'Active'
}

const getStatusPriority = (assessment: Assessment) => {
  const now = new Date()
  const deadline = new Date(assessment.deadline)
  
  if (now > deadline) {
    return 'high'
  }
  
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 3) {
    return 'high'
  }
  
  return 'medium'
}

const getAssessmentTitle = (assessmentId: string) => {
  const assessment = activeAssessments.value.find(a => a.id === assessmentId)
  return assessment?.title || 'Unknown Assessment'
}

const hasSubmitted = (assessmentId: string) => {
  return submissions.value.some(s => s.assessment_id === assessmentId)
}

const loadData = async () => {
  try {
    loading.value = true
    error.value = ''

    // Get student's classes and assessments
    const classesResponse = await apiClient.get('/api/student/classes')
    const allAssessments: Assessment[] = []
    
    for (const cls of classesResponse.data) {
      if (cls.assessments) {
        allAssessments.push(...cls.assessments)
      }
    }

    activeAssessments.value = allAssessments

    // Get student's submissions
    const submissionsData: Submission[] = []
    for (const assessment of allAssessments) {
      try {
        const assessmentDetails = await apiClient.get(`/api/student/assessments/${assessment.id}`)
        if (assessmentDetails.data.submission) {
          submissionsData.push(assessmentDetails.data.submission)
        }
      } catch (err) {
        // Assessment might not have a submission yet
        continue
      }
    }

    submissions.value = submissionsData
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Failed to load assessments'
    console.error('Error loading data:', err)
  } finally {
    loading.value = false
  }
}

const showSubmissionDetails = (assessmentId: string) => {
  const submission = submissions.value.find(s => s.assessment_id === assessmentId)
  if (submission) {
    selectedSubmission.value = submission
    showFeedbackModal.value = true
  }
}

const submitForAssessment = (assessmentId: string) => {
  // Open the assessment submission modal
  selectedAssessmentId.value = assessmentId
  assessmentSelectedFile.value = null
  showAssessmentSubmissionModal.value = true
}

const closeAssessmentSubmissionModal = () => {
  showAssessmentSubmissionModal.value = false
  assessmentSelectedFile.value = null
  selectedAssessmentId.value = ''
}

const handleAssessmentFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    assessmentSelectedFile.value = target.files[0]
  }
}

const submitToAssessment = async () => {
  if (!assessmentSelectedFile.value || !selectedAssessmentId.value) return

  isAssessmentSubmitting.value = true
  error.value = ''
  
  try {
    const formData = new FormData()
    formData.append('file', assessmentSelectedFile.value)

    await apiClient.post(
      `/api/student/assessments/${selectedAssessmentId.value}/submit`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )

    // Reload data to show new submission
    await loadData()
    closeAssessmentSubmissionModal()
    
    // Show success message
    error.value = '' // Clear any previous errors
    setTimeout(() => {
      alert('✓ Submitted successfully to the assessment!')
    }, 500)
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Failed to submit to assessment'
    console.error('Error submitting to assessment:', err)
  } finally {
    isAssessmentSubmitting.value = false
  }
}

const scrollToSubmission = () => {
  const element = document.querySelector('.project-submission-main')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const downloadGuidelines = () => {
  // Create a text file with guidelines
  const guidelines = `SUBMISSION GUIDELINES

✓ Include all source code files
✓ Add a README with setup instructions
✓ Remove node_modules and build artifacts
✓ Maximum file size: 50MB

Please ensure your project:
1. Compiles without errors
2. Includes proper documentation
3. Has clear instructions on how to run it
4. Contains all necessary dependencies

Good luck!`

  const blob = new Blob([guidelines], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'submission-guidelines.txt'
  a.click()
  window.URL.revokeObjectURL(url)
}

const viewAllSubmissions = () => {
  // Scroll to submissions section
  const element = document.querySelector('.submissions-section')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    selectedFile.value = target.files[0]
  }
}

const submitFileForEvaluation = async () => {
  if (!selectedFile.value) return

  isSubmitting.value = true
  error.value = ''
  
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await apiClient.post(
      '/api/evaluate',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )

    // Show the evaluation feedback
    selectedSubmission.value = {
      id: 'evaluation-' + Date.now(),
      assessment_id: '',
      student_id: '',
      ai_feedback: response.data.feedback || response.data.ai_feedback || 'Evaluation complete',
      ai_score: response.data.score || response.data.ai_score || 0,
      status: 'evaluated',
      created_at: new Date().toISOString(),
    }
    
    showFeedbackModal.value = true
    selectedFile.value = null
  } catch (err: any) {
    error.value = err.response?.data?.detail || 'Failed to evaluate project'
    console.error('Error evaluating file:', err)
  } finally {
    isSubmitting.value = false
  }
}

const viewFeedback = (submission: Submission) => {
  selectedSubmission.value = submission
  showFeedbackModal.value = true
}

const closeFeedbackModal = () => {
  showFeedbackModal.value = false
  selectedSubmission.value = null
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (!authStore.isAuthenticated || authStore.user?.role !== 'student') {
    router.push('/login')
  } else {
    loadData()
  }
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

.assignments-section h2,
.submissions-section h2,
.stats-section h2 {
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

.assignments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.assignment-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.assignment-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-base);
  border-color: var(--color-primary);
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.assignment-header h3 {
  color: var(--color-text);
  font-size: 1.125rem;
  margin: 0;
}

.priority {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}

.priority-low {
  background-color: var(--color-success);
  color: white;
}

.priority-medium {
  background-color: var(--color-warning);
  color: white;
}

.priority-high {
  background-color: var(--color-danger);
  color: white;
}

.assignment-description {
  color: var(--color-text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.assignment-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.meta-item {
  display: flex;
  flex-direction: column;
}

.meta-item strong {
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.submission-item {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 2rem;
  align-items: center;
}

.submission-info h4 {
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.submission-date {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.submission-status {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  text-align: center;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background-color: var(--color-warning);
  color: white;
}

.status-graded {
  background-color: var(--color-success);
  color: white;
}

.score {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 0.875rem;
}

.submission-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.3s ease;
}

.action-btn:hover {
  background-color: var(--color-primary-hover);
}

.action-feedback {
  background-color: var(--color-success);
}

.action-feedback:hover {
  background-color: var(--color-success-hover);
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

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-top: auto;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-border);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading and Error States */
.loading-state,
.error-state {
  background-color: var(--color-bg-secondary);
  border: 2px dashed var(--color-border);
  border-radius: 0.75rem;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.error-state {
  border-color: var(--color-danger);
}

.error-state p {
  margin: 0 0 1rem 0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-bg-secondary);
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.feedback-modal {
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  color: var(--color-text);
  font-size: var(--font-size-xl);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: var(--color-text);
}

.modal-body {
  padding: 2rem;
}

.instructions {
  color: var(--color-text-secondary);
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
}

.file-upload {
  position: relative;
  margin-bottom: 1rem;
}

.file-input {
  display: none;
}

.upload-label {
  display: block;
  padding: 2rem;
  border: 2px dashed var(--color-border);
  border-radius: 0.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.upload-label:hover {
  border-color: var(--color-primary);
  background-color: var(--color-border-light);
}

.file-size {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0.5rem 0 0 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

/* Feedback Sections */
.feedback-section {
  margin-bottom: 2rem;
}

.feedback-section:last-child {
  margin-bottom: 0;
}

.feedback-section h3 {
  color: var(--color-text);
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
}

.score-display {
  background: linear-gradient(135deg, var(--color-primary) 0%, #06b6d4 100%);
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
}

.score-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
}

.feedback-text {
  color: var(--color-text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.final-score {
  background-color: var(--color-border-light);
  border-left: 4px solid var(--color-primary);
  padding: 1rem;
  border-radius: 0.4rem;
  margin-top: 1rem;
  color: var(--color-text);
  font-size: 1rem;
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

  .assignments-grid {
    grid-template-columns: 1fr;
  }

  .submission-item {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .submission-actions {
    justify-content: center;
  }

  .modal-content {
    width: 95%;
    max-width: 100%;
  }

  .modal-header {
    padding: 1.5rem;
  }

  .modal-body {
    padding: 1.5rem;
  }
}

/* Project Submission Main Styles */
.project-submission-main {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover, var(--color-primary)) 100%);
  border-radius: 1.5rem;
  padding: 3rem;
  margin-bottom: 3rem;
  box-shadow: var(--shadow-lg);
  color: white;
}

.submission-title {
  text-align: center;
  margin-bottom: 2.5rem;
}

.submission-title h2 {
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  color: white;
}

.submission-title .subtitle {
  font-size: 1.125rem;
  margin: 0;
  opacity: 0.95;
  color: rgba(255, 255, 255, 0.95);
}

.submission-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2.5rem;
  align-items: start;
}

.upload-area-wrapper {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1.25rem;
  padding: 0;
  overflow: hidden;
}

.file-upload {
  position: relative;
  height: 100%;
}

.file-input {
  display: none;
}

.upload-label-large {
  display: block;
  cursor: pointer;
  height: 100%;
  min-height: 250px;
  padding: 2.5rem;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  height: 100%;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  width: 100%;
}

.upload-icon-large {
  font-size: 4rem;
  display: block;
}

.upload-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.upload-hint {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.file-selected-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 1rem;
}

.check-icon-large {
  font-size: 3rem;
  color: var(--color-success);
}

.selected-filename {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  word-break: break-word;
}

.file-size-info {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.submission-info-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.submission-guidelines {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  padding: 2rem;
  color: var(--color-text);
}

.submission-guidelines h3 {
  font-size: 1.25rem;
  margin: 0 0 1.5rem 0;
  color: var(--color-text);
}

.submission-guidelines ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.submission-guidelines li {
  font-size: 1rem;
  color: var(--color-text);
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.btn-submit {
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  min-height: 50px;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, var(--color-success) 0%, var(--color-success) 100%);
  color: white;
  border: none;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.4);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-actions {
  margin: 3rem 0 2rem 0;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.quick-actions h2 {
  font-size: 1.5rem;
  color: var(--color-text);
  margin: 0 0 1.5rem 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  font-family: inherit;
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

.assessment-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.assessment-actions .btn {
  flex: 1;
}

.assessments-section h2 {
  font-size: 1.5rem;
  color: var(--color-text);
  margin: 2rem 0 1.5rem 0;
}

.no-submission-text {
  padding: 1rem;
  background-color: var(--color-bg-tertiary, rgba(0, 0, 0, 0.05));
  border-radius: 0.5rem;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.no-submission-text p {
  margin: 0;
}

.btn-view {
  width: 100%;
}

/* Old submission panel styles to clean up */
.submission-panel {
  background-color: var(--color-bg-secondary);
  border: 2px solid var(--color-primary);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-lg);
  display: none;
}

.submission-header {
  display: none;
}

.submission-form {
  display: none;
}

@media (max-width: 1024px) {
  .submission-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .project-submission-main {
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .submission-title h2 {
    font-size: 1.5rem;
  }

  .submission-container {
    gap: 1.5rem;
  }

  .upload-label-large {
    min-height: 200px;
    padding: 1.5rem;
  }

  .upload-icon-large {
    font-size: 3rem;
  }

  .upload-text {
    font-size: 1.125rem;
  }

  .submission-guidelines {
    padding: 1.5rem;
  }
}</style>
