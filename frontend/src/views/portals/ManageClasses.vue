<template>
  <div class="portal-container">
    <div class="portal-content">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div>
            <h1>Manage Classes</h1>
            <p class="subtitle">Create and manage your classes</p>
          </div>
          <div class="header-actions">
            <button class="btn-icon" @click="openCreateClassModal" title="Create New Class">
              + Create Class
            </button>
            <button class="btn-icon" @click="goBack" title="Back">
              ← Back
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <p>Loading classes...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="classes.length === 0" class="empty-state">
        <div class="empty-icon">📚</div>
        <h2>No Classes Yet</h2>
        <p>Create your first class to get started</p>
        <button class="btn btn-primary" @click="openCreateClassModal">
          Create Your First Class
        </button>
      </div>

      <!-- Classes Grid -->
      <div v-else-if="validClasses.length > 0" class="classes-grid">
        <div v-for="cls in validClasses" :key="cls.id" class="class-card">
          <div class="card-header">
            <h3>{{ cls.name }}</h3>
            <button class="btn-menu" @click="deleteClass(cls.id)" title="Delete">
              🗑️
            </button>
          </div>
          <p class="card-description">{{ cls.description }}</p>
          <div class="card-info">
            <span class="info-badge">{{ cls.assessments_count || 0 }} assessments</span>
          </div>
          <div class="card-footer">
            <small>{{ formatDate(cls.created_at) }}</small>
            <button class="btn btn-small" @click="viewClassAssessments(cls.id, cls.name)">
              View Assessments
            </button>
          </div>
        </div>
      </div>

      <!-- No Valid Classes Message -->
      <div v-else class="empty-state">
        <div class="empty-icon">📚</div>
        <h2>No Classes With Descriptions</h2>
        <p>Please add descriptions to your classes or create new ones</p>
        <button class="btn btn-primary" @click="openCreateClassModal">
          Create New Class
        </button>
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

      <!-- Create Class Modal -->
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateClassModal">
        <div class="modal">
          <div class="modal-header">
            <h2>Create New Class</h2>
            <button class="close-btn" @click="closeCreateClassModal">×</button>
          </div>

          <form @submit.prevent="createClass" class="modal-form">
            <div class="form-group">
              <label for="class-name">Class Name *</label>
              <input
                id="class-name"
                v-model="newClass.name"
                type="text"
                placeholder="e.g., Introduction to Computer Science"
                required
              />
            </div>

            <div class="form-group">
              <label for="class-description">Description</label>
              <textarea
                id="class-description"
                v-model="newClass.description"
                placeholder="Enter a brief description of the class..."
                rows="4"
              ></textarea>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeCreateClassModal"
              >
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? "Creating..." : "Create Class" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import apiClient from "@/services/api";

const router = useRouter();

const classes = ref([]);
const isLoading = ref(true);
const isSubmitting = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const showCreateModal = ref(false);

const newClass = ref({
  name: "",
  description: "",
});

// Only show classes that have descriptions
const validClasses = computed(() => {
  return classes.value.filter((cls) => cls.description && cls.description.trim());
});

// Fetch classes on mount
onMounted(async () => {
  await loadClasses();
});

const loadClasses = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = "";
    
    // Fetch classes and assessments
    const [classesResponse, assessmentsResponse] = await Promise.all([
      apiClient.get("/api/classes"),
      apiClient.get("/api/assessments").catch(() => ({ data: [] }))
    ]);
    
    let classesData = Array.isArray(classesResponse.data) ? classesResponse.data : [];
    const assessments = Array.isArray(assessmentsResponse.data) ? assessmentsResponse.data : [];
    
    // Count assessments per class
    const assessmentCounts = {};
    assessments.forEach(assessment => {
      assessmentCounts[assessment.class_id] = (assessmentCounts[assessment.class_id] || 0) + 1;
    });
    
    // Add assessment counts to classes
    classesData = classesData.map(cls => ({
      ...cls,
      assessments_count: assessmentCounts[cls.id] || 0
    }));
    
    classes.value = classesData;
  } catch (error) {
    console.error("Error loading classes:", error);
    errorMessage.value = "Failed to load classes: " + (error.message || "Unknown error");
    classes.value = [];
  } finally {
    isLoading.value = false;
  }
};

const openCreateClassModal = () => {
  showCreateModal.value = true;
  newClass.value = { name: "", description: "" };
};

const closeCreateClassModal = () => {
  showCreateModal.value = false;
  newClass.value = { name: "", description: "" };
};

const createClass = async () => {
  if (!newClass.value.name.trim()) {
    errorMessage.value = "Class name is required";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    const payload = {
      name: newClass.value.name,
      description: newClass.value.description || null,
    };
    
    const response = await apiClient.post("/api/classes", payload);
    
    successMessage.value = `Class "${newClass.value.name}" created successfully!`;
    closeCreateClassModal();
    await loadClasses();
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } catch (error) {
    console.error("Error creating class:", error);
    errorMessage.value =
      error.response?.data?.detail || error.message || "Failed to create class. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
};

const deleteClass = async (classId) => {
  if (!confirm("Are you sure you want to delete this class?")) {
    return;
  }

  try {
    await apiClient.delete(`/api/classes/${classId}`);
    successMessage.value = "Class deleted successfully";
    await loadClasses();
  } catch (error) {
    errorMessage.value =
      error.response?.data?.detail || "Failed to delete class. Please try again.";
    console.error("Error deleting class:", error);
  }
};

const viewClassAssessments = async (classId, className) => {
  // Navigate to the assessments page for this class
  router.push({
    name: 'ViewAssessments',
    params: { classId, className }
  });
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.class-card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.class-card:hover {
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

.card-description {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  margin: 0 0 1.5rem 0;
  flex: 1;
}

.card-description.placeholder {
  color: var(--color-text-secondary);
  font-style: italic;
  opacity: 0.6;
}

.card-info {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.info-badge {
  display: inline-block;
  background-color: var(--color-primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.card-footer small {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
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

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
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

  .classes-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
