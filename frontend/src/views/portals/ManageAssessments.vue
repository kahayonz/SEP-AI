<template>
  <div class="portal-container">
    <div class="portal-content">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div>
            <h1>Manage Assessments</h1>
            <p class="subtitle">View all your assessments</p>
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
        <p>Create your first assessment to get started</p>
        <button class="btn btn-primary" @click="createNewAssessment">
          Create Assessment
        </button>
      </div>

      <!-- Assessments Table -->
      <div v-else class="table-container">
        <table class="assessments-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Class</th>
              <th>Deadline</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="assessment in assessments" :key="assessment.id">
              <td class="title-cell">{{ assessment.title }}</td>
              <td>{{ getClassName(assessment.class_id) }}</td>
              <td>{{ formatDate(assessment.deadline) }}</td>
              <td>{{ formatDate(assessment.created_at) }}</td>
              <td class="actions-cell">
                <button class="btn-action view" @click="viewSubmissions(assessment.id)" title="View Submissions">
                  👁️
                </button>
                <button class="btn-action delete" @click="deleteAssessment(assessment.id)" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import apiClient from "@/services/api";

const router = useRouter();

const assessments = ref([]);
const classes = ref([]);
const isLoading = ref(true);
const errorMessage = ref("");
const successMessage = ref("");

// Fetch data on mount
onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = "";
    
    // Fetch assessments and classes in parallel
    const [assessmentsResponse, classesResponse] = await Promise.all([
      apiClient.get("/api/assessments").catch(() => ({ data: [] })),
      apiClient.get("/api/classes").catch(() => ({ data: [] }))
    ]);
    
    assessments.value = Array.isArray(assessmentsResponse.data) ? assessmentsResponse.data : [];
    classes.value = Array.isArray(classesResponse.data) ? classesResponse.data : [];
  } catch (error) {
    console.error("Error loading data:", error);
    errorMessage.value = "Failed to load assessments: " + (error.message || "Unknown error");
    assessments.value = [];
  } finally {
    isLoading.value = false;
  }
};

const getClassName = (classId) => {
  const cls = classes.value.find(c => c.id === classId);
  return cls ? cls.name : "Unknown Class";
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
    await loadData();
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
  router.push("/professor");
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

.table-container {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  overflow-x: auto;
}

.assessments-table {
  width: 100%;
  border-collapse: collapse;
}

.assessments-table th {
  background-color: var(--color-bg);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.assessments-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.assessments-table tbody tr:hover {
  background-color: var(--color-bg);
}

.title-cell {
  font-weight: 600;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.5rem;
  transition: opacity 0.3s ease;
  border-radius: 0.25rem;
}

.btn-action:hover {
  opacity: 0.7;
  background-color: var(--color-border);
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
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
  margin-top: 1rem;
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

  .assessments-table {
    font-size: 0.85rem;
  }

  .assessments-table th,
  .assessments-table td {
    padding: 0.75rem 0.5rem;
  }

  .actions-cell {
    flex-direction: column;
  }
}
</style>
