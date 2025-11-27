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

  static showLoadingUI() {
    // Hide upload area and button
    const aiEvaluationSection = document.getElementById('ai-evaluation');
    if (aiEvaluationSection) {
      const uploadSection = aiEvaluationSection.querySelector('div:first-child');
      if (uploadSection && !uploadSection.id) {
        uploadSection.classList.add('hidden');
      }
    }

    // Show loading section
    const loadingSection = document.getElementById('loadingSection');
    if (loadingSection) {
      loadingSection.classList.remove('hidden');
      loadingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Reset and animate progress steps
    this.resetProgressSteps();
    this.animateProgressSteps();
  }

  static hideLoadingUI() {
    // Hide loading section
    const loadingSection = document.getElementById('loadingSection');
    if (loadingSection) {
      loadingSection.classList.add('hidden');
    }

    // Show upload area again (for potential re-submission)
    const aiEvaluationSection = document.getElementById('ai-evaluation');
    if (aiEvaluationSection) {
      const uploadSection = aiEvaluationSection.querySelector('div:first-child');
      if (uploadSection && !uploadSection.id) {
        uploadSection.classList.remove('hidden');
      }
    }
  }

  static resetProgressSteps() {
    for (let i = 1; i <= 4; i++) {
      const step = document.getElementById(`step${i}`);
      const stepText = document.getElementById(`step${i}Text`);
      if (step) {
        step.className = 'flex-shrink-0 w-6 h-6 rounded-full bg-[#27272a] flex items-center justify-center';
        step.innerHTML = '<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      }
      if (stepText) {
        stepText.className = 'text-sm text-gray-400';
      }
    }
  }

  static animateProgressSteps() {
    const steps = [
      { id: 1, delay: 500, text: 'Uploading project files...' },
      { id: 2, delay: 1500, text: 'Analyzing code structure...' },
      { id: 3, delay: 2500, text: 'Evaluating quality metrics...' },
      { id: 4, delay: 3500, text: 'Generating feedback...' }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        const stepEl = document.getElementById(`step${step.id}`);
        const stepTextEl = document.getElementById(`step${step.id}Text`);
        
        if (stepEl) {
          stepEl.className = 'flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center animate-pulse';
          stepEl.innerHTML = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        }
        
        if (stepTextEl) {
          stepTextEl.className = 'text-sm text-cyan-400 font-medium';
        }
      }, step.delay);
    });
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

      // Show loading UI
      this.showLoadingUI();

      // Disable submit button
      const submitButton = document.querySelector('button[onclick="StudentPortal.handleProjectSubmission()"]');
      if (submitButton) {
        submitButton.disabled = true;
      }

      const data = await api.evaluateProject(formData);
      
      // Guardrail for invalid or null data - use placeholder values if missing
      const defaultEvaluation = {
        'system_design_architecture': 0,
        'functionality_features': 0,
        'code_quality_efficiency': 0,
        'usability_user_interface': 0,
        'testing_debugging': 0,
        'documentation': 0
      };

      const overall_score = (data && typeof data.overall_score === 'number' && !isNaN(data.overall_score)) 
        ? data.overall_score 
        : 0;
      
      const max_score = (data && typeof data.max_score === 'number' && !isNaN(data.max_score)) 
        ? data.max_score 
        : 24;
      
      const percentage = (data && typeof data.percentage === 'number' && !isNaN(data.percentage)) 
        ? data.percentage 
        : 0;
      
      const evaluation = (data && data.evaluation && typeof data.evaluation === 'object' && !Array.isArray(data.evaluation)) 
        ? data.evaluation 
        : defaultEvaluation;
      
      const feedback = (data && Array.isArray(data.feedback)) 
        ? data.feedback 
        : ['No feedback available at this time.']; 

      // Hide loading UI
      this.hideLoadingUI();

      // Show results section
      document.getElementById('results').classList.remove('hidden');

      // Update overall score display
      document.getElementById('score').textContent = percentage;
      document.getElementById('overallScore').textContent = overall_score;
      document.getElementById('maxScore').textContent = max_score;

      // Display evaluation criteria
      this.displayEvaluationCriteria(evaluation);

      // Display detailed rubric
      this.displayDetailedRubric(evaluation);

      // Display feedback
      this.displayFeedback(feedback);

      console.log(data);

      UIUtils.scrollToResults();

    } catch (error) {
      console.error('Evaluation error:', error);
      // Hide loading UI on error
      this.hideLoadingUI();
      UIUtils.showError(error.message || CONFIG.UI.MESSAGES.NETWORK_ERROR);
    } finally {
      // Re-enable submit button
      const submitButton = document.querySelector('button[onclick="StudentPortal.handleProjectSubmission()"]');
      if (submitButton) {
        submitButton.disabled = false;
      }
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
        statusHtml += `<p class="text-sm text-gray-400">AI Score: ${Math.round(submission.ai_score / 24 * 100)}%</p>`;
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

      // Show loading UI
      this.showSubmissionLoading();

      await api.submitAssessment(currentAssessmentId, formData);

      // Hide loading UI
      this.hideSubmissionLoading();

      UIUtils.showSuccess('Assessment submitted successfully!');
      this.closeAssessmentModal();
      this.loadStudentClasses(); // Refresh to show updated status

    } catch (error) {
      console.error('Error submitting assessment:', error);
      // Hide loading UI on error
      this.hideSubmissionLoading();
      UIUtils.showError(error.message || CONFIG.UI.MESSAGES.NETWORK_ERROR);
    }
  }

  static showSubmissionLoading() {
    // Hide submit button and show loading overlay
    const submitButton = document.getElementById('submitAssessmentBtn');
    const loadingOverlay = document.getElementById('assessmentSubmissionLoading');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnSpinner = document.getElementById('submitBtnSpinner');

    if (submitButton) {
      submitButton.disabled = true;
      if (submitBtnText) submitBtnText.textContent = 'Submitting...';
      if (submitBtnSpinner) submitBtnSpinner.classList.remove('hidden');
    }

    if (loadingOverlay) {
      loadingOverlay.classList.remove('hidden');
      loadingOverlay.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Reset and animate progress steps
    this.resetSubmissionProgressSteps();
    this.animateSubmissionProgressSteps();
  }

  static hideSubmissionLoading() {
    // Hide loading overlay
    const loadingOverlay = document.getElementById('assessmentSubmissionLoading');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }

    // Reset button state
    const submitButton = document.getElementById('submitAssessmentBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnSpinner = document.getElementById('submitBtnSpinner');

    if (submitButton) {
      submitButton.disabled = false;
      if (submitBtnText) submitBtnText.textContent = 'Submit Assessment';
      if (submitBtnSpinner) submitBtnSpinner.classList.add('hidden');
    }
  }

  static resetSubmissionProgressSteps() {
    for (let i = 1; i <= 3; i++) {
      const step = document.getElementById(`submitStep${i}`);
      const stepText = document.getElementById(`submitStep${i}Text`);
      if (step) {
        step.className = 'flex-shrink-0 w-6 h-6 rounded-full bg-[#27272a] flex items-center justify-center';
        step.innerHTML = '<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      }
      if (stepText) {
        stepText.className = 'text-sm text-gray-400';
      }
    }
  }

  static animateSubmissionProgressSteps() {
    const steps = [
      { id: 1, delay: 300, text: 'Uploading file...' },
      { id: 2, delay: 1500, text: 'Processing submission...' },
      { id: 3, delay: 2500, text: 'Finalizing...' }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        const stepEl = document.getElementById(`submitStep${step.id}`);
        const stepTextEl = document.getElementById(`submitStep${step.id}Text`);
        
        if (stepEl) {
          stepEl.className = 'flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-pulse';
          stepEl.innerHTML = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        }
        
        if (stepTextEl) {
          stepTextEl.className = 'text-sm text-green-400 font-medium';
        }
      }, step.delay);
    });
  }

  static displayEvaluationCriteria(evaluation) {
    const container = document.getElementById('evaluationCriteria');
    if (!container || !evaluation) return;

    // Map of criteria keys to display names
    const criteriaLabels = {
      'system_design_architecture': 'System Design & Architecture',
      'functionality_features': 'Functionality & Features',
      'code_quality_efficiency': 'Code Quality & Efficiency',
      'usability_user_interface': 'Usability & User Interface',
      'testing_debugging': 'Testing & Debugging',
      'documentation': 'Documentation'
    };

    container.innerHTML = '';

    Object.entries(evaluation).forEach(([key, score]) => {
      const label = criteriaLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const percentage = (score / 4) * 100;
      
      // Determine color based on score
      let colorClass = 'from-red-500 to-red-600';
      if (score >= 3) {
        colorClass = 'from-green-500 to-green-600';
      } else if (score >= 2) {
        colorClass = 'from-yellow-500 to-yellow-600';
      }

      const criterionDiv = document.createElement('div');
      criterionDiv.className = 'bg-[#1a1a1d] border border-[#27272a] rounded-lg p-4';
      
      criterionDiv.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <h5 class="font-semibold text-white">${label}</h5>
          <span class="text-lg font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent">${score}/4</span>
        </div>
        <div class="w-full bg-[#27272a] rounded-full h-2.5">
          <div class="bg-gradient-to-r ${colorClass} h-2.5 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
        </div>
      `;

      container.appendChild(criterionDiv);
    });
  }

  static displayDetailedRubric(evaluation) {
    const container = document.getElementById('detailedRubric');
    if (!container || !evaluation) return;

    // Rubric data with all criteria and their descriptions
    const rubricData = {
      'system_design_architecture': {
        label: 'System Design & Architecture',
        levels: {
          4: 'System design is innovative and well-organized, with clear and efficient architecture that meets all requirements.',
          3: 'System design is organized, with architecture meeting most requirements.',
          2: 'Basic design and architecture are present but could be more organized.',
          1: 'Limited or poorly organized design does not meet requirements.'
        }
      },
      'functionality_features': {
        label: 'Functionality & Features',
        levels: {
          4: 'All features function correctly, and the system meets or exceeds all specified requirements.',
          3: 'Most features function correctly, meeting major requirements.',
          2: 'Some features work, but there are issues or missing functionality.',
          1: 'The system fails to meet most requirements; many features do not work as expected.'
        }
      },
      'code_quality_efficiency': {
        label: 'Code Quality & Efficiency',
        levels: {
          4: 'Code is clean, efficient, and follows best practices with excellent readability and documentation.',
          3: 'Code is mostly clean, with minor issues in efficiency or readability.',
          2: 'Code has readability or efficiency issues, with minimal adherence to best practices.',
          1: 'Code is unorganized, inefficient, and difficult to understand.'
        }
      },
      'usability_user_interface': {
        label: 'Usability & User Interface',
        levels: {
          4: 'UI is highly intuitive, visually appealing, and accessible. User experience is well thought out.',
          3: 'UI is functional and user-friendly, but with minor design or accessibility issues.',
          2: 'UI is somewhat functional, but lacks intuitiveness and accessibility considerations.',
          1: 'UI is difficult to use, with poor design and accessibility issues.'
        }
      },
      'testing_debugging': {
        label: 'Testing & Debugging',
        levels: {
          4: 'Comprehensive testing with evidence of unit, integration, and system testing. No known bugs.',
          3: 'Testing covers most major functionalities, with few bugs present.',
          2: 'Minimal testing conducted, some major functionalities remain untested or have bugs.',
          1: 'Little or no testing done; the system has significant bugs.'
        }
      },
      'documentation': {
        label: 'Documentation',
        levels: {
          4: 'Documentation is thorough, well-organized, and easy to follow, including design docs, user guides, and comments.',
          3: 'Documentation is complete, but may lack some clarity or detail in parts.',
          2: 'Basic documentation is present but lacks organization or thoroughness.',
          1: 'Little to no documentation provided, making the system difficult to understand.'
        }
      }
    };

    const levelLabels = {
      4: { label: 'Excellent', color: 'text-green-400' },
      3: { label: 'Good', color: 'text-blue-400' },
      2: { label: 'Satisfactory', color: 'text-yellow-400' },
      1: { label: 'Needs Improvement', color: 'text-red-400' }
    };

    // Create the rubric table
    const table = document.createElement('table');
    table.className = 'w-full border-collapse text-sm';

    // Create header row
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr class="bg-[#1a1a1d] border-b-2 border-[#27272a]">
        <th class="text-left py-3 px-4 font-semibold text-white sticky left-0 bg-[#1a1a1d] z-10">Criteria</th>
        <th class="text-center py-3 px-4 font-semibold text-green-400 min-w-[120px]">Excellent<br><span class="text-xs text-gray-400">(4)</span></th>
        <th class="text-center py-3 px-4 font-semibold text-blue-400 min-w-[120px]">Good<br><span class="text-xs text-gray-400">(3)</span></th>
        <th class="text-center py-3 px-4 font-semibold text-yellow-400 min-w-[120px]">Satisfactory<br><span class="text-xs text-gray-400">(2)</span></th>
        <th class="text-center py-3 px-4 font-semibold text-red-400 min-w-[120px]">Needs Improvement<br><span class="text-xs text-gray-400">(1)</span></th>
      </tr>
    `;

    // Create table body
    const tbody = document.createElement('tbody');

    Object.entries(evaluation).forEach(([key, score]) => {
      const criterion = rubricData[key];
      if (!criterion) return;

      const row = document.createElement('tr');
      row.className = 'border-b border-[#27272a] hover:bg-[#1a1a1d]/50 transition-colors';

      // Criteria name cell
      const criteriaCell = document.createElement('td');
      criteriaCell.className = 'py-3 px-4 font-medium text-white sticky left-0 bg-[#232326] z-10';
      criteriaCell.textContent = criterion.label;
      row.appendChild(criteriaCell);

      // Create cells for each performance level (4, 3, 2, 1)
      [4, 3, 2, 1].forEach(level => {
        const cell = document.createElement('td');
        cell.className = 'py-3 px-4 text-gray-300 align-top';
        
        const isHighlighted = score === level;
        
        if (isHighlighted) {
          // Highlight the cell that matches the student's score
          let highlightClass = 'bg-red-500/20 border-2 border-red-500';
          if (level === 4) highlightClass = 'bg-green-500/20 border-2 border-green-500';
          else if (level === 3) highlightClass = 'bg-blue-500/20 border-2 border-blue-500';
          else if (level === 2) highlightClass = 'bg-yellow-500/20 border-2 border-yellow-500';
          
          cell.className += ` ${highlightClass} rounded-lg`;
        }

        const levelInfo = levelLabels[level];
        cell.innerHTML = `
          <div class="text-center mb-2">
            <span class="font-semibold ${levelInfo.color}">${levelInfo.label}</span>
          </div>
          <div class="text-xs text-gray-400 leading-relaxed">
            ${criterion.levels[level]}
          </div>
        `;

        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    
    // Clear container and add table
    container.innerHTML = '';
    container.appendChild(table);
  }

  static toggleRubricDetails() {
    const detailsSection = document.getElementById('rubricDetailsSection');
    const toggleButton = document.getElementById('toggleRubricButton');
    
    if (detailsSection.classList.contains('hidden')) {
      detailsSection.classList.remove('hidden');
      toggleButton.innerHTML = `
        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
        </svg>
        Hide Rubric Details
      `;
    } else {
      detailsSection.classList.add('hidden');
      toggleButton.innerHTML = `
        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
        Show Rubric Details
      `;
    }
  }

  static displayFeedback(feedback) {
    const container = document.getElementById('feedbackList');
    if (!container || !feedback || !Array.isArray(feedback)) return;

    container.innerHTML = '';

    if (feedback.length === 0) {
      container.innerHTML = '<p class="text-gray-400 italic">No specific feedback provided.</p>';
      return;
    }

    feedback.forEach((item, index) => {
      const feedbackItem = document.createElement('div');
      feedbackItem.className = 'bg-[#1a1a1d] border border-[#27272a] rounded-lg p-4 flex items-start space-x-3';
      
      feedbackItem.innerHTML = `
        <div class="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
          ${index + 1}
        </div>
        <p class="text-gray-300 flex-1">${item}</p>
      `;

      container.appendChild(feedbackItem);
    });
  }
}

// Make functions globally available
window.StudentPortal = StudentPortal;
