// Account Manager Component

class AccountManager {
  static async loadAccountInformation() {
    console.log('Loading account information...');

    // First, try to load static test data to see if display works
    const testUser = {
      id: 'test-id',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'student',
      university: 'Test University'
    };
    console.log('Testing display with static data first...');
    this.displayAccountInformation(testUser);

    // Now try the real API call
    const token = UIUtils.getToken();
    if (!token) {
      console.log('No token found, redirecting to login');
      UIUtils.showError(CONFIG.UI.MESSAGES.LOGIN_REQUIRED);
      UIUtils.redirectToLogin();
      return;
    }

    try {
      console.log('Calling api.getCurrentUser()...');
      const data = await api.getCurrentUser();
      console.log('Received user data:', data);
      const user = data.user;
      if (!user) {
        console.error('No user data received');
        UIUtils.showError('Failed to load account information');
        return;
      }
      // Replace test data with real data
      this.displayAccountInformation(user);
    } catch (error) {
      console.error('Error loading account information:', error);
      UIUtils.showError('Failed to load account information');
    }
  }

  static displayAccountInformation(user) {
    console.log('Displaying account information for user:', user);
    const container = document.getElementById('accountContainer');
    if (!container) {
      console.error('accountContainer not found');
      return;
    }

    container.innerHTML = '';

    // Safely handle null/undefined values
    const safeValue = (value) => {
      if (value == null || value === '') {
        return 'Not set';
      }
      return String(value);
    };

    const fields = [
      { label: 'Email', value: safeValue(user.email), editable: false, key: 'email' },
      { label: 'First Name', value: safeValue(user.first_name), editable: true, key: 'first_name' },
      { label: 'Last Name', value: safeValue(user.last_name), editable: true, key: 'last_name' },
      { label: 'Role', value: safeValue(UIUtils.capitalizeFirst(user.role)), editable: false, key: 'role' },
      { label: 'University', value: safeValue(user.university), editable: true, key: 'university' }
    ];

    console.log('Fields to display:', fields);
    fields.forEach((field, index) => {
      console.log(`Creating field ${index + 1}:`, field);
      const fieldDiv = this.createFieldElement(field);
      container.appendChild(fieldDiv);
    });
  }

  static createFieldElement(field) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'flex items-center justify-between p-4 bg-[#1a1a1d] border border-[#27272a] rounded-lg hover:border-[#3f3f46] transition-colors';

    const leftDiv = document.createElement('div');
    const labelEl = document.createElement('label');
    labelEl.className = 'block text-sm font-medium mb-1 text-gray-400';
    labelEl.textContent = field.label;

    const valueEl = document.createElement('div');
    valueEl.className = 'text-white font-medium';
    valueEl.textContent = field.value;
    valueEl.dataset.field = field.key;
    valueEl.dataset.originalValue = field.value;

    leftDiv.appendChild(labelEl);
    leftDiv.appendChild(valueEl);

    const rightDiv = document.createElement('div');
    if (field.editable) {
      const editBtn = this.createEditButton(valueEl);
      rightDiv.appendChild(editBtn);
    }

    fieldDiv.appendChild(leftDiv);
    fieldDiv.appendChild(rightDiv);
    return fieldDiv;
  }

  static createEditButton(valueElement) {
    const editBtn = document.createElement('button');
    editBtn.className = 'text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors';
    editBtn.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
      </svg>
      <span class="text-sm">Edit</span>
    `;
    editBtn.onclick = () => this.startEditing(valueElement);
    return editBtn;
  }

  static startEditing(valueElement) {
    const field = valueElement.dataset.field;
    const originalValue = valueElement.dataset.originalValue;

    // Replace text with input
    const input = document.createElement('input');
    input.type = field === 'email' ? 'email' : 'text';
    input.className = 'w-full px-3 py-2 bg-[#232326] border border-[#27272a] rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors';
    input.value = originalValue;

    // Auto-capitalize first letter for first name and last name fields
    if (field === 'first_name' || field === 'last_name') {
      input.addEventListener('input', (e) => {
        const cursorPosition = e.target.selectionStart;
        e.target.value = UIUtils.capitalizeFirst(e.target.value.toLowerCase());
        e.target.setSelectionRange(cursorPosition, cursorPosition);
      });
      // Also capitalize on paste
      input.addEventListener('paste', (e) => {
        setTimeout(() => {
          const cursorPosition = e.target.selectionStart;
          e.target.value = UIUtils.capitalizeFirst(e.target.value.toLowerCase());
          e.target.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
      });
    }

    const saveBtn = document.createElement('button');
    saveBtn.className = 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white px-3 py-2 rounded ml-2 font-medium transition-all text-sm';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = () => this.saveChanges(valueElement, input.value);

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded ml-2 font-medium transition-colors text-sm';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => this.cancelEditing(valueElement);

    // Add input and buttons to parent
    const parent = valueElement.parentNode;
    parent.appendChild(input);
    parent.appendChild(saveBtn);
    parent.appendChild(cancelBtn);

    // Hide original text
    valueElement.style.display = 'none';
  }

  static async saveChanges(valueElement, newValue) {
    // Convert "Not set" back to empty string for API
    const apiValue = (newValue === 'Not set') ? '' : newValue;

    // Get all current field values for update
    const container = document.getElementById('accountContainer');
    const fieldElements = container.querySelectorAll('[data-field]');
    const userData = {};

    fieldElements.forEach(el => {
      const fieldValue = el.dataset.originalValue;
      userData[el.dataset.field] = (fieldValue === 'Not set') ? '' : fieldValue;
    });

    // Update the changed field
    userData[valueElement.dataset.field] = apiValue;

    // Only send editable fields
    const updateData = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      university: userData.university
    };

    console.log('Updating user with data:', updateData);

    try {
      const data = await api.updateUser(updateData);
      const updatedUser = data.user;
      console.log('Updated user:', updatedUser);

      // Update the display (use "Not set" for empty values)
      const displayValue = (apiValue === '') ? 'Not set' : apiValue;
      valueElement.textContent = displayValue;
      valueElement.dataset.originalValue = displayValue;

      // Update welcome message if name changed
      if (valueElement.dataset.field === 'first_name' || valueElement.dataset.field === 'last_name') {
        const fullName = `${updatedUser.first_name} ${updatedUser.last_name}`;
        if (DOM.heroTitle) {
          DOM.heroTitle.textContent = `Welcome, ${fullName}!`;
        }
      }

      // Reset UI
      this.cancelEditing(valueElement);
      this.loadAccountInformation(); // Reload to update display
      UIUtils.showSuccess(CONFIG.UI.MESSAGES.UPDATE_SUCCESS);
    } catch (error) {
      console.error('Error updating account:', error);
      UIUtils.showError(`Update failed: ${error.message}`);
    }
  }

  static cancelEditing(valueElement) {
    // Remove input and buttons, show original text
    const parent = valueElement.parentNode;

    const input = parent.querySelector('input');
    if (input) input.remove();

    const buttons = parent.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.textContent === 'Save' || btn.textContent === 'Cancel') btn.remove();
    });

    valueElement.style.display = '';
  }

  static setupEventListeners() {
    // Load account info when Account tab is clicked
    const accountLink = document.querySelector('a[href="#account"]');
    if (accountLink) {
      accountLink.addEventListener('click', () => this.loadAccountInformation());
    }
  }
}
