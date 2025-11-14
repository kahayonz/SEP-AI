// Professor Portal Application

let currentAssessmentId = null;
let currentSubmissionId = null;

class ProfessorPortal {
  static async init() {
    this.setupEventListeners();
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
    // Initialize theme
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    }

    // Show Dashboard section by default
    document.getElementById('dashboard').classList.remove('hidden');

    // Setup sidebar and navigation
    EventHandlers.setupSidebar();
    EventHandlers.setupNavigation();

    // Load initial data
    this.loadClasses();
    this.loadAssessments();
  }

  static setupEventListeners() {
    // Account manager
    AccountManager.setupEventListeners();

    // AI Evaluation File Upload
    FileUploader.setupMainDropzone();
    FileUploader.setupEventListeners('fileUpload', 'dropbox', 'uploadPrompt', 'fileSelected');

    // Logout functionality
    const logoutBtn = document.querySelector('button[onclick="ProfessorPortal.handleLogout()"]');
    if (logoutBtn) {
      logoutBtn.onclick = () => this.handleLogout();
    }

    // Form submissions
    const createClassForm = document.getElementById('createClassForm');
    if (createClassForm) {
      createClassForm.addEventListener('submit', (e) => this.createClass(e));
    }

    const createAssessmentForm = document.getElementById('createAssessmentForm');
    if (createAssessmentForm) {
      createAssessmentForm.addEventListener('submit', (e) => this.createAssessment(e));
    }

    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => this.submitReview(e));
    }
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
      const submitButton = document.querySelector('button[onclick="ProfessorPortal.handleProjectSubmission()"]');
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

      const feedbackLines = feedback.split('\n').filter(line => line.trim());
      feedbackLines.forEach(line => {
        if (line.trim()) {
          const div = document.createElement('div');
          div.className = 'p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg';
          div.textContent = line.trim();
          recommendations.appendChild(div);
        }
      });

      UIUtils.scrollToResults();

    } catch (error) {
      console.error('Evaluation error:', error);
      UIUtils.showError(error.message || CONFIG.UI.MESSAGES.NETWORK_ERROR);
    } finally {
      const submitButton = document.querySelector('button[onclick="ProfessorPortal.handleProjectSubmission()"]');
      UIUtils.setLoading(submitButton, false, 'Submit Project');
    }
  }

  static async handleLogout() {
    try {
      await api.logout();
      UIUtils.clearAuth();
      UIUtils.redirectToIndex();
    } catch (error) {
      console.error('Logout error:', error);
      UIUtils.clearAuth();
      UIUtils.redirectToIndex();
    }
  }

  // Classes Management
  static async createClass(event) {
    event.preventDefault();

    const className = document.getElementById('className').value;
    const classDescription = document.getElementById('classDescription').value;

    try {
      const response = await fetch('http://localhost:8000/api/classes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UIUtils.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: className,
          description: classDescription
        })
      });

      if (response.ok) {
        UIUtils.showSuccess('Class created successfully!');
        document.getElementById('createClassForm').reset();
        this.loadClasses();
        this.loadAssessments();
      } else {
        const error = await response.json();
        UIUtils.showError(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error creating class:', error);
      UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
    }
  }

  static async loadClasses() {
    const token = UIUtils.getToken();
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/classes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const classes = await response.json();
        this.displayClasses(classes);
        this.updateAssessmentClassDropdown(classes);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  }

  static displayClasses(classes) {
    const classesList = document.getElementById('classesList');
    if (!classesList) return;

    classesList.innerHTML = '';

    if (classes.length === 0) {
      classesList.innerHTML = '<p class="text-gray-500">No classes created yet.</p>';
      return;
    }

    classes.forEach(cls => {
      const classDiv = document.createElement('div');
      classDiv.className = 'bg-gray-50 dark:bg-gray-700 p-4 rounded-lg';
      classDiv.innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <div>
            <h4 class="font-bold text-lg">${cls.name}</h4>
            <p class="text-gray-600 dark:text-gray-300">${cls.description || 'No description'}</p>
          </div>
          <button onclick="ProfessorPortal.loadClassStudents('${cls.id}')" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
            View Students
          </button>
        </div>
        <div id="students-${cls.id}" class="hidden">
          <div class="flex gap-2 mb-2">
            <input type="text" id="search-${cls.id}" placeholder="Search students..." class="flex-1 p-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white">
            <button onclick="ProfessorPortal.searchStudentsForClass('${cls.id}')" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Add Student</button>
          </div>
          <div id="class-students-${cls.id}" class="space-y-1 max-h-40 overflow-y-auto">
            <!-- Students will be loaded here -->
          </div>
        </div>
      `;
      classesList.appendChild(classDiv);
    });
  }

  static async loadClassStudents(classId) {
    const studentsDiv = document.getElementById(`students-${classId}`);
    const isHidden = studentsDiv.classList.contains('hidden');

    if (isHidden) {
      const token = UIUtils.getToken();
      try {
        const response = await fetch(`http://localhost:8000/api/classes/${classId}/students`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const students = await response.json();
          this.displayClassStudents(classId, students);
        }
      } catch (error) {
        console.error('Error loading class students:', error);
      }
    }

    studentsDiv.classList.toggle('hidden');
  }

  static displayClassStudents(classId, students) {
    const studentsDiv = document.getElementById(`class-students-${classId}`);
    if (!studentsDiv) return;

    studentsDiv.innerHTML = '';

    if (students.length === 0) {
      studentsDiv.innerHTML = '<p class="text-gray-500 text-sm">No students enrolled.</p>';
      return;
    }

    students.forEach(student => {
      const studentDiv = document.createElement('div');
      studentDiv.className = 'flex justify-between items-center bg-white dark:bg-gray-600 p-2 rounded';
      studentDiv.innerHTML = `
        <span class="text-sm">${student.first_name} ${student.last_name} (${student.email})</span>
        <button onclick="ProfessorPortal.removeStudentFromClass('${classId}', '${student.id}')" class="text-red-600 hover:text-red-800 text-sm">
          Remove
        </button>
      `;
      studentsDiv.appendChild(studentDiv);
    });
  }

  static async searchStudentsForClass(classId) {
    const query = document.getElementById(`search-${classId}`).value.trim();
    if (!query) return;

    const token = UIUtils.getToken();
    try {
      const response = await fetch(`http://localhost:8000/api/students/search?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const students = await response.json();
        this.showAddStudentModal(classId, students);
      }
    } catch (error) {
      console.error('Error searching students for class:', error);
    }
  }

  static showAddStudentModal(classId, students) {
    if (students.length === 0) {
      UIUtils.showError('No students found with that name.');
      return;
    }

    const student = students[0];
    if (confirm(`Add ${student.first_name} ${student.last_name} to this class?`)) {
      this.addStudentToClass(classId, student.id);
    }
  }

  static async addStudentToClass(classId, studentId) {
    const token = UIUtils.getToken();
    try {
      const response = await fetch(`http://localhost:8000/api/classes/${classId}/students`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ student_id: studentId })
      });

      if (response.ok) {
        UIUtils.showSuccess('Student added to class successfully!');
        this.loadClassStudents(classId);
      } else {
        const error = await response.json();
        UIUtils.showError(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error adding student to class:', error);
      UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
    }
  }

  static async removeStudentFromClass(classId, studentId) {
    if (!confirm('Are you sure you want to remove this student from the class?')) return;

    const token = UIUtils.getToken();
    try {
      const response = await fetch(`http://localhost:8000/api/classes/${classId}/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        this.loadClassStudents(classId);
      } else {
        const error = await response.json();
        UIUtils.showError(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error removing student from class:', error);
      UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
    }
  }

  // Assessments Management
  static async createAssessment(event) {
    event.preventDefault();

    const title = document.getElementById('assessmentTitle').value;
    const instructions = document.getElementById('assessmentDescription').value;
    const classId = document.getElementById('assessmentClass').value;
    const dueDate = document.getElementById('assessmentDueDate').value;

    if (!classId) {
      UIUtils.showError('Please select a class');
      return;
    }

    const token = UIUtils.getToken();
    try {
      const response = await fetch('http://localhost:8000/api/assessments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          class_id: classId,
          title: title,
          instructions: instructions,
          deadline: dueDate
        })
      });

      if (response.ok) {
        UIUtils.showSuccess('Assessment created successfully!');
        document.getElementById('createAssessmentForm').reset();
        this.loadAssessments();
      } else {
        const error = await response.json();
        UIUtils.showError(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
    }
  }

  static async loadAssessments() {
    const token = UIUtils.getToken();
    try {
      const response = await fetch('http://localhost:8000/api/assessments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const assessments = await response.json();
        this.displayAssessments(assessments);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
    }
  }

  static displayAssessments(assessments) {
    const assessmentsList = document.getElementById('assessmentsList');
    if (!assessmentsList) return;

    assessmentsList.innerHTML = '';

    if (assessments.length === 0) {
      assessmentsList.innerHTML = '<p class="text-gray-500">No assessments created yet.</p>';
      return;
    }

    assessments.forEach(assessment => {
      const assessmentDiv = document.createElement('div');
      assessmentDiv.className = 'bg-gray-50 dark:bg-gray-700 p-4 rounded-lg';
      assessmentDiv.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <div>
            <h4 class="font-bold text-lg">${assessment.title}</h4>
            <p class="text-gray-600 dark:text-gray-300 text-sm">Due: ${new Date(assessment.deadline).toLocaleString()}</p>
          </div>
          <button onclick="ProfessorPortal.viewSubmissions('${assessment.id}')" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
            View Submissions
          </button>
        </div>
        <p class="text-gray-700 dark:text-gray-200">${assessment.instructions}</p>
      `;
      assessmentsList.appendChild(assessmentDiv);
    });
  }

  static updateAssessmentClassDropdown(classes) {
    const select = document.getElementById('assessmentClass');
    if (!select) return;

    select.innerHTML = '<option value="">Select a class</option>';

    classes.forEach(cls => {
      const option = document.createElement('option');
      option.value = cls.id;
      option.textContent = cls.name;
      select.appendChild(option);
    });
  }

  // Submissions Management
  static async viewSubmissions(assessmentId) {
    currentAssessmentId = assessmentId;
    const token = UIUtils.getToken();

    try {
      const response = await fetch(`http://localhost:8000/api/assessments/${assessmentId}/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const submissions = await response.json();
        this.displaySubmissions(submissions);
        document.getElementById('submissionsModal').classList.remove('hidden');
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  }

  static displaySubmissions(submissions) {
    const submissionsList = document.getElementById('submissionsList');
    if (!submissionsList) return;

    submissionsList.innerHTML = '';

    if (submissions.length === 0) {
      submissionsList.innerHTML = '<p class="text-gray-500">No submissions yet.</p>';
      return;
    }

    submissions.forEach(submission => {
      const statusColor = submission.status === 'released' ? 'bg-green-100 text-green-800' :
                         submission.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                         'bg-yellow-100 text-yellow-800';

      const submissionDiv = document.createElement('div');
      submissionDiv.className = 'bg-white dark:bg-gray-600 p-4 rounded-lg';
      submissionDiv.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <div>
            <h5 class="font-bold">${submission.student_name}</h5>
            <p class="text-gray-600 dark:text-gray-300 text-sm">${submission.student_email}</p>
            <p class="text-gray-500 text-sm">Submitted: ${new Date(submission.created_at).toLocaleString()}</p>
          </div>
          <div class="text-right">
            <span class="px-2 py-1 rounded text-xs font-medium ${statusColor}">${submission.status}</span>
            <div class="mt-1">
              <span class="text-sm text-gray-600 dark:text-gray-300">AI Score: ${submission.ai_score || 'N/A'}</span>
            </div>
            ${submission.final_score ? `<div class="text-sm text-gray-600 dark:text-gray-300">Final Score: ${submission.final_score}</div>` : ''}
          </div>
        </div>
        ${submission.professor_feedback ? `<p class="text-gray-700 dark:text-gray-200 mt-2"><strong>Feedback:</strong> ${submission.professor_feedback}</p>` : ''}
        <div class="mt-3 flex gap-2">
          <button onclick="ProfessorPortal.reviewSubmission('${submission.id}')" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
            ${submission.professor_feedback ? 'Edit Review' : 'Review'}
          </button>
          <button onclick="ProfessorPortal.downloadStudentProject('${submission.id}')" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
            Download
          </button>
        </div>
      `;
      submissionsList.appendChild(submissionDiv);
    });
  }

  static closeSubmissionsModal() {
    document.getElementById('submissionsModal').classList.add('hidden');
  }

  static reviewSubmission(submissionId) {
    currentSubmissionId = submissionId;
    document.getElementById('reviewSubmissionModal').classList.remove('hidden');
  }

  static closeReviewSubmissionModal() {
    document.getElementById('reviewSubmissionModal').classList.add('hidden');
    document.getElementById('reviewForm').reset();
  }

  static async submitReview(event) {
    event.preventDefault();

    const feedback = document.getElementById('professorFeedback').value;
    const score = parseFloat(document.getElementById('finalScore').value);

    const token = UIUtils.getToken();
    try {
      const response = await fetch(`http://localhost:8000/api/submissions/${currentSubmissionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          professor_feedback: feedback,
          final_score: score
        })
      });

      if (response.ok) {
        UIUtils.showSuccess('Review submitted successfully!');
        this.closeReviewSubmissionModal();
        if (currentAssessmentId) {
          this.viewSubmissions(currentAssessmentId);
        }
      } else {
        const error = await response.json();
        UIUtils.showError(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
    }
  }

  static async releaseScores() {
    if (!confirm('Are you sure you want to release all reviewed scores for this assessment?')) return;

    const token = UIUtils.getToken();
    try {
      const response = await fetch(`http://localhost:8000/api/assessments/${currentAssessmentId}/release-scores`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        UIUtils.showSuccess(`Scores released successfully! ${result.message}`);
        this.viewSubmissions(currentAssessmentId);
      } else {
        const error = await response.json();
        UIUtils.showError(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error releasing scores:', error);
      UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
    }
  }

  static async downloadStudentProject(submissionId) {
    const token = UIUtils.getToken();
    if (!token) {
      UIUtils.showError(CONFIG.UI.MESSAGES.LOGIN_REQUIRED);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/submissions/${submissionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const submission = await response.json();
        window.open(submission.zip_path, '_blank');
      } else {
        const error = await response.json();
        UIUtils.showError(`Download failed: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
    }
  }

  // Utility functions (used by inline onclicks)
  static openReviewModal(studentName, aiScore) {
    // This is a placeholder - the modal was removed, use openReviewModal functionality instead
    console.log(`Would review ${studentName} with AI score ${aiScore}`);
  }

  static closeReviewModal() {
    // This is a placeholder - the modal was removed
    console.log('Would close review modal');
  }

  static downloadProject() {
    // This is a placeholder - the modal was removed
    console.log('Would download project');
  }
}

// Make functions globally available
window.ProfessorPortal = ProfessorPortal;
