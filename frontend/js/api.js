// SEP-AI API Service Layer

class ApiService {
  constructor() {
    this.baseUrl = CONFIG.API_BASE;
  }

  getAuthHeaders() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  getAuthHeadersForJSON() {
    return {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };
  }

  async request(url, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error (${url}):`, error);
      throw error;
    }
  }

  // User API
  async getCurrentUser() {
    return this.request(CONFIG.ENDPOINTS.ME, { headers: this.getAuthHeaders() });
  }

  async updateUser(userData) {
    return this.request(CONFIG.ENDPOINTS.ME, {
      method: 'PUT',
      headers: this.getAuthHeadersForJSON(),
      body: JSON.stringify(userData)
    });
  }

  async logout() {
    return this.request(CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
  }

  // AI Evaluation API
  async evaluateProject(formData) {
    return this.request(CONFIG.ENDPOINTS.API_AI_EVALUATE, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    });
  }

  // Student API
  async getStudentClasses() {
    return this.request(CONFIG.ENDPOINTS.STUDENT_CLASSES, {
      headers: this.getAuthHeaders()
    });
  }

  async getAssessmentDetails(assessmentId) {
    return this.request(`${CONFIG.ENDPOINTS.STUDENT_ASSESSMENTS}/${assessmentId}`, {
      headers: this.getAuthHeaders()
    });
  }

  async submitAssessment(assessmentId, formData) {
    return this.request(`${CONFIG.ENDPOINTS.STUDENT_ASSESSMENTS}/${assessmentId}/submit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    });
  }
}

// Create singleton instance
const api = new ApiService();
