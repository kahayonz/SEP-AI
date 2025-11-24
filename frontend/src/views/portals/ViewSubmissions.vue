<template>
  <div class="portal-container">
    <div class="portal-content">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div>
            <h1>Submissions</h1>
            <p class="subtitle">{{ assessmentTitle }}</p>
          </div>
          <div class="header-actions">
            <button class="btn-icon" @click="goBack" title="Back">
              ← Back
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <p>Loading submissions...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="submissions.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h2>No Submissions Yet</h2>
        <p>Students haven't submitted anything for this assessment yet</p>
      </div>

      <!-- Submissions Table -->
      <div v-else class="table-container">
        <table class="submissions-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Score</th>
              <th>Feedback</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="submission in submissions" :key="submission.id">
              <td>{{ submission.student_name }}</td>
              <td>{{ formatDate(submission.submission_date) }}</td>
              <td>
                <span :class="['status-badge', getStatusClass(submission.status)]">
                  {{ submission.status }}
                </span>
              </td>
              <td>{{ submission.final_score !== null ? submission.final_score + '%' : '—' }}</td>
              <td class="feedback-cell">
                <span v-if="submission.professor_feedback" class="feedback-text">
                  {{ submission.professor_feedback }}
                </span>
                <span v-else class="no-feedback">No feedback</span>
              </td>
              <td class="actions-cell">
                <button class="btn-action" @click="gradeSubmission(submission.id)" title="Grade">
                  ✏️
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

      <!-- Grade Modal -->
      <div v-if="showGradeModal" class="modal-overlay" @click.self="closeGradeModal">
        <div class="modal">
          <div class="modal-header">
            <h2>Grade Submission</h2>
            <button class="close-btn" @click="closeGradeModal">×</button>
          </div>

          <form @submit.prevent="submitGrade" class="modal-form">
            <div class="form-group">
              <label for="grade-score">Score (0-100) *</label>
              <input
                id="grade-score"
                v-model.number="gradeData.score"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="Enter score"
                required
              />
            </div>

            <div class="form-group">
              <label for="grade-feedback">Feedback</label>
              <textarea
                id="grade-feedback"
                v-model="gradeData.feedback"
                placeholder="Enter feedback for the student..."
                rows="5"
              ></textarea>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeGradeModal"
              >
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? "Submitting..." : "Submit Grade" }}
              </button>
            </div>
          </form>
        </div>
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

const assessmentId = route.params.assessmentId;

const submissions = ref([]);
const assessmentTitle = ref("Assessment");
const isLoading = ref(true);
const isSubmitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const showGradeModal = ref(false);

const gradeData = ref({
  submissionId: null,
  score: null,
  feedback: "",
});

// Fetch submissions on mount
onMounted(async () => {
  await loadSubmissions();
});

const loadSubmissions = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = "";
    
    // Fetch submissions for this assessment
    const response = await apiClient.get(`/api/assessments/${assessmentId}/submissions`);
    submissions.value = Array.isArray(response.data) ? response.data : [];
    
    // Try to get assessment title
    if (submissions.value.length > 0) {
      assessmentTitle.value = submissions.value[0].assessment_title || "Assessment";
    }
  } catch (error) {
    console.error("Error loading submissions:", error);
    errorMessage.value = "Failed to load submissions: " + (error.message || "Unknown error");
    submissions.value = [];
  } finally {
    isLoading.value = false;
  }
};

const getStatusClass = (status) => {
  if (status === "Graded") return "status-graded";
  if (status === "Reviewing") return "status-reviewing";
  return "status-pending";
};

const gradeSubmission = (submissionId) => {
  gradeData.value = {
    submissionId,
    score: null,
    feedback: "",
  };
  showGradeModal.value = true;
};

const closeGradeModal = () => {
  showGradeModal.value = false;
  gradeData.value = {
    submissionId: null,
    score: null,
    feedback: "",
  };
};

const submitGrade = async () => {
  if (gradeData.value.score === null || gradeData.value.score === "") {
    errorMessage.value = "Score is required";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    await apiClient.put(`/api/submissions/${gradeData.value.submissionId}`, {
      professor_feedback: gradeData.value.feedback,
      final_score: gradeData.value.score,
    });

    successMessage.value = "Grade submitted successfully!";
    closeGradeModal();
    await loadSubmissions();

    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } catch (error) {
    console.error("Error submitting grade:", error);
    errorMessage.value =
      error.response?.data?.detail || "Failed to submit grade. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
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
  router.push("/professor/manage-assessments");
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

.submissions-table {
  width: 100%;
  border-collapse: collapse;
}

.submissions-table th {
  background-color: var(--color-bg);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.submissions-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.submissions-table tbody tr:hover {
  background-color: var(--color-bg);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-reviewing {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-graded {
  background-color: #dcfce7;
  color: #166534;
}

.feedback-cell {
  max-width: 200px;
}

.feedback-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-feedback {
  color: var(--color-text-secondary);
  font-style: italic;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--color-bg);
  border-radius: 0.75rem;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.modal-form {
  margin: 1.5rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

input,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background-color: var(--color-bg-secondary);
  color: var(--color-text);
  font-family: inherit;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

textarea {
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
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

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--color-bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-border);
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

  .submissions-table {
    font-size: 0.85rem;
  }

  .submissions-table th,
  .submissions-table td {
    padding: 0.75rem 0.5rem;
  }

  .feedback-cell {
    max-width: 100px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
