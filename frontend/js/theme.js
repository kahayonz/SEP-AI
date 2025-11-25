const ThemeManager = {
  init: function() {
    this.enforceDarkMode();
  },

  enforceDarkMode: function() {
    document.documentElement.classList.add('dark');
    if (document.body) document.body.classList.add('dark');
  },

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
