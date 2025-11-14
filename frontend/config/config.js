// SEP-AI Configuration
const CONFIG = {
  API_BASE: 'http://localhost:8000',
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    THEME: 'sepai-theme'
  },
  ENDPOINTS: {
    ME: '/me',
    LOGOUT: '/logout',
    API_AI_EVALUATE: '/api/ai_evaluate',
    STUDENT_CLASSES: '/api/student/classes',
    STUDENT_ASSESSMENTS: '/api/student/assessments'
  },
  UI: {
    DEFAULT_THEME: 'light',
    LOAD_STATES: {
      EVALUATING: 'Evaluating...',
      SUBMITTING: 'Submitting...'
    },
    MESSAGES: {
      LOGIN_REQUIRED: 'You must be logged in',
      NETWORK_ERROR: 'Network error. Please try again.',
      UPDATE_SUCCESS: 'Account information updated successfully!'
    }
  },
  FILE: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_EXTENSIONS: ['.zip']
  }
};
