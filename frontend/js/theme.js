/**
 * SEP-AI Theme System
 * Handles light/dark mode switching with localStorage persistence
 * Should be loaded at the very start of the page to prevent flash
 */

const ThemeManager = {
  // Initialize theme on page load (call this ASAP)
  init: function() {
    const savedTheme = localStorage.getItem('sepai-theme') || 'dark';
    this.setTheme(savedTheme);
    this.setupEventListeners();
  },

  // Set theme to light or dark
  setTheme: function(theme) {
    // Wait for DOM to be ready
    if (!document.documentElement) {
      setTimeout(() => this.setTheme(theme), 10);
      return;
    }

    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      if (document.body) document.body.classList.remove('dark');
      localStorage.setItem('sepai-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      if (document.body) document.body.classList.add('dark');
      localStorage.setItem('sepai-theme', 'dark');
    }
    this.updateThemeIcon();
  },

  // Toggle between light and dark
  toggle: function() {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  },

  // Get current theme
  getCurrentTheme: function() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  },

  // Update theme icon in navbar/sidebars
  updateThemeIcon: function() {
    const icons = document.querySelectorAll('[id*="themeIcon"], #themeToggle');
    const isDark = this.getCurrentTheme() === 'dark';
    
    icons.forEach(icon => {
      icon.textContent = isDark ? '☀️' : '🌙';
    });
  },

  // Setup event listeners for theme toggle buttons
  setupEventListeners: function() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggle());
    }
  }
};

// Initialize theme immediately on script load
if (document.readyState === 'loading') {
  // DOM not yet loaded
  document.addEventListener('DOMContentLoaded', function() {
    ThemeManager.init();
  });
} else {
  // DOM already loaded
  ThemeManager.init();
}

// Also expose toggle function globally for onclick handlers
function toggleDarkMode() {
  ThemeManager.toggle();
}
