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

        // Edit assessment form submission
        const editForm = document.getElementById('editAssessmentForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.updateAssessment(e));
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
        const response = await fetch(`${CONFIG.API_BASE}/api/assessments/${assessmentId}`, {
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

        // Check user role after the header is populated
        await this.checkUserRole();
    }

    static async loadClassInfo(classId) {
        const token = UIUtils.getToken();
        const response = await fetch(`${CONFIG.API_BASE}/api/classes/${classId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const classData = await response.json();
            document.getElementById('assessment-class').textContent = classData.name;
        }
    }

    static async loadSubmissions(assessmentId) {
        const token = UIUtils.getToken();
        const response = await fetch(`${CONFIG.API_BASE}/api/assessments/${assessmentId}/submissions`, {
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

    static async reviewSubmission(submissionId) {
        this.currentSubmissionId = submissionId;
        // Convert to string for consistent comparison (since HTML generates string values)
        const submission = this.submissionsData.find(s => String(s.id) === String(submissionId));

        if (!submission) {
            console.error('Submission not found. Looking for:', submissionId, 'in:', this.submissionsData.map(s => ({id: s.id, type: typeof s.id})));
            UIUtils.showError('Submission not found');
            return;
        }

        // Fetch full submission details to get ai_evaluation_data
        const token = UIUtils.getToken();
        try {
            const response = await fetch(`${CONFIG.API_BASE}/api/submissions/${submissionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const fullSubmission = await response.json();
                this.displayAIEvaluation(fullSubmission.ai_evaluation_data || null, fullSubmission);
            } else {
                // Fallback to basic display if fetch fails
                this.displayAIEvaluation(null, submission);
            }
        } catch (error) {
            console.error('Error fetching submission details:', error);
            // Fallback to basic display
            this.displayAIEvaluation(null, submission);
        }

        // Populate form with existing data
        document.getElementById('professorFeedback').value = submission.professor_feedback || '';
        document.getElementById('finalScore').value = submission.final_score || '';

        // Show modal
        document.getElementById('reviewSubmissionModal').classList.remove('hidden');
    }

    static displayAIEvaluation(aiEvaluationData, submission) {
        const aiScoreEl = document.getElementById('ai-score');
        const aiFeedbackEl = document.getElementById('ai-feedback');
        const aiEvaluationDetailsEl = document.getElementById('ai-evaluation-details');

        if (aiEvaluationData && aiEvaluationData.overall_score !== undefined) {
            // Display detailed evaluation
            const percentage = aiEvaluationData.percentage || 0;
            const overallScore = aiEvaluationData.overall_score || 0;
            const maxScore = aiEvaluationData.max_score || 24;

            aiScoreEl.textContent = `${percentage.toFixed(1)}% (${overallScore}/${maxScore})`;

            // Display evaluation criteria if available
            if (aiEvaluationDetailsEl && aiEvaluationData.evaluation) {
                const evalData = aiEvaluationData.evaluation;
                const criteriaNames = {
                    system_design_architecture: 'System Design & Architecture',
                    functionality_features: 'Functionality & Features',
                    code_quality_efficiency: 'Code Quality & Efficiency',
                    usability_user_interface: 'Usability & User Interface',
                    testing_debugging: 'Testing & Debugging',
                    documentation: 'Documentation'
                };

                let criteriaHTML = '<div class="mt-3 space-y-2">';
                criteriaHTML += '<h5 class="font-semibold text-sm text-gray-300 mb-2">Evaluation Criteria:</h5>';
                for (const [key, name] of Object.entries(criteriaNames)) {
                    const score = evalData[key] || 0;
                    criteriaHTML += `<div class="flex justify-between items-center text-sm">
                        <span class="text-gray-400">${name}:</span>
                        <span class="font-medium text-blue-400">${score}/4</span>
                    </div>`;
                }
                criteriaHTML += '</div>';
                aiEvaluationDetailsEl.innerHTML = criteriaHTML;
                aiEvaluationDetailsEl.classList.remove('hidden');
            }

            // Display feedback
            if (aiEvaluationData.feedback && Array.isArray(aiEvaluationData.feedback)) {
                aiFeedbackEl.textContent = aiEvaluationData.feedback.join('\n\n');
            } else {
                aiFeedbackEl.textContent = submission.ai_feedback || 'No feedback provided';
            }
        } else {
            // Fallback to basic display
            aiScoreEl.textContent = submission.ai_score || 'N/A';
            aiFeedbackEl.textContent = submission.ai_feedback || 'No feedback provided';
            if (aiEvaluationDetailsEl) {
                aiEvaluationDetailsEl.classList.add('hidden');
            }
        }
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
            const response = await fetch(`${CONFIG.API_BASE}/api/submissions/${this.currentSubmissionId}`, {
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

            const response = await fetch(`${CONFIG.API_BASE}/api/submissions/${this.currentSubmissionId}`, {
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
            const response = await fetch(`${CONFIG.API_BASE}/api/assessments/${this.currentAssessmentId}/release-scores`, {
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

    static async checkUserRole() {
        const token = UIUtils.getToken();
        if (!token) return;

        try {
            const response = await fetch(`${CONFIG.API_BASE}/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const userData = await response.json();
                const isProfessor = userData.user?.role === 'professor';

                if (isProfessor) {
                    this.showEditButton();
                }
            }
        } catch (error) {
            console.error('Error checking user role:', error);
        }
    }

    static showEditButton() {
        const editButtonContainer = document.getElementById('edit-button-container');
        if (editButtonContainer) {
            editButtonContainer.innerHTML = `
                <button onclick="AssessmentDetails.editAssessment()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    <span>Edit Assessment</span>
                </button>
            `;
        }
    }

    static editAssessment() {
        const token = UIUtils.getToken();

        try {
            const response = fetch(`${CONFIG.API_BASE}/api/assessments/${this.currentAssessmentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            response.then(resp => {
                if (resp.ok) {
                    resp.json().then(assessment => {
                        // Populate the edit form
                        document.getElementById('editAssessmentTitle').value = assessment.title;
                        document.getElementById('editAssessmentDescription').value = assessment.instructions;
                        document.getElementById('editAssessmentDueDate').value = new Date(assessment.deadline).toISOString().slice(0, 16);

                        const modal = document.getElementById('editAssessmentModal');
                        modal.classList.remove('hidden');
                    });
                } else {
                    resp.json().then(error => {
                        UIUtils.showError(`Error: ${error.detail}`);
                    });
                }
            });
        } catch (error) {
            console.error('Error loading assessment for editing:', error);
            UIUtils.showError(CONFIG.UI.MESSAGES.NETWORK_ERROR);
        }
    }

    static closeEditAssessmentModal() {
        const modal = document.getElementById('editAssessmentModal');
        modal.classList.add('hidden');
        modal.style.removeProperty('display');
        document.getElementById('editAssessmentForm').reset();
    }

    static async updateAssessment(event) {
        event.preventDefault();

        const title = document.getElementById('editAssessmentTitle').value.trim();
        const instructions = document.getElementById('editAssessmentDescription').value.trim();
        const deadline = document.getElementById('editAssessmentDueDate').value;

        if (!title || !instructions || !deadline) {
            UIUtils.showError('Please fill in all fields');
            return;
        }

        const token = UIUtils.getToken();
        try {
            const response = await fetch(`${CONFIG.API_BASE}/api/assessments/${this.currentAssessmentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title,
                    instructions: instructions,
                    deadline: deadline
                })
            });

            if (response.ok) {
                UIUtils.showSuccess('Assessment updated successfully!');
                this.closeEditAssessmentModal();
                // Refresh assessment details
                await this.loadAssessmentInfo(this.currentAssessmentId);
            } else {
                const error = await response.json();
                UIUtils.showError(`Error: ${error.detail}`);
            }
        } catch (error) {
            console.error('Error updating assessment:', error);
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
