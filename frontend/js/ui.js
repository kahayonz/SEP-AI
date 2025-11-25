// SEP-AI UI Utility Functions

/**
 * UI utility class providing common UI operations.
 * @class
 */
class UIUtils {
  /**
   * Show a notification message to the user.
   * @static
   * @param {string} message - The message to display
   * @param {('info'|'success'|'error'|'warning')} type - The type of message
   */
  static showAlert(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg max-w-md z-50 animate-slide-in ${this._getAlertStyles(type)}`;
    
    const icon = this._getAlertIcon(type);
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${icon}
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <button class="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500" onclick="this.parentElement.parentElement.remove()">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  /**
   * Get CSS classes for alert styling based on type.
   * @private
   * @static
   * @param {string} type - Alert type
   * @returns {string} CSS classes
   */
  static _getAlertStyles(type) {
    const styles = {
      success: 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200',
      error: 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200',
      warning: 'bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      info: 'bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
    };
    return styles[type] || styles.info;
  }

  /**
   * Get icon SVG for alert based on type.
   * @private
   * @static
   * @param {string} type - Alert type
   * @returns {string} SVG icon HTML
   */
  static _getAlertIcon(type) {
    const icons = {
      success: '<svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
      error: '<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
      warning: '<svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
      info: '<svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
    };
    return icons[type] || icons.info;
  }

  /**
   * Show an error message.
   * @static
   * @param {string} message - Error message to display
   */
  static showError(message) {
    this.showAlert(message, 'error');
  }

  /**
   * Show a success message.
   * @static
   * @param {string} message - Success message to display
   */
  static showSuccess(message) {
    this.showAlert(message, 'success');
  }

  /**
   * Show a warning message.
   * @static
   * @param {string} message - Warning message to display
   */
  static showWarning(message) {
    this.showAlert(message, 'warning');
  }

  /**
   * Set loading state for a button or element.
   * @static
   * @param {HTMLElement} element - The element to set loading state on
   * @param {boolean} isLoading - Whether to show loading state
   * @param {string} [defaultText=null] - The default text to restore
   * @returns {string|null} The original text if entering loading state, null otherwise
   */
  static setLoading(element, isLoading, defaultText = null) {
    if (!element) return defaultText;

    if (isLoading) {
      if (!defaultText) defaultText = element.textContent;
      const loadingText = element.getAttribute('data-loading-text') || 'Loading...';
      element.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        ${loadingText}
      `;
      element.disabled = true;
      element.classList.add('opacity-75', 'cursor-not-allowed');
      return defaultText;
    } else {
      element.textContent = defaultText || element.getAttribute('data-default-text') || 'Submit';
      element.disabled = false;
      element.classList.remove('opacity-75', 'cursor-not-allowed');
      return null;
    }
  }

  /**
   * Navigate to a specific section of the application.
   * Automatically saves the current section for page reload persistence.
   * @static
   * @param {string} targetId - ID of the target section
   */
  static navigateTo(targetId) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
      section.classList.add('hidden');
    });

    // Show target section
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.remove('hidden');

      // If navigating to dashboard, also show classes section
      if (targetId === 'dashboard') {
        const classesSection = document.getElementById('classes');
        if (classesSection) {
          classesSection.classList.remove('hidden');
        }
      }

      // Scroll to section
      target.scrollIntoView({ behavior: 'smooth' });
      
      // Save current section to localStorage for page reload persistence
      localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_SECTION, targetId);
    }
  }

  /**
   * Scroll to the results section.
   * @static
   */
  static scrollToResults() {
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Format file size in bytes to human-readable format.
   * @static
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate an uploaded file.
   * @static
   * @param {File} file - The file to validate
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  static validateFile(file) {
    if (!file) {
      throw new Error("Please select a file.");
    }

    // Check extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = CONFIG.FILE.ALLOWED_EXTENSIONS.some(
      ext => fileName.endsWith(ext)
    );
    
    if (!hasValidExtension) {
      throw new Error(
        `Please select a valid file. Allowed types: ${CONFIG.FILE.ALLOWED_EXTENSIONS.join(', ')}`
      );
    }

    // Check size
    if (file.size > CONFIG.FILE.MAX_SIZE) {
      throw new Error(
        `File size must not exceed ${this.formatFileSize(CONFIG.FILE.MAX_SIZE)}`
      );
    }

    // Check if file is empty
    if (file.size === 0) {
      throw new Error("File is empty. Please select a valid file.");
    }

    return true;
  }

  /**
   * Capitalize the first letter of a string.
   * @static
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  static capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Sanitize user input to prevent XSS attacks.
   * @static
   * @param {string} input - User input to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Redirect to login page.
   * @static
   */
  static redirectToLogin() {
    window.location.href = 'login.html';
  }

  /**
   * Redirect to index page.
   * @static
   */
  static redirectToIndex() {
    window.location.href = 'index.html';
  }

  /**
   * Get authentication token from storage.
   * @static
   * @returns {string|null} Access token or null
   */
  static getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Save authentication token to storage.
   * @static
   * @param {string} token - Access token to save
   */
  static setToken(token) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  /**
   * Clear all authentication data from storage.
   * @static
   */
  static clearAuth() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_SECTION);
  }
}

/**
 * DOM element accessors for common elements.
 * @class
 */
class DOM {
  /**
   * Get sidebar toggle button.
   * @static
   * @returns {HTMLElement|null}
   */
  static get sidebarToggle() {
    return document.getElementById('sidebarToggle');
  }

  /**
   * Get sidebar element.
   * @static
   * @returns {HTMLElement|null}
   */
  static get sidebar() {
    return document.getElementById('sidebar');
  }

  /**
   * Get hero title element.
   * @static
   * @returns {HTMLElement|null}
   */
  static get heroTitle() {
    return document.querySelector('.hero-title');
  }

  /**
   * Get all section elements.
   * @static
   * @returns {NodeList}
   */
  static sections() {
    return document.querySelectorAll('section');
  }
}

/**
 * Event handler setup utilities.
 * @class
 */
class EventHandlers {
  /**
   * Setup sidebar toggle functionality.
   * @static
   */
  static setupSidebar() {
    const toggleBtn = DOM.sidebarToggle;
    const sidebar = DOM.sidebar;

    if (toggleBtn && sidebar) {
      // Toggle button click
      toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.toggle('-translate-x-full');
      });

      // Click outside to close
      document.addEventListener('click', function(e) {
        if (!sidebar.contains(e.target) && 
            !toggleBtn.contains(e.target) && 
            !sidebar.classList.contains('-translate-x-full')) {
          sidebar.classList.add('-translate-x-full');
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !sidebar.classList.contains('-translate-x-full')) {
          sidebar.classList.add('-translate-x-full');
        }
      });
    }
  }

  /**
   * Setup navigation link handlers.
   * @static
   */
  static setupNavigation() {
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        UIUtils.navigateTo(targetId);
        
        // Close sidebar on mobile after navigation
        const sidebar = DOM.sidebar;
        if (sidebar && window.innerWidth < 768) {
          sidebar.classList.add('-translate-x-full');
        }
      });
    });
  }
}
