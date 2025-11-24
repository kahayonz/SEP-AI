/**
 * SEP-AI API Service Layer
 * Handles all API requests to the backend server.
 * @class
 */
class ApiService {
  /**
   * Create an ApiService instance.
   * @constructor
   */
  constructor() {
    this.baseUrl = CONFIG.API_BASE;
  }

  /**
   * Get authorization headers with JWT token.
   * @private
   * @returns {Object} Headers object with Authorization
   */
  getAuthHeaders() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Get headers for JSON requests with authorization.
   * @private
   * @returns {Object} Headers object with Content-Type and Authorization
   */
  getAuthHeadersForJSON() {
    return {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };
  }

  /**
   * Make an API request.
   * @private
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   * @throws {Error} If request fails
   */
  async request(url, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, options);
      
      // Handle different response statuses
      if (response.status === 401) {
        // Unauthorized - redirect to login
        UIUtils.clearAuth();
        UIUtils.redirectToLogin();
        throw new Error('Session expired. Please log in again.');
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // Response might not be JSON
        }
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${url}):`, error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(CONFIG.UI.MESSAGES.NETWORK_ERROR);
      }
      
      throw error;
    }
  }

  /**
   * Get current user information.
   * @async
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    return this.request(CONFIG.ENDPOINTS.ME, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Update current user profile.
   * @async
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user data
   */
  async updateUser(userData) {
    return this.request(CONFIG.ENDPOINTS.ME, {
      method: 'PUT',
      headers: this.getAuthHeadersForJSON(),
      body: JSON.stringify(userData)
    });
  }

  /**
   * Logout current user.
   * @async
   * @returns {Promise<Object>} Logout confirmation
   */
  async logout() {
    return this.request(CONFIG.ENDPOINTS.LOGOUT, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Evaluate a project using AI.
   * @async
   * @param {FormData} formData - Form data containing project files
   * @returns {Promise<Object>} Evaluation results
   */
  async evaluateProject(formData) {
    return this.request(CONFIG.ENDPOINTS.API_AI_EVALUATE, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    });
  }

  /**
   * Get all classes for the current student.
   * @async
   * @returns {Promise<Array>} List of classes
   */
  async getStudentClasses() {
    return this.request(CONFIG.ENDPOINTS.STUDENT_CLASSES, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get details for a specific assessment.
   * @async
   * @param {string} assessmentId - Assessment ID
   * @returns {Promise<Object>} Assessment details
   */
  async getAssessmentDetails(assessmentId) {
    return this.request(`${CONFIG.ENDPOINTS.STUDENT_ASSESSMENTS}/${assessmentId}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Submit a project for an assessment.
   * @async
   * @param {string} assessmentId - Assessment ID
   * @param {FormData} formData - Form data containing project files
   * @returns {Promise<Object>} Submission confirmation
   */
  async submitAssessment(assessmentId, formData) {
    return this.request(`${CONFIG.ENDPOINTS.STUDENT_ASSESSMENTS}/${assessmentId}/submit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    });
  }
}

/**
 * Singleton API service instance.
 * @type {ApiService}
 */
const api = new ApiService();
