// Student Portal Application

let currentAssessmentId = null;

class StudentPortal {
  static async init() {
    this.setupEventListeners();

    // Load user info and initialize UI
    await this.loadUserInfo();
    this.initializeUI();
  }

  static async loadUserInfo() {
    const token = UIUtils.getToken();
    if (!token) {
      UIUtils.redirectToLogin();
      return;
    }

    try {
      const data = await api.getCurrentUser();
      const user = data.user;
      const fullName = `${user.first_name} ${user.last_name}`;

      if (DOM.heroTitle) {
        DOM.heroTitle.textContent = `Welcome, ${fullName}!`;
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
      UIUtils.redirectToLogin();
    }
  }

  static initializeUI() {
    // Show AI Evaluation section by default
    document.getElementById('ai-evaluation').classList.remove('hidden');
    document.getElementById('classes').classList.add('hidden');
    document.getElementById('account').classList.add('hidden');
  }

  static setupEventListeners() {
    // Account manager
    AccountManager.setupEventListeners();

    // File upload functionality
    FileUploader.setupMainDropzone();
    FileUploader.setupEventListeners('fileUpload', 'dropbox', 'uploadPrompt', 'fileSelected');
  }

  static lazyLoadAccount() {
    // Flag to prevent duplicate loads
    if (this.accountLoaded) return;
    
    AccountManager.loadAccountInformation();
    this.accountLoaded = true;
  }

  static async handleProjectSubmission() {
    const fileInput = document.getElementById('fileUpload');
    if (!fileInput || !fileInput.files.length) {
      UIUtils.showError("Please select a ZIP file.");
      return;
    }

    const file = fileInput.files[0];

    try {
      UIUtils.validateFile(file);

      const formData = new FormData();
      formData.append("file", file);

      // Show loading state
      const submitButton = document.querySelector('button[onclick="StudentPortal.handleProjectSubmission()"]');
      const originalText = UIUtils.setLoading(submitButton, true, CONFIG.UI.LOAD_STATES.EVALUATING);

      const data = await api.evaluateProject(formData);
      const { feedback, score } = data.results;

      // Show results section
      document.getElementById('results').classList.remove('hidden');

      // Update score
      document.getElementById('score').textContent = score;

      // Update recommendations
      const recommendations = document.getElementById('recommendations');
      recommendations.innerHTML = '';

      // Split feedback into lines and display as recommendations
      const feedbackLines = feedback.split('\n').filter(line => line.trim());
      feedbackLines.forEach(line => {
        if (line.trim()) {
          const div = document.createElement('div');
          div.className = 'p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg text-blue-200';
          div.textContent = line.trim();
          recommendations.appendChild(div);
        }
      });

      UIUtils.scrollToResults();

    } catch (error) {
      console.error('Evaluation error:', error);
      UIUtils.showError(error.message || CONFIG.UI.MESSAGES.NETWORK_ERROR);
    } finally {
      // Reset button state
      const submitButton = document.querySelector('button[onclick="StudentPortal.handleProjectSubmission()"]');
      UIUtils.setLoading(submitButton, false, 'Submit Project');
    }
  }

  static async handleLogout() {
    try {
      await api.logout();

      // Clear local storage and redirect
      UIUtils.clearAuth();
      UIUtils.redirectToIndex();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, clear local storage
      UIUtils.clearAuth();
      UIUtils.redirectToIndex();
    }
  }

  static async loadStudentClasses() {
    const token = UIUtils.getToken();
    if (!token) {
      UIUtils.showError(CONFIG.UI.MESSAGES.LOGIN_REQUIRED);
      return;
    }

    try {
      const data = await api.getStudentClasses();
      this.displayStudentClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
      UIUtils.showError('Failed to load classes');
    }
  }

  static displayStudentClasses(classes) {
    const container = document.getElementById('classesContainer');
    if (!container) return;

    container.innerHTML = '';

    if (classes.length === 0) {
      container.innerHTML = '<p class="text-gray-400">You are not enrolled in any classes yet.</p>';
      return;
    }

    classes.forEach(cls => {
      const classDiv = document.createElement('div');
      classDiv.className = 'bg-[#1a1a1d] border border-[#27272a] rounded-lg p-6 hover:border-green-500/30 transition-colors';

      let assessmentsHtml = '';
      if (cls.assessments && cls.assessments.length > 0) {
        assessmentsHtml = '<h5 class="font-semibold mb-3 text-green-400">Assessments:</h5><div class="space-y-2">';
        cls.assessments.forEach(assessment => {
          const deadline = new Date(assessment.deadline);
          const isOverdue = deadline < new Date();
          const deadlineClass = isOverdue ? 'text-red-400' : 'text-gray-400';

          assessmentsHtml += `
            <div class="bg-[#232326] border border-[#27272a] p-3 rounded-lg hover:border-blue-500/50 transition-colors">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h6 class="font-medium text-white">${assessment.title}</h6>
                  <p class="text-sm ${deadlineClass}">Due: ${deadline.toLocaleString()}</p>
                </div>
                <button onclick="StudentPortal.viewAssessment('${assessment.id}')" class="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-3 py-1 rounded text-sm font-medium transition-all">
                  View
                </button>
              </div>
            </div>
          `;
        });
        assessmentsHtml += '</div>';
      } else {
        assessmentsHtml = '<p class="text-gray-400 text-sm">No assessments available yet.</p>';
      }

      classDiv.innerHTML = `
        <h4 class="font-bold text-xl mb-2 text-white">${cls.name}</h4>
        <p class="text-gray-400 mb-4">${cls.description || 'No description available'}</p>
        ${assessmentsHtml}
      `;

      container.appendChild(classDiv);
    });
  }

  static async viewAssessment(assessmentId) {
    currentAssessmentId = assessmentId;

    try {
      const data = await api.getAssessmentDetails(assessmentId);
      this.displayAssessmentDetails(data);
      document.getElementById('assessmentModal').classList.remove('hidden');
    } catch (error) {
      console.error('Error loading assessment details:', error);
      UIUtils.showError('Failed to load assessment details');
    }
  }

  static displayAssessmentDetails(data) {
    const assessment = data.assessment;
    const submission = data.submission;

    document.getElementById('assessmentTitle').textContent = assessment.title;

    const deadline = new Date(assessment.deadline);
    const currentTime = new Date();
    const isPastDue = deadline < currentTime;
    const content = document.getElementById('assessmentContent');

    content.innerHTML = `
      <div class="mb-6">
        <h4 class="text-lg font-semibold mb-2 text-white">Instructions</h4>
        <div class="bg-[#1a1a1d] border border-[#27272a] p-4 rounded-lg">
          <p class="whitespace-pre-wrap text-gray-300">${assessment.instructions}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h5 class="font-medium mb-1 text-gray-300">Deadline</h5>
          <p class="text-gray-400">${deadline.toLocaleString()}</p>
        </div>
        <div>
          <h5 class="font-medium mb-1 text-gray-300">Status</h5>
          <p class="text-gray-400">${submission ? '✓ Submitted' : '○ Not Submitted'}</p>
        </div>
      </div>
    `;

    // Hide all sections first
    document.getElementById('submissionSection').classList.add('hidden');
    document.getElementById('submittedSection').classList.add('hidden');

    if (submission) {
      // Already submitted
      document.getElementById('submittedSection').classList.remove('hidden');

      // Show submission status
      let statusHtml = '<div class="mt-4"><h5 class="font-medium mb-2 text-gray-300">Submission Status</h5>';
      statusHtml += `<p class="text-sm text-gray-400">Status: ${submission.status}</p>`;

      if (submission.ai_score) {
        statusHtml += `<p class="text-sm text-gray-400">AI Score: ${submission.ai_score}</p>`;
      }

      if (submission.final_score) {
        statusHtml += `<p class="text-sm text-gray-400">Final Score: ${submission.final_score}</p>`;
      }

      if (submission.professor_feedback) {
        statusHtml += `<div class="mt-2"><h6 class="font-medium text-gray-300">Professor Feedback:</h6><p class="text-sm text-gray-400 mt-1">${submission.professor_feedback}</p></div>`;
      }

      statusHtml += '</div>';
      content.innerHTML += statusHtml;
    } else if (isPastDue) {
      // Past due date and no submission - show missed assessment warning instead of form
      this.showMissedAssessmentModal(assessment, deadline);
    } else {
      // Not submitted yet and still within deadline - show submission form
      document.getElementById('submissionSection').classList.remove('hidden');
      FileUploader.setupAssessmentDropbox();
      FileUploader.resetAssessmentDropbox();
    }
  }

  static showMissedAssessmentModal(assessment, deadline) {
    const content = document.getElementById('assessmentContent');

    // Add missed assessment warning to the content
    const missedWarning = document.createElement('div');
    missedWarning.className = 'mt-6 p-6 bg-red-900/20 border border-red-500/50 rounded-lg';
    missedWarning.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 14c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-red-300 mb-2">Assessment Deadline Missed</h4>
          <div class="space-y-2 text-red-400 text-sm">
            <p><strong>Due Date:</strong> ${deadline.toLocaleString()}</p>
            <p><strong>Submissions past the deadline automatically receive a grade of 0.</strong></p>
          </div>
        </div>
      </div>
    `;

    content.appendChild(missedWarning);
  }

  static closeAssessmentModal() {
    document.getElementById('assessmentModal').classList.add('hidden');
    currentAssessmentId = null;
  }

  static async submitAssessment() {
    if (!currentAssessmentId) return;

    const fileInput = document.getElementById('assessmentFileUpload');
    if (!fileInput || !fileInput.files.length) {
      UIUtils.showError("Please select a ZIP file.");
      return;
    }

    const file = fileInput.files[0];

    try {
      UIUtils.validateFile(file);

      const formData = new FormData();
      formData.append('file', file);

      // Show loading state
      const submitButton = document.getElementById('submitAssessmentBtn');
      const originalText = UIUtils.setLoading(submitButton, true, CONFIG.UI.LOAD_STATES.SUBMITTING);

      await api.submitAssessment(currentAssessmentId, formData);

      UIUtils.showSuccess('Assessment submitted successfully!');
      this.closeAssessmentModal();
      this.loadStudentClasses(); // Refresh to show updated status

    } catch (error) {
      console.error('Error submitting assessment:', error);
      UIUtils.showError(error.message || CONFIG.UI.MESSAGES.NETWORK_ERROR);
    } finally {
      const submitButton = document.getElementById('submitAssessmentBtn');
      UIUtils.setLoading(submitButton, false, 'Submit Assessment');
    }
  }
}

// Make functions globally available
window.StudentPortal = StudentPortal;
