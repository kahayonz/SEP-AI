// Main Application Entry Point

// Global dark mode toggle function
function toggleDarkMode() {
  UIUtils.toggleDarkMode();
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('SEP-AI Student Portal initializing...');

  try {
    // Initialize the student portal
    await StudentPortal.init();

    console.log('SEP-AI Student Portal initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    // Show a fallback error message
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      heroTitle.textContent = 'Application failed to load';
    }
  }
});
