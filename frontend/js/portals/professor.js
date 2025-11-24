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

    // Show Dashboard and Classes sections by default
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('classes').classList.remove('hidden');
    // document.getElementById('assessments').classList.remove('hidden'); // Remove assessments from dashboard focus

    // Setup sidebar and navigation
    EventHandlers.setupSidebar();
    EventHandlers.setupNavigation();

    // Load initial data
    this.loadClasses();
    this.loadAssessments();
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
        const response = await fetch(`http://localhost:8000/api/classes/${classId}/students`, {
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
      this.addStudentToClass(classId, student.id, `${student.first_name} ${student.last_name} (${student.email})`);
    }
  }

  static async addStudentToClass(classId, studentId, studentName = null, suppressAlert = false) {
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
        if (!suppressAlert) {
          UIUtils.showSuccess('Student added to class successfully!');

          // If we don't have the student name, we need to fetch it
          if (!studentName) {
            try {
              const studentResponse = await fetch(`http://localhost:8000/api/students/search?query=${encodeURIComponent(studentId)}&limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (studentResponse.ok) {
                const studentData = await studentResponse.json();
                if (studentData.length > 0) {
                  studentName = `${studentData[0].first_name} ${studentData[0].last_name} (${studentData[0].email})`;
                }
              }
            } catch (studentError) {
              console.error('Error fetching student details:', studentError);
            }
          }

          // Add student element directly to DOM instead of reloading the entire list
          if (studentName) {
            const studentsDiv = document.getElementById(`class-students-${classId}`);
            if (studentsDiv) {
              // Remove "No students enrolled" message if it exists
              const noStudentsMsg = studentsDiv.querySelector('p');
              if (noStudentsMsg && noStudentsMsg.textContent.includes('No students enrolled')) {
                studentsDiv.innerHTML = '';
              }

              const studentDiv = document.createElement('div');
              studentDiv.className = 'flex justify-between items-center bg-white dark:bg-gray-600 p-2 rounded';
              studentDiv.innerHTML = `
                <span class="text-sm">${studentName}</span>
                <button onclick="ProfessorPortal.removeStudentFromClass('${classId}', '${studentId}')" class="text-red-600 hover:text-red-800 text-sm">
                  Remove
                </button>
              `;
              studentsDiv.appendChild(studentDiv);
            }
          }
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
      const response = await fetch(`http://localhost:8000/api/classes/${classId}/students/${studentId}`, {
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
      const response = await fetch(`http://localhost:8000/api/students/search?query=${encodeURIComponent(query)}`, {
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
      const response = await fetch(`http://localhost:8000/api/students/search?query=${encodeURIComponent(query)}`, {
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
    console.log('Create Assessment Modal Opened');
    const modal = document.getElementById('createAssessmentModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.setProperty('display', 'flex', 'important');
      console.log('Modal opened');
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
    const response = await fetch(`http://localhost:8000/api/assessments/${assessmentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const assessment = await response.json();

      // Populate the edit form
      document.getElementById('editAssessmentTitle').value = assessment.title;
      document.getElementById('editAssessmentDescription').value = assessment.instructions;
      document.getElementById('editAssessmentDueDate').value = new Date(assessment.deadline).toISOString().slice(0, 16);

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
      const response = await fetch(`http://localhost:8000/api/assessments/${currentAssessmentId}`, {
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
      const response = await fetch(`http://localhost:8000/api/classes/${classId}`, {
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
      const response = await fetch(`http://localhost:8000/api/assessments/${assessmentId}`, {
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
            <p class="text-gray-500 dark:text-gray-400 text-sm">Class: ${assessment.classes?.name || assessment.class_name || 'Unknown'}</p>
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
      const response = await fetch('http://localhost:8000/api/professor/dashboard-stats', {
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
      totalSubmissionsEl.querySelector('.text-2xl').textContent = stats.total_submissions;
    }

    // Update graded submissions
    const gradedEl = document.querySelector('[data-stat="graded"]');
    if (gradedEl) {
      gradedEl.querySelector('.text-2xl').textContent = stats.graded_submissions;
    }

    // Update pending submissions
    const pendingEl = document.querySelector('[data-stat="pending"]');
    if (pendingEl) {
      pendingEl.querySelector('.text-2xl').textContent = stats.pending_submissions;
    }

    // Update average score
    const averageEl = document.querySelector('[data-stat="average"]');
    if (averageEl) {
      averageEl.querySelector('.text-2xl').textContent = stats.average_score;
    }
  }

  static async loadRecentSubmissions() {
    const token = UIUtils.getToken();
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/professor/recent-submissions', {
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
      const statusColor = submission.status === 'released' || submission.status === 'reviewed' 
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      
      const statusText = submission.status === 'released' ? 'Graded' : 'Pending';
      const submissionDate = submission.submission_date === '-' ? '-' : new Date(submission.submission_date).toLocaleString();
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${submission.student_name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${submission.assessment_title}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${submissionDate}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${statusText}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">-</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${submission.score}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button onclick="ProfessorPortal.openReviewModal('${submission.student_name}', '${submission.score}')" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">Review</button>
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
      submissionsList.innerHTML = '<p class="text-gray-500">No students in this class.</p>';
      return;
    }

      submissions.forEach(submission => {
      const statusColor = submission.status === 'released' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                         submission.status === 'reviewed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
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
              <span class="text-sm text-gray-600 dark:text-gray-300">AI Score: ${submission.ai_score !== null ? submission.ai_score : 'N/A'}</span>
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
