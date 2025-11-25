/**
 * SEP-AI Theme System - DARK MODE ONLY
 * Theme toggling is disabled. Application runs in dark mode only.
 */

const ThemeManager = {
  // Initialize theme - force dark mode only
  init: function() {
    this.enforceDarkMode();
  },

  // Force dark mode
  enforceDarkMode: function() {
    document.documentElement.classList.add('dark');
    if (document.body) document.body.classList.add('dark');
  },

  // Disabled: toggle is no longer available
  toggle: function() {
    console.log('Theme toggle is disabled - dark mode only');
  },

  // Get current theme (always dark)
  getCurrentTheme: function() {
    return 'dark';
  }
};

// Initialize dark mode immediately on script load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    ThemeManager.init();
  });
} else {
  ThemeManager.init();
}

// Disabled toggle function
function toggleDarkMode() {
  console.log('Theme toggle is disabled - dark mode only');
}
