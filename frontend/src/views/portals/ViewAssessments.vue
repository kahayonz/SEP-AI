<template>
  <div class="portal-container">
    <div class="portal-content">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div>
            <h1>{{ className }} - Assessments</h1>
            <p class="subtitle">View and manage assessments for this class</p>
          </div>
          <div class="header-actions">
            <button class="btn-icon" @click="createNewAssessment" title="Create New Assessment">
              + Create Assessment
            </button>
            <button class="btn-icon" @click="goBack" title="Back">
              ← Back
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <p>Loading assessments...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="assessments.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h2>No Assessments Yet</h2>
        <p>Create your first assessment for this class</p>
        <button class="btn btn-primary" @click="createNewAssessment">
          Create Assessment
        </button>
      </div>

      <!-- Assessments Grid -->
      <div v-else class="assessments-grid">
        <div v-for="assessment in assessments" :key="assessment.id" class="assessment-card">
          <div class="card-header">
            <h3>{{ assessment.title }}</h3>
            <button class="btn-menu" @click="deleteAssessment(assessment.id)" title="Delete">
              🗑️
            </button>
          </div>
          <p class="card-instructions">{{ assessment.instructions }}</p>
          <div class="card-meta">
            <div class="meta-item">
              <span class="meta-label">Deadline:</span>
              <span class="meta-value">{{ formatDate(assessment.deadline) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Created:</span>
              <span class="meta-value">{{ formatDate(assessment.created_at) }}</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-small" @click="viewSubmissions(assessment.id)">
              View Submissions
            </button>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
        <button class="close-btn" @click="errorMessage = ''">×</button>
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
        <button class="close-btn" @click="successMessage = ''">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import apiClient from "@/services/api";

const router = useRouter();
const route = useRoute();

const classId = route.params.classId;
const className = route.params.className || "Class";

const assessments = ref([]);
const isLoading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

// Fetch assessments on mount
onMounted(async () => {
  await loadAssessments();
});

const loadAssessments = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = "";
    
    // Fetch all assessments and filter by class
    const response = await apiClient.get("/api/assessments");
    const allAssessments = Array.isArray(response.data) ? response.data : [];
    assessments.value = allAssessments.filter(a => a.class_id === classId);
  } catch (error) {
    console.error("Error loading assessments:", error);
    errorMessage.value = "Failed to load assessments: " + (error.message || "Unknown error");
    assessments.value = [];
  } finally {
    isLoading.value = false;
  }
};

const createNewAssessment = () => {
  router.push("/professor/create-assessment");
};

const deleteAssessment = async (assessmentId) => {
  if (!confirm("Are you sure you want to delete this assessment?")) {
    return;
  }

  try {
    await apiClient.delete(`/api/assessments/${assessmentId}`);
    successMessage.value = "Assessment deleted successfully";
    await loadAssessments();
  } catch (error) {
    errorMessage.value =
      error.response?.data?.detail || "Failed to delete assessment. Please try again.";
    console.error("Error deleting assessment:", error);
  }
};

const viewSubmissions = (assessmentId) => {
  router.push(`/professor/assessments/${assessmentId}/submissions`);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const goBack = () => {
  router.push("/professor/manage-classes");
};
</script>

<style scoped>
.portal-container {
  min-height: 100vh;
  background-color: var(--color-bg);
}

.portal-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-icon {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  cursor: pointer;
  color: var(--color-text);
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.btn-icon:hover {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
  color: white;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  border: 2px dashed var(--color-border);
  border-radius: 0.75rem;
  background-color: var(--color-bg-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  color: var(--color-text);
  margin: 1rem 0;
}

.empty-state p {
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.assessments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.assessment-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.assessment-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-text);
  flex: 1;
  word-break: break-word;
}

.btn-menu {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0;
  transition: opacity 0.3s ease;
}

.btn-menu:hover {
  opacity: 0.7;
}

.card-instructions {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  margin: 0 0 1rem 0;
  flex: 1;
  line-height: 1.5;
  max-height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: var(--color-bg);
  border-radius: 0.5rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.meta-label {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.meta-value {
  color: var(--color-text);
}

.card-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.success-message {
  background-color: #efe;
  border: 1px solid #cfc;
  color: #3c3;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: inherit;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  opacity: 0.7;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  background-color: var(--color-primary);
  color: white;
}

.btn-small:hover {
  background-color: var(--color-primary-hover);
}

@media (max-width: 768px) {
  .portal-content {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-icon {
    width: 100%;
  }

  .assessments-grid {
    grid-template-columns: 1fr;
  }
}
</style>
