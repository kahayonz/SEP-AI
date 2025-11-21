// Assessment Details Page
class AssessmentDetails {
    static currentAssessmentId = null;
    static currentSubmissionId = null;
    static submissionsData = [];

    static async init() {
        this.setupEventListeners();
        await this.loadAssessmentDetails();

        // Initialize theme
        const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
        }
    }

    static setupEventListeners() {
        // Review form submission
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => this.saveReview(e));
        }
    }

    static async loadAssessmentDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const assessmentId = urlParams.get('id');

        if (!assessmentId) {
            UIUtils.showError('Assessment ID not found');
            history.back();
            return;
        }

        this.currentAssessmentId = assessmentId;

        try {
            this.showLoading();

            // Load assessment info and submissions in parallel
            await Promise.all([
                this.loadAssessmentInfo(assessmentId),
                this.loadSubmissions(assessmentId)
            ]);

            this.updateStatistics();
        } catch (error) {
            console.error('Error loading assessment details:', error);
            UIUtils.showError('Failed to load assessment details');
        } finally {
            this.hideLoading();
        }
    }

    static async loadAssessmentInfo(assessmentId) {
        const token = UIUtils.getToken();
        const response = await fetch(`http://localhost:8000/api/assessments/${assessmentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to load assessment info');
        }

        const assessment = await response.json();

        // Update header
        document.getElementById('assessment-title').textContent = assessment.title;
        document.getElementById('assessment-description').textContent = assessment.instructions;
        document.getElementById('assessment-deadline').textContent =
            new Date(assessment.deadline).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        document.getElementById('assessment-class').textContent = assessment.class_name;
    }

    static async loadClassInfo(classId) {
        const token = UIUtils.getToken();
        const response = await fetch(`http://localhost:8000/api/classes/${classId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const classData = await response.json();
            document.getElementById('assessment-class').textContent = classData.name;
        }
    }

    static async loadSubmissions(assessmentId) {
        const token = UIUtils.getToken();
        const response = await fetch(`http://localhost:8000/api/assessments/${assessmentId}/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to load submissions');
        }

        this.submissionsData = await response.json();
        this.displaySubmissions();
    }

    static displaySubmissions() {
        const tableBody = document.getElementById('submissions-table-body');
        const emptyState = document.getElementById('empty-state');

        if (this.submissionsData.length === 0) {
            tableBody.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        tableBody.innerHTML = this.submissionsData.map(submission => {
            // Change "reviewed" status to "graded" for display
            const statusDisplay = submission.status === 'reviewed' ? 'graded' : submission.status;
            const statusColor = submission.status === 'released' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                               submission.status === 'reviewed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                               'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

            // Handle submission date display for newly added students
            const submissionDate = submission.created_at
                ? new Date(submission.created_at).toLocaleDateString()
                : (submission.status === 'no submission' ? '-' : 'Invalid Date');

            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${submission.student_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${submission.student_email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${submissionDate}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${statusDisplay}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${submission.ai_score || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${submission.final_score ?? '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="AssessmentDetails.reviewSubmission('${submission.id}')" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                            ${submission.professor_feedback ? 'Edit Review' : 'Review'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    static updateStatistics() {
        const total = this.submissionsData.length;
        const graded = this.submissionsData.filter(s => s.status === 'reviewed' || s.status === 'released').length;
        const pending = this.submissionsData.filter(s => s.status === 'pending').length;
        const scoredFinal = this.submissionsData.filter(s => s.final_score !== null && s.final_score !== undefined);
        const average = scoredFinal.length > 0 ?
            (scoredFinal.reduce((sum, s) => sum + s.final_score, 0) / scoredFinal.length).toFixed(1) : 'N/A';

        document.getElementById('total-submissions').textContent = total;
        document.getElementById('graded-submissions').textContent = graded;
        document.getElementById('pending-submissions').textContent = pending;
        document.getElementById('average-score').textContent = average;
    }

    static reviewSubmission(submissionId) {
        this.currentSubmissionId = submissionId;
        // Convert to string for consistent comparison (since HTML generates string values)
        const submission = this.submissionsData.find(s => String(s.id) === String(submissionId));

        if (!submission) {
            console.error('Submission not found. Looking for:', submissionId, 'in:', this.submissionsData.map(s => ({id: s.id, type: typeof s.id})));
            UIUtils.showError('Submission not found');
            return;
        }

        // Populate AI feedback
        document.getElementById('ai-score').textContent = submission.ai_score || 'N/A';
        document.getElementById('ai-feedback').textContent = submission.ai_feedback || 'No feedback provided';

        // Populate form with existing data
        document.getElementById('professorFeedback').value = submission.professor_feedback || '';
        document.getElementById('finalScore').value = submission.final_score || '';

        // Show modal
        document.getElementById('reviewSubmissionModal').classList.remove('hidden');
    }

    static closeReviewModal() {
        document.getElementById('reviewSubmissionModal').classList.add('hidden');
        document.getElementById('reviewForm').reset();
        this.currentSubmissionId = null;
    }

    static async saveReview(event) {
        event.preventDefault();

        const feedback = document.getElementById('professorFeedback').value.trim();
        const score = parseFloat(document.getElementById('finalScore').value);

        if (isNaN(score) || score < 0 || score > 100) {
            UIUtils.showError('Please enter a valid score between 0 and 100');
            return;
        }

        const token = UIUtils.getToken();
        try {
            const response = await fetch(`http://localhost:8000/api/submissions/${this.currentSubmissionId}`, {
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
                UIUtils.showSuccess('Review saved successfully!');
                this.closeReviewModal();
                // Refresh submissions
                await this.loadSubmissions(this.currentAssessmentId);
                this.updateStatistics();
            } else {
                const error = await response.json();
                UIUtils.showError(`Error: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error saving review:', error);
            UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
        }
    }

    static async downloadSubmission() {
        if (!this.currentSubmissionId) return;

        const downloadBtn = document.getElementById('download-btn');
        const downloadBtnText = document.getElementById('download-btn-text');
        const downloadSpinner = document.getElementById('download-spinner');

        const token = UIUtils.getToken();
        if (!token) {
            UIUtils.showError(CONFIG.UI.MESSAGES.LOGIN_REQUIRED);
            return;
        }

        try {
            // Show loading state
            downloadBtn.disabled = true;
            downloadBtnText.textContent = 'Downloading...';
            downloadSpinner.classList.remove('hidden');

            const response = await fetch(`http://localhost:8000/api/submissions/${this.currentSubmissionId}`, {
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
        } finally {
            // Reset button state
            downloadBtn.disabled = false;
            downloadBtnText.textContent = 'Download Project';
            downloadSpinner.classList.add('hidden');
        }
    }

    static async releaseScores() {
        if (!confirm('Are you sure you want to release all graded scores for this assessment? Released scores will be visible to students.')) return;

        const token = UIUtils.getToken();
        try {
            const response = await fetch(`http://localhost:8000/api/assessments/${this.currentAssessmentId}/release-scores`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                UIUtils.showSuccess(`Scores released successfully!`);
                // Refresh submissions to show updated status
                await this.loadSubmissions(this.currentAssessmentId);
                this.updateStatistics();
            } else {
                const error = await response.json();
                UIUtils.showError(`Error: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error releasing scores:', error);
            UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
        }
    }

    static showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    static hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AssessmentDetails.init();
});

// Make class globally available
window.AssessmentDetails = AssessmentDetails;
