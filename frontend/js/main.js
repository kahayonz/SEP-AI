// Main Application Entry Point

// Global dark mode toggle function - DISABLED
function toggleDarkMode() {
  console.log('Theme toggle is disabled - dark mode only');
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('SEP-AI Portal initializing...');

  try {
    // Detect which portal to initialize based on page title
    const pageTitle = document.title;

    if (pageTitle.includes('Assessment Details') && typeof AssessmentDetails !== 'undefined') {
      console.log('Initializing Assessment Details...');
      await AssessmentDetails.init();
      console.log('SEP-AI Assessment Details initialized successfully!');
    } else if (pageTitle.includes('Professor Portal') && typeof ProfessorPortal !== 'undefined') {
      console.log('Initializing Professor Portal...');
      await ProfessorPortal.init();
      console.log('SEP-AI Professor Portal initialized successfully!');
    } else if (pageTitle.includes('Student Portal') && typeof StudentPortal !== 'undefined') {
      console.log('Initializing Student Portal...');
      await StudentPortal.init();
      console.log('SEP-AI Student Portal initialized successfully!');
    } else {
      console.warn('Unknown portal type:', pageTitle);
      // Fallback to StudentPortal if available
      if (typeof StudentPortal !== 'undefined') {
        await StudentPortal.init();
        console.log('SEP-AI Portal initialized with Student Portal as fallback!');
      } else {
        throw new Error('No portal found for this page');
      }
    }
  } catch (error) {
    console.error('Failed to initialize application:', error);
    // Show a fallback error message
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      heroTitle.textContent = 'Application failed to load';
    }
  }
});
