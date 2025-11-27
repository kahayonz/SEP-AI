// Professor Portal Application

let currentAssessmentId = null;
let currentSubmissionId = null;
let modalSelectedStudents = [];

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

    // Handle URL hash for section navigation
    const hash = window.location.hash;
    if (hash === '#assessments') {
      // Show only assessments section
      document.getElementById('dashboard').classList.add('hidden');
      document.getElementById('classes').classList.add('hidden');
      document.getElementById('assessments').classList.remove('hidden');
    } else if (hash === '#classes') {
      // Show only classes section
      document.getElementById('dashboard').classList.add('hidden');
      document.getElementById('assessments').classList.add('hidden');
      document.getElementById('classes').classList.remove('hidden');
    } else if (hash === '#dashboard') {
      // Show only dashboard section
      document.getElementById('classes').classList.add('hidden');
      document.getElementById('assessments').classList.add('hidden');
      document.getElementById('dashboard').classList.remove('hidden');
    } else {
      // Show only Dashboard by default
      document.getElementById('dashboard').classList.remove('hidden');
      document.getElementById('classes').classList.add('hidden');
      document.getElementById('assessments').classList.add('hidden');
    }

    // Setup sidebar and navigation
    EventHandlers.setupSidebar();
    EventHandlers.setupNavigation();

    // Load only dashboard data initially
    this.loadDashboardStats();
    this.loadRecentSubmissions();
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

    const editAssessmentForm = document.getElementById('editAssessmentForm');
    if (editAssessmentForm) {
      editAssessmentForm.addEventListener('submit', (e) => this.updateAssessment(e));
    }

    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
      reviewForm.addEventListener('submit', (e) => this.submitReview(e));
    }
  }

  // Lazy load methods - only called when user navigates to that section
  static async lazyLoadClasses() {
    if (!this.classesLoaded) {
      await this.loadClasses();
      this.classesLoaded = true;
    }
  }

  static async lazyLoadAssessments() {
    if (!this.assessmentsLoaded) {
      await this.loadAssessments();
      this.assessmentsLoaded = true;
    }
  }

  static async lazyLoadAccount() {
    if (!this.accountLoaded) {
      AccountManager.loadAccountInformation();
      this.accountLoaded = true;
    }
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
          stepEl.className = 'flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center animate-pulse';
          stepEl.innerHTML = '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        }
        
        if (stepTextEl) {
          stepTextEl.className = 'text-sm text-green-400 font-medium';
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
      const submitButton = document.querySelector('button[onclick="ProfessorPortal.handleProjectSubmission()"]');
      if (submitButton) {
        submitButton.disabled = true;
      }

      const data = await api.evaluateProject(formData);
      const { overall_score, max_score, percentage, evaluation, feedback } = data;

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
      const submitButton = document.querySelector('button[onclick="ProfessorPortal.handleProjectSubmission()"]');
      if (submitButton) {
        submitButton.disabled = false;
      }
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
      const response = await fetch(`${CONFIG.API_BASE}/api/classes`, {
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
        const classData = await response.json();

        // Add selected students to the new class without individual alerts
        if (modalSelectedStudents.length > 0) {
          for (const student of modalSelectedStudents) {
            await this.addStudentToClass(classData.id, student.id, true);
          }
          UIUtils.showSuccess('Class created successfully with students!');
        } else {
          UIUtils.showSuccess('Class created successfully!');
        }

        document.getElementById('createClassForm').reset();
        this.closeCreateClassModal();
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
      const response = await fetch(`${CONFIG.API_BASE}/api/classes`, {
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
        <div class="flex justify-between items-start mb-2">
          <div>
            <h4 class="font-bold text-lg">${cls.name}</h4>
            <p class="text-gray-600 dark:text-gray-300">${cls.description || 'No description'}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="ProfessorPortal.loadClassStudents('${cls.id}')" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
              View Students
            </button>
            <button onclick="ProfessorPortal.deleteClass('${cls.id}', '${cls.name}')" class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
              Delete Class
            </button>
          </div>
        </div>
        <div id="students-${cls.id}" class="hidden">
          <div class="mb-4 relative">
            <label class="block text-sm font-medium mb-1">Add Students:</label>
            <div class="relative">
              <input type="text" id="search-${cls.id}" placeholder="Search and add students..." class="w-full p-2 border rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white">
              <div id="autocomplete-${cls.id}" class="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-b max-h-40 overflow-y-auto hidden"></div>
            </div>
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
      const response = await fetch(`${CONFIG.API_BASE}/api/classes/${classId}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const students = await response.json();
        this.displayClassStudents(classId, students);
        this.setupAutocomplete(classId);
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
      const response = await fetch(`${CONFIG.API_BASE}/api/students/search?query=${encodeURIComponent(query)}`, {
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
      this.addStudentToClass(classId, student.id, `${student.first_name} ${student.last_name} (${student.email})`);
    }
  }

  static async addStudentToClass(classId, studentId, studentName = null, suppressAlert = false) {
    const token = UIUtils.getToken();
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/classes/${classId}/students`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ student_id: studentId })
      });

      if (response.ok) {
        if (!suppressAlert) {
          UIUtils.showSuccess('Student added to class successfully!');
          // Refresh the entire student list to show changes
          this.loadClassStudents(classId);
        }
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
      const response = await fetch(`${CONFIG.API_BASE}/api/classes/${classId}/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Find and remove the student element from DOM instead of reloading the entire list
        const studentsDiv = document.getElementById(`class-students-${classId}`);
        const studentElements = studentsDiv.querySelectorAll('div');

        for (const studentDiv of studentElements) {
          // Check if this is the student we want to remove by finding a way to identify it
          // Since the onclick contains the studentId, we can check that
          const removeButton = studentDiv.querySelector('button');
          if (removeButton && removeButton.getAttribute('onclick').includes(`'${studentId}'`)) {
            studentDiv.remove();
            break;
          }
        }

        // Show success message
        UIUtils.showSuccess('Student removed from class successfully!');
      } else {
        const error = await response.json();
        UIUtils.showError(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error removing student from class:', error);
      UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
    }
  }

  static setupAutocomplete(classId) {
    const input = document.getElementById(`search-${classId}`);
    const autocompleteDiv = document.getElementById(`autocomplete-${classId}`);

    let debounceTimer;

    input.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      clearTimeout(debounceTimer);

      if (query.length < 1) {
        autocompleteDiv.classList.add('hidden');
        return;
      }

      debounceTimer = setTimeout(async () => {
        this.updateAutocomplete(classId, query);
      }, 300);
    });

    input.addEventListener('focus', () => {
      if (autocompleteDiv.innerHTML) {
        autocompleteDiv.classList.remove('hidden');
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => autocompleteDiv.classList.add('hidden'), 200);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const firstItem = autocompleteDiv.querySelector('[data-student-id]');
        if (firstItem) {
          const studentId = firstItem.getAttribute('data-student-id');
          const studentName = firstItem.textContent;
          this.selectStudent(classId, studentId, studentName);
        }
      }
    });
  }

  static async updateAutocomplete(classId, query) {
    const autocompleteDiv = document.getElementById(`autocomplete-${classId}`);

    const token = UIUtils.getToken();
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/students/search?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const students = await response.json();
        autocompleteDiv.innerHTML = '';

        students.slice(0, 5).forEach(student => {
          const div = document.createElement('div');
          div.className = 'p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm';
          div.textContent = `${student.first_name} ${student.last_name} (${student.email})`;
          div.setAttribute('data-student-id', student.id);
          div.onclick = () => this.selectStudent(classId, student.id, `${student.first_name} ${student.last_name} (${student.email})`);
          autocompleteDiv.appendChild(div);
        });

        autocompleteDiv.classList.toggle('hidden', students.length === 0);
      }
    } catch (error) {
      console.error('Error fetching autocomplete results:', error);
    }
  }

  static async selectStudent(classId, studentId, studentName) {
    // Hide autocomplete
    const autocompleteDiv = document.getElementById(`autocomplete-${classId}`);
    autocompleteDiv.classList.add('hidden');

    // Clear input
    const input = document.getElementById(`search-${classId}`);
    input.value = '';

    // Add student to class
    await this.addStudentToClass(classId, studentId, studentName);
  }

  static openCreateClassModal() {
    modalSelectedStudents = [];
    document.getElementById('createClassModal').classList.remove('hidden');
    this.setupModalAutocomplete();
    this.updateModalSelectedStudents();
  }

  static setupModalAutocomplete() {
    const input = document.getElementById('modal-search');
    const autocompleteDiv = document.getElementById('modal-autocomplete');

    let debounceTimer;

    input.addEventListener('input', async (e) => {
      const query = e.target.value.trim();
      clearTimeout(debounceTimer);

      if (query.length < 1) {
        autocompleteDiv.classList.add('hidden');
        return;
      }

      debounceTimer = setTimeout(async () => {
        this.updateModalAutocomplete(query);
      }, 300);
    });

    input.addEventListener('focus', () => {
      if (autocompleteDiv.innerHTML) {
        autocompleteDiv.classList.remove('hidden');
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => autocompleteDiv.classList.add('hidden'), 200);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const firstItem = autocompleteDiv.querySelector('[data-student-id]');
        if (firstItem) {
          const studentId = firstItem.getAttribute('data-student-id');
          const studentName = firstItem.textContent;
          this.selectModalStudent(studentId, studentName);
        }
      }
    });
  }

  static async updateModalAutocomplete(query) {
    const autocompleteDiv = document.getElementById('modal-autocomplete');

    const token = UIUtils.getToken();
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/students/search?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const students = await response.json();
        autocompleteDiv.innerHTML = '';

        students.slice(0, 5).forEach(student => {
          const div = document.createElement('div');
          div.className = 'p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm';
          div.textContent = `${student.first_name} ${student.last_name} (${student.email})`;
          div.setAttribute('data-student-id', student.id);
          div.onclick = () => this.selectModalStudent(student.id, `${student.first_name} ${student.last_name} (${student.email})`);
          autocompleteDiv.appendChild(div);
        });

        autocompleteDiv.classList.toggle('hidden', students.length === 0);
      }
    } catch (error) {
      console.error('Error fetching autocomplete results for modal:', error);
    }
  }

  static selectModalStudent(studentId, studentName) {
    // Hide autocomplete
    const autocompleteDiv = document.getElementById('modal-autocomplete');
    autocompleteDiv.classList.add('hidden');

    // Clear input
    const input = document.getElementById('modal-search');
    input.value = '';

    // Check if student is already selected
    if (modalSelectedStudents.some(s => s.id === studentId)) {
      UIUtils.showError('Student already added to class');
      return;
    }

    // Add to selected list
    modalSelectedStudents.push({ id: studentId, name: studentName });
    this.updateModalSelectedStudents();
  }

  static updateModalSelectedStudents() {
    const container = document.getElementById('modal-selected-students');
    if (!container) return;

    container.innerHTML = '';

    if (modalSelectedStudents.length === 0) {
      container.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400 italic">No students selected</p>';
      return;
    }

    modalSelectedStudents.forEach(student => {
      const div = document.createElement('div');
      div.className = 'flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-1 rounded text-xs';
      div.innerHTML = `
        <span>${student.name}</span>
        <button onclick="ProfessorPortal.removeModalStudent('${student.id}')" class="text-red-600 hover:text-red-800 text-xs">&times;</button>
      `;
      container.appendChild(div);
    });
  }

  static removeModalStudent(studentId) {
    modalSelectedStudents = modalSelectedStudents.filter(s => s.id !== studentId);
    this.updateModalSelectedStudents();
  }

  static viewAssessmentDetails(assessmentId) {
    window.location.href = `assessment-details.html?id=${assessmentId}`;
  }

  static openCreateAssessmentModal() {
    const modal = document.getElementById('createAssessmentModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
    } else {
      console.error('Modal not found');
    }
    // Ensure classes are loaded for the dropdown
    this.loadClasses();
  }

  static closeCreateAssessmentModal() {
    const modal = document.getElementById('createAssessmentModal');
    modal.classList.add('hidden');
    modal.style.setProperty('display', 'none', 'important');
    document.getElementById('createAssessmentForm').reset();
  }

  static closeCreateClassModal() {
    document.getElementById('createClassModal').classList.add('hidden');
    document.getElementById('createClassForm').reset();
    modalSelectedStudents = [];
  }

static async editAssessment(assessmentId) {
  const token = UIUtils.getToken();

  try {
    const response = await fetch(`${CONFIG.API_BASE}/api/assessments/${assessmentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const assessment = await response.json();

      // Populate the edit form
      document.getElementById('editAssessmentTitle').value = assessment.title;
      document.getElementById('editAssessmentDescription').value = assessment.instructions;
      
      // Convert deadline to local datetime-local format (YYYY-MM-DDTHH:mm)
      // Parse the deadline string and ensure it's treated as local time
      let deadlineDate;
      try {
        // If the deadline string doesn't contain timezone info, treat it as local time
        if (assessment.deadline.includes('T') && !assessment.deadline.includes('Z') && !assessment.deadline.includes('+')) {
          // Assume it's already in local time format from datetime-local input
          deadlineDate = new Date(assessment.deadline);
        } else {
          // Parse as UTC and convert to local
          deadlineDate = new Date(assessment.deadline);
        }

        // Ensure we get local time components
        const year = deadlineDate.getFullYear();
        const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
        const day = String(deadlineDate.getDate()).padStart(2, '0');
        const hours = String(deadlineDate.getHours()).padStart(2, '0');
        const minutes = String(deadlineDate.getMinutes()).padStart(2, '0');
        const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('editAssessmentDueDate').value = localDateTime;
      } catch (error) {
        console.error('Error parsing deadline:', assessment.deadline, error);
        // Fallback: try to set a default date
        const now = new Date();
        const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        document.getElementById('editAssessmentDueDate').value = defaultDate;
      }

      currentAssessmentId = assessmentId;
      const modal = document.getElementById('editAssessmentModal');
      modal.classList.remove('hidden');
    } else {
      const error = await response.json();
      UIUtils.showError(`Error: ${error.detail}`);
    }
  } catch (error) {
    console.error('Error loading assessment for editing:', error);
    UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
  }
}

  static closeEditAssessmentModal() {
    const modal = document.getElementById('editAssessmentModal');
    modal.classList.add('hidden');
    modal.style.removeProperty('display');
    document.getElementById('editAssessmentForm').reset();
    currentAssessmentId = null;
  }

  static async updateAssessment(event) {
    event.preventDefault();

    const title = document.getElementById('editAssessmentTitle').value.trim();
    const instructions = document.getElementById('editAssessmentDescription').value.trim();
    const deadline = document.getElementById('editAssessmentDueDate').value;

    if (!title || !instructions || !deadline) {
      UIUtils.showError('Please fill in all fields');
      return;
    }

    const token = UIUtils.getToken();
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/assessments/${currentAssessmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title,
          instructions: instructions,
          deadline: deadline
        })
      });

      if (response.ok) {
        UIUtils.showSuccess('Assessment updated successfully!');
        this.closeEditAssessmentModal();
        this.loadAssessments(); // Refresh the assessments list
      } else {
        const error = await response.json();
        UIUtils.showError(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error updating assessment:', error);
      UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
    }
  }

  static async deleteClass(classId, className) {
    if (!confirm(`Are you sure you want to delete the class "${className}"? All enrolled students will be removed from this class.`)) return;

    const token = UIUtils.getToken();
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/classes/${classId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        UIUtils.showSuccess('Class deleted successfully!');
        this.loadClasses();
        this.loadAssessments(); // to update dropdown
      } else {
        const error = await response.json();
        UIUtils.showError(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
    }
  }

  static async deleteAssessment(assessmentId) {
    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) return;

    const token = UIUtils.getToken();
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/assessments/${assessmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        UIUtils.showSuccess('Assessment deleted successfully!');
        this.loadAssessments();
      } else {
        const error = await response.json();
        UIUtils.showError(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
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
      const response = await fetch(`${CONFIG.API_BASE}/api/assessments`, {
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
        this.closeCreateAssessmentModal();
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
      const response = await fetch(`${CONFIG.API_BASE}/api/assessments`, {
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
            <p class="text-gray-500 dark:text-gray-400 text-sm">Class: ${assessment.class_name}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="ProfessorPortal.viewAssessmentDetails('${assessment.id}')" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
              View Submissions
            </button>
            <button onclick="ProfessorPortal.editAssessment('${assessment.id}')" class="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700">
              Edit
            </button>
            <button onclick="ProfessorPortal.deleteAssessment('${assessment.id}')" class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
              Delete
            </button>
          </div>
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

  static async loadDashboardStats() {
    const token = UIUtils.getToken();
    if (!token) return;

    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/professor/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const stats = await response.json();
        this.displayDashboardStats(stats);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  }

  static displayDashboardStats(stats) {
    // Update total submissions
    const totalSubmissionsEl = document.querySelector('[data-stat="total-submissions"]');
    if (totalSubmissionsEl) {
      const valueEl = totalSubmissionsEl.querySelector('.text-3xl');
      if (valueEl) {
        valueEl.textContent = stats.total_submissions;
      }
    }

    // Update graded submissions
    const gradedEl = document.querySelector('[data-stat="graded"]');
    if (gradedEl) {
      const valueEl = gradedEl.querySelector('.text-3xl');
      if (valueEl) {
        valueEl.textContent = stats.graded_submissions;
      }
    }

    // Update pending submissions
    const pendingEl = document.querySelector('[data-stat="pending"]');
    if (pendingEl) {
      const valueEl = pendingEl.querySelector('.text-3xl');
      if (valueEl) {
        valueEl.textContent = stats.pending_submissions;
      }
    }

    // Update average score
    const averageEl = document.querySelector('[data-stat="average"]');
    if (averageEl) {
      const valueEl = averageEl.querySelector('.text-3xl');
      if (valueEl) {
        valueEl.textContent = stats.average_score;
      }
    }
  }

  static async loadRecentSubmissions() {
    const token = UIUtils.getToken();
    if (!token) return;

    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/professor/recent-submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const submissions = await response.json();
        this.displayRecentSubmissions(submissions);
      }
    } catch (error) {
      console.error('Error loading recent submissions:', error);
    }
  }

  static displayRecentSubmissions(submissions) {
    const tableBody = document.getElementById('recentSubmissionsTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (submissions.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No submissions yet</td></tr>';
      return;
    }

    submissions.forEach(submission => {
      const statusColor = submission.status === 'released' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                         submission.status === 'reviewed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                         'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

      const statusText = submission.status === 'reviewed' ? 'graded' : submission.status;
      const submissionDate = submission.submission_date === '-' ? '-' : new Date(submission.submission_date).toLocaleDateString();

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${submission.student_name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${submission.assessment_title}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${submissionDate}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${statusText}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${submission.ai_score !== null ? Math.round((submission.ai_score / 24) * 100) + '%' : 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${submission.final_score || '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button onclick="ProfessorPortal.reviewSubmission('${submission.id}')" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">${submission.final_score ? 'Edit Review' : 'Review'}</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Submissions Management
  static async viewSubmissions(assessmentId) {
    currentAssessmentId = assessmentId;
    const token = UIUtils.getToken();

    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/assessments/${assessmentId}/submissions`, {
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
      submissionsList.innerHTML = '<p class="text-gray-500">No students in this class.</p>';
      return;
    }

      submissions.forEach(submission => {
      const statusColor = submission.status === 'released' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                         submission.status === 'reviewed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                         submission.status === 'no submission' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                         'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

      const displayDate = submission.created_at ? new Date(submission.created_at).toLocaleString() : (submission.status === 'no submission' ? '-' : 'Not submitted');
      const dateLabel = submission.created_at ? 'Submitted:' : 'Date:';

      const submissionDiv = document.createElement('div');
      submissionDiv.className = 'bg-white dark:bg-gray-600 p-4 rounded-lg';
      submissionDiv.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <div>
            <h5 class="font-bold">${submission.student_name}</h5>
            <p class="text-gray-600 dark:text-gray-300 text-sm">${submission.student_email}</p>
            <p class="text-gray-500 text-sm">${dateLabel} ${displayDate}</p>
          </div>
          <div class="text-right">
            <span class="px-2 py-1 rounded text-xs font-medium ${statusColor}">${submission.status}</span>
            <div class="mt-1">
              <span class="text-sm text-gray-600 dark:text-gray-300">AI Score: ${submission.ai_score !== null ? ((submission.ai_score / 24) * 100).toFixed(1) + '%' : 'N/A'}</span>
            </div>
            ${submission.final_score !== null ? `<div class="text-sm text-gray-600 dark:text-gray-300">Final Score: ${submission.final_score}</div>` : ''}
          </div>
        </div>
        ${submission.professor_feedback ? `<p class="text-gray-700 dark:text-gray-200 mt-2"><strong>Feedback:</strong> ${submission.professor_feedback}</p>` : ''}
        <div class="mt-3 flex gap-2">
          ${submission.id ? `
            <button onclick="ProfessorPortal.reviewSubmission('${submission.id}')" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
              ${submission.professor_feedback ? 'Edit Review' : 'Review'}
            </button>
            <button onclick="ProfessorPortal.downloadStudentProject('${submission.id}')" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
              Download
            </button>
          ` : `
            <span class="text-gray-500 text-sm italic">Review unavailable - no submission</span>
          `}
        </div>
      `;
      submissionsList.appendChild(submissionDiv);
    });
  }

  static closeSubmissionsModal() {
    document.getElementById('submissionsModal').classList.add('hidden');
  }

  static async reviewSubmission(submissionId) {
    currentSubmissionId = submissionId;

    // Fetch the submission details
    const token = UIUtils.getToken();
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/submissions/${submissionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        UIUtils.showError('Failed to load submission details');
        return;
      }

      const submission = await response.json();

      // Display detailed AI evaluation
      this.displayAIEvaluation(submission.ai_evaluation_data || null, submission);

      // Populate form with existing data
      document.getElementById('professorFeedback').value = submission.professor_feedback || '';
      
      // Load adjusted AI score if it exists
      if (submission.adjusted_ai_score !== undefined && submission.adjusted_ai_score !== null) {
        const adjustedAiScoreInput = document.getElementById('adjustedAiScore');
        if (adjustedAiScoreInput) {
          adjustedAiScoreInput.value = submission.adjusted_ai_score;
        }
      }
      
      // Load human evaluation scores if they exist
      if (submission.human_evaluation) {
        const humanEval = typeof submission.human_evaluation === 'string' 
          ? JSON.parse(submission.human_evaluation) 
          : submission.human_evaluation;
        
        if (humanEval.innovation_score !== undefined && humanEval.innovation_score !== null) {
          const innovationInput = document.getElementById('innovationScore');
          if (innovationInput) {
            innovationInput.value = humanEval.innovation_score;
            // Trigger input event to update button states
            innovationInput.dispatchEvent(new Event('input'));
          }
        }
        if (humanEval.collaboration_score !== undefined && humanEval.collaboration_score !== null) {
          const collaborationInput = document.getElementById('collaborationScore');
          if (collaborationInput) {
            collaborationInput.value = humanEval.collaboration_score;
            // Trigger input event to update button states
            collaborationInput.dispatchEvent(new Event('input'));
          }
        }
        if (humanEval.presentation_score !== undefined && humanEval.presentation_score !== null) {
          const presentationInput = document.getElementById('presentationScore');
          if (presentationInput) {
            presentationInput.value = humanEval.presentation_score;
            // Trigger input event to update button states
            presentationInput.dispatchEvent(new Event('input'));
          }
        }
      }

      // Add event listeners for human evaluation scores
      ['innovationScore', 'collaborationScore', 'presentationScore'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          // Remove existing listeners to avoid duplicates
          const newInput = input.cloneNode(true);
          input.parentNode.replaceChild(newInput, input);
          // Add new listener
          document.getElementById(id).addEventListener('input', () => {
            this.updateFinalScore();
            // Update button states when input changes
            if (typeof updateButtonStates === 'function') {
              updateButtonStates(id);
            }
          });
        }
      });

      // Update final score display after all values are loaded
      this.updateFinalScore();

      // Show modal
      document.getElementById('reviewSubmissionModal').classList.remove('hidden');
    } catch (error) {
      console.error('Error loading submission for review:', error);
      UIUtils.showError('Failed to load submission details');
    }
  }

  static displayAIEvaluation(aiEvaluationData, submission) {
    const aiScoreEl = document.getElementById('ai-score');
    const aiFeedbackEl = document.getElementById('ai-feedback');
    const aiEvaluationDetailsEl = document.getElementById('ai-evaluation-details');
    const adjustedAiScoreInput = document.getElementById('adjustedAiScore');

    // Criteria names mapping
    const criteriaNames = {
      system_design_architecture: 'System Design & Architecture',
      functionality_features: 'Functionality & Features',
      code_quality_efficiency: 'Code Quality & Efficiency',
      usability_user_interface: 'Usability & User Interface',
      testing_debugging: 'Testing & Debugging',
      documentation: 'Documentation'
    };

    if (aiEvaluationData && aiEvaluationData.overall_score !== undefined) {
      // Display detailed evaluation
      const percentage = aiEvaluationData.percentage || 0;
      const overallScore = aiEvaluationData.overall_score || 0;
      const maxScore = aiEvaluationData.max_score || 24;

      aiScoreEl.textContent = `${percentage.toFixed(1)}% (${overallScore}/${maxScore})`;

      // Set the adjusted AI score input to the original AI score (if not already adjusted)
      if (adjustedAiScoreInput && !submission.adjusted_ai_score) {
        adjustedAiScoreInput.value = overallScore;
      }

      // Display evaluation criteria if available
      if (aiEvaluationDetailsEl && aiEvaluationData.evaluation) {
        const evalData = aiEvaluationData.evaluation;

        let criteriaHTML = '<div class="mt-3 space-y-2">';
        criteriaHTML += '<h5 class="font-semibold text-sm text-gray-300 mb-2">Evaluation Criteria:</h5>';
        for (const [key, name] of Object.entries(criteriaNames)) {
          const score = evalData[key] || 0;
          criteriaHTML += `<div class="flex justify-between items-center text-sm">
            <span class="text-gray-400">${name}:</span>
            <span class="font-medium text-blue-400">${score}/4</span>
          </div>`;
        }
        criteriaHTML += '</div>';
        aiEvaluationDetailsEl.innerHTML = criteriaHTML;
        aiEvaluationDetailsEl.classList.remove('hidden');
      }

      // Display feedback
      if (aiEvaluationData.feedback && Array.isArray(aiEvaluationData.feedback)) {
        aiFeedbackEl.textContent = aiEvaluationData.feedback.join('\n\n');
      } else {
        aiFeedbackEl.textContent = submission.ai_feedback || 'No feedback provided';
      }
    } else {
      // Fallback to basic display
      const originalScore = submission.ai_score || 0;
      aiScoreEl.textContent = originalScore || 'N/A';
      aiFeedbackEl.textContent = submission.ai_feedback || 'No feedback provided';
      if (aiEvaluationDetailsEl) {
        aiEvaluationDetailsEl.classList.add('hidden');
      }
      
      // Set the adjusted AI score input to the original AI score
      if (adjustedAiScoreInput && !submission.adjusted_ai_score) {
        adjustedAiScoreInput.value = originalScore;
      }
    }
    
    // Add event listener to adjusted AI score input
    if (adjustedAiScoreInput) {
      adjustedAiScoreInput.addEventListener('input', () => this.updateFinalScore());
    }
    
    // Initialize final score calculation
    this.updateFinalScore();
  }

  static updateFinalScore() {
    // Get adjusted AI score
    const adjustedAiScoreInput = document.getElementById('adjustedAiScore');
    const totalAiScore = parseFloat(adjustedAiScoreInput?.value) || 0;
    
    // Calculate human score total
    const innovationScore = parseFloat(document.getElementById('innovationScore')?.value) || 0;
    const collaborationScore = parseFloat(document.getElementById('collaborationScore')?.value) || 0;
    const presentationScore = parseFloat(document.getElementById('presentationScore')?.value) || 0;
    const totalHumanScore = innovationScore + collaborationScore + presentationScore;
    
    // Update human score display
    const totalHumanScoreEl = document.getElementById('totalHumanScore');
    if (totalHumanScoreEl) {
      totalHumanScoreEl.textContent = totalHumanScore;
    }
    
    // Calculate total score
    const totalScore = totalAiScore + totalHumanScore;
    const percentage = (totalScore / 36) * 100;
    
    // Update final score displays
    const displayAiScoreEl = document.getElementById('displayAiScore');
    const displayHumanScoreEl = document.getElementById('displayHumanScore');
    const displayTotalScoreEl = document.getElementById('displayTotalScore');
    const displayPercentageEl = document.getElementById('displayPercentage');
    
    if (displayAiScoreEl) displayAiScoreEl.textContent = totalAiScore.toFixed(1);
    if (displayHumanScoreEl) displayHumanScoreEl.textContent = totalHumanScore;
    if (displayTotalScoreEl) displayTotalScoreEl.textContent = totalScore.toFixed(1);
    if (displayPercentageEl) displayPercentageEl.textContent = percentage.toFixed(1) + '%';
  }

  static closeReviewSubmissionModal() {
    document.getElementById('reviewSubmissionModal').classList.add('hidden');
    document.getElementById('reviewForm').reset();
    
    // Reset button states for all score buttons
    ['innovationButtons', 'collaborationButtons', 'presentationButtons'].forEach(buttonGroupId => {
      const buttonGroup = document.getElementById(buttonGroupId);
      if (buttonGroup) {
        const buttons = buttonGroup.querySelectorAll('.score-btn');
        buttons.forEach(btn => {
          btn.classList.remove('bg-cyan-500', 'text-white', 'border-cyan-400', 'shadow-lg', 'shadow-cyan-500/20');
          btn.classList.add('bg-blue-500/20', 'text-blue-300', 'border-blue-500/30');
        });
      }
    });
    
    // Reset score displays
    const totalHumanScoreEl = document.getElementById('totalHumanScore');
    const displayAiScoreEl = document.getElementById('displayAiScore');
    const displayHumanScoreEl = document.getElementById('displayHumanScore');
    const displayTotalScoreEl = document.getElementById('displayTotalScore');
    const displayPercentageEl = document.getElementById('displayPercentage');
    if (totalHumanScoreEl) totalHumanScoreEl.textContent = '0';
    if (displayAiScoreEl) displayAiScoreEl.textContent = '0';
    if (displayHumanScoreEl) displayHumanScoreEl.textContent = '0';
    if (displayTotalScoreEl) displayTotalScoreEl.textContent = '0';
    if (displayPercentageEl) displayPercentageEl.textContent = '0%';
    
    // Clear current submission ID
    currentSubmissionId = null;
  }

  static async submitReview(event) {
    event.preventDefault();

    const feedback = document.getElementById('professorFeedback')?.value || '';
    
    // Get adjusted AI score with validation
    const adjustedAiScoreInput = document.getElementById('adjustedAiScore');
    const adjustedAiScore = adjustedAiScoreInput ? parseFloat(adjustedAiScoreInput.value) : null;
    
    if (adjustedAiScore === null || isNaN(adjustedAiScore) || adjustedAiScore < 0 || adjustedAiScore > 24) {
      UIUtils.showError('Please enter a valid AI score between 0 and 24');
      return;
    }
    
    // Collect human evaluation scores with validation
    const innovationInput = document.getElementById('innovationScore');
    const collaborationInput = document.getElementById('collaborationScore');
    const presentationInput = document.getElementById('presentationScore');
    
    const innovationScore = innovationInput ? parseFloat(innovationInput.value) : null;
    const collaborationScore = collaborationInput ? parseFloat(collaborationInput.value) : null;
    const presentationScore = presentationInput ? parseFloat(presentationInput.value) : null;
    
    // Validate human evaluation scores
    const humanScores = [
      { name: 'Innovation & Creativity', value: innovationScore, input: innovationInput },
      { name: 'Team Collaboration', value: collaborationScore, input: collaborationInput },
      { name: 'Presentation & Demonstration', value: presentationScore, input: presentationInput }
    ];
    
    for (const score of humanScores) {
      if (score.value === null || isNaN(score.value)) {
        UIUtils.showError(`Please enter a score for ${score.name}`);
        score.input?.focus();
        return;
      }
      if (score.value < 0 || score.value > 4) {
        UIUtils.showError(`${score.name} score must be between 0 and 4`);
        score.input?.focus();
        return;
      }
    }
    
    // Calculate final score
    const totalHumanScore = innovationScore + collaborationScore + presentationScore;
    const totalScore = adjustedAiScore + totalHumanScore;
    const percentage = Math.round((totalScore / 36) * 100 * 100) / 100; // Round to 2 decimal places

    const token = UIUtils.getToken();
    try {
      const requestBody = {
        professor_feedback: feedback,
        final_score: percentage, // Store as percentage (0-100)
        adjusted_ai_score: adjustedAiScore,
        human_evaluation: {
          innovation_score: innovationScore,
          collaboration_score: collaborationScore,
          presentation_score: presentationScore
        }
      };

      const response = await fetch(`${CONFIG.API_BASE}/api/submissions/${currentSubmissionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        UIUtils.showSuccess('Review submitted successfully!');
        this.closeReviewSubmissionModal();
        // Refresh the dashboard submissions table
        this.loadRecentSubmissions();
        if (currentAssessmentId) {
          this.viewSubmissions(currentAssessmentId);
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to update submission' }));
        UIUtils.showError(`Error: ${errorData.detail || 'Failed to save review'}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR || 'Network error. Please try again.');
    }
  }

  static async releaseScores() {
    if (!confirm('Are you sure you want to release all reviewed scores for this assessment?')) return;

    const token = UIUtils.getToken();
    try {
      const response = await fetch(`${CONFIG.API_BASE}/api/assessments/${currentAssessmentId}/release-scores`, {
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
      const response = await fetch(`${CONFIG.API_BASE}/api/submissions/${submissionId}`, {
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
          // Highlight the cell that matches the score
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
window.ProfessorPortal = ProfessorPortal;
