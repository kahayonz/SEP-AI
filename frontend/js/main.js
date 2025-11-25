// Main Application Entry Point

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Detect which portal to initialize based on page title
    const pageTitle = document.title;

    if (pageTitle.includes('Assessment Details') && typeof AssessmentDetails !== 'undefined') {
      await AssessmentDetails.init();
    } else if (pageTitle.includes('Professor Portal') && typeof ProfessorPortal !== 'undefined') {
      await ProfessorPortal.init();
    } else if (pageTitle.includes('Student Portal') && typeof StudentPortal !== 'undefined') {
      await StudentPortal.init();
    } else {
      // Fallback to StudentPortal if available
      if (typeof StudentPortal !== 'undefined') {
        await StudentPortal.init();
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
