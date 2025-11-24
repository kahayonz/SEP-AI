<template>
  <div class="portal-container">
    <div class="portal-content">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <div>
            <h1>Create Assessment</h1>
            <p class="subtitle">Create a new assessment for your class</p>
          </div>
          <div class="header-actions">
            <button class="btn-icon" @click="goBack" title="Back">
              ← Back
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="content-section">
        <div class="form-container">
          <form @submit.prevent="submitAssessment">
            <!-- Select Class -->
            <div class="form-group">
              <label for="class">Select Class *</label>
              <select
                id="class"
                v-model="formData.class_id"
                required
                @change="onClassChange"
              >
                <option value="">-- Choose a class --</option>
                <option v-for="cls in classes" :key="cls.id" :value="cls.id">
                  {{ cls.name }}
                </option>
              </select>
            </div>

            <!-- Assessment Title -->
            <div class="form-group">
              <label for="title">Assessment Title *</label>
              <input
                id="title"
                v-model="formData.title"
                type="text"
                placeholder="e.g., Final Project, Midterm Exam"
                required
              />
            </div>

            <!-- Instructions -->
            <div class="form-group">
              <label for="instructions">Instructions *</label>
              <textarea
                id="instructions"
                v-model="formData.instructions"
                placeholder="Enter detailed instructions for the assessment..."
                rows="8"
                required
              ></textarea>
            </div>

            <!-- Deadline -->
            <div class="form-group">
              <label for="deadline">Deadline *</label>
              <input
                id="deadline"
                v-model="formData.deadline"
                type="datetime-local"
                required
              />
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>

            <!-- Success Message -->
            <div v-if="successMessage" class="success-message">
              {{ successMessage }}
            </div>

            <!-- Buttons -->
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="resetForm">
                Clear
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? "Creating..." : "Create Assessment" }}
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
import { useRouter } from "vue-router";
import apiClient from "@/services/api";

const router = useRouter();

const formData = ref({
  class_id: "",
  title: "",
  instructions: "",
  deadline: "",
});

const classes = ref([]);
const errorMessage = ref("");
const successMessage = ref("");
const isSubmitting = ref(false);

// Fetch professor's classes on mount
onMounted(async () => {
  try {
    const response = await apiClient.get("/api/classes");
    classes.value = response.data;
  } catch (error) {
    errorMessage.value = "Failed to load classes. Please refresh the page.";
    console.error("Error loading classes:", error);
  }
});

const onClassChange = () => {
  errorMessage.value = "";
};

const submitAssessment = async () => {
  if (!formData.value.class_id) {
    errorMessage.value = "Please select a class";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const response = await apiClient.post("/api/assessments", {
      class_id: formData.value.class_id,
      title: formData.value.title,
      instructions: formData.value.instructions,
      deadline: formData.value.deadline,
    });

    successMessage.value = `Assessment "${formData.value.title}" created successfully!`;
    resetForm();

    // Redirect back to professor portal after 2 seconds
    setTimeout(() => {
      router.push("/professor");
    }, 2000);
  } catch (error) {
    errorMessage.value =
      error.response?.data?.detail ||
      "Failed to create assessment. Please try again.";
    console.error("Error creating assessment:", error);
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  formData.value = {
    class_id: "",
    title: "",
    instructions: "",
    deadline: "",
  };
  errorMessage.value = "";
  successMessage.value = "";
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
  background: none;
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  color: var(--color-text);
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.content-section {
  margin-bottom: 2rem;
}

.form-container {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 2rem;
  max-width: 600px;
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
select,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

textarea {
  resize: vertical;
  font-family: "Monaco", "Menlo", monospace;
  font-size: 0.9rem;
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.success-message {
  background-color: #efe;
  border: 1px solid #cfc;
  color: #3c3;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.form-actions {
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
  background-color: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-bg-secondary);
  border-color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .portal-content {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .form-container {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
