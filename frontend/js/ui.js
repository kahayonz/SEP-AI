// SEP-AI UI Utility Functions

class UIUtils {
  // Dark mode management
  static toggleDarkMode() {
    document.body.classList.toggle('dark');
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, document.body.classList.contains('dark') ? 'dark' : 'light');
  }

  // Alert utilities
  static showAlert(message, type = 'info') {
    alert(message);
  }

  static showError(message) {
    this.showAlert(message);
  }

  static showSuccess(message) {
    this.showAlert(message);
  }

  // Loading states
  static setLoading(element, isLoading, defaultText = null) {
    if (!element) return defaultText;

    if (isLoading) {
      if (!defaultText) defaultText = element.textContent;
      const loadingText = element.getAttribute('data-loading-text') || 'Loading...';
      element.textContent = loadingText;
      element.disabled = true;
      return defaultText;
    } else {
      element.textContent = defaultText || element.getAttribute('data-default-text') || 'Submit';
      element.disabled = false;
      return null;
    }
  }

  // Navigation
  static navigateTo(targetId) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
      section.classList.add('hidden');
    });

    // Show target section
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.remove('hidden');

      // Scroll to section
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  static scrollToResults() {
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
  }

  // File utilities
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static validateFile(file) {
    if (!file) return false;

    // Check extension
    if (!file.name.toLowerCase().endsWith('.zip')) {
      throw new Error("Please select a valid ZIP file.");
    }

    // Check size
    if (file.size > CONFIG.FILE.MAX_SIZE) {
      throw new Error(`File size must not exceed ${this.formatFileSize(CONFIG.FILE.MAX_SIZE)}`);
    }

    return true;
  }

  // String utilities
  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // URL/Link utilities
  static redirectToLogin() {
    window.location.href = 'login.html';
  }

  static redirectToIndex() {
    window.location.href = 'index.html';
  }

  // Local storage utilities
  static getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  }

  static setToken(token) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  static clearAuth() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  }
}

// Common DOM elements
class DOM {
  static get sidebarToggle() {
    return document.getElementById('sidebarToggle');
  }

  static get sidebar() {
    return document.getElementById('sidebar');
  }

  static get heroTitle() {
    return document.querySelector('.hero-title');
  }

  static sections() {
    return document.querySelectorAll('section');
  }
}

// Event handlers
class EventHandlers {
  static setupSidebar() {
    const toggleBtn = DOM.sidebarToggle;
    const sidebar = DOM.sidebar;

    if (toggleBtn && sidebar) {
      // Toggle button click
      toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('-translate-x-full');
      });

      // Click outside to close
      document.addEventListener('click', function(e) {
        if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target) && !sidebar.classList.contains('-translate-x-full')) {
          sidebar.classList.add('-translate-x-full');
        }
      });
    }
  }

  static setupNavigation() {
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        UIUtils.navigateTo(targetId);
      });
    });
  }
}
