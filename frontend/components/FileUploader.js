// File Uploader Component

class FileUploader {
  static setupMainDropzone() {
    const dropbox = document.getElementById('dropbox');
    if (!dropbox) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropbox.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      dropbox.addEventListener(eventName, () => {
        dropbox.classList.add('drag-over');
      });
    });

    // Remove highlight when item is no longer over drop zone
    ['dragleave', 'drop'].forEach(eventName => {
      dropbox.addEventListener(eventName, () => {
        dropbox.classList.remove('drag-over');
      });
    });

    // Handle dropped files
    dropbox.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelect('fileUpload', files[0]);
      }
    });

    // Handle click on dropbox
    const uploadPrompt = document.getElementById('uploadPrompt');
    if (uploadPrompt) {
      uploadPrompt.addEventListener('click', () => {
        document.getElementById('fileUpload').click();
      });
    }
  }

  static setupEventListeners(inputId, dropboxId, promptId, selectedId, nameElementId = null, sizeElementId = null, removeBtnId = null) {
    const fileInput = document.getElementById(inputId);
    const dropbox = document.getElementById(dropboxId);
    const uploadPrompt = document.getElementById(promptId);
    const fileSelected = document.getElementById(selectedId);

    const nameElement = nameElementId ? document.getElementById(nameElementId) : document.getElementById('selectedFileName');
    const sizeElement = sizeElementId ? document.getElementById(sizeElementId) : document.getElementById('selectedFileSize');
    const removeFileBtn = removeBtnId ? document.getElementById(removeBtnId) : document.getElementById('removeFile');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.updateFileDisplay(file, dropbox, uploadPrompt, fileSelected, nameElement, sizeElement);
        } else {
          this.resetFileDisplay(dropbox, uploadPrompt, fileSelected);
        }
      });
    }

    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.resetFileDisplay(dropbox, uploadPrompt, fileSelected);
        fileInput.value = '';
      });
    }

    if (fileSelected) {
      fileSelected.addEventListener('click', () => {
        fileInput.click();
      });
    }
  }

  static handleFileSelect(inputId, file) {
    const fileInput = document.getElementById(inputId);
    if (fileInput && file) {
      // Create a DataTransfer object to set the file
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;

      // Trigger change event
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  static updateFileDisplay(file, dropbox, uploadPrompt, fileSelected, nameElement = null, sizeElement = null) {
    try {
      UIUtils.validateFile(file);

      const fileName = file.name;
      const fileSize = UIUtils.formatFileSize(file.size);

      // Use provided elements or fall back to default IDs
      const nameEl = nameElement || document.getElementById('selectedFileName');
      const sizeEl = sizeElement || document.getElementById('selectedFileSize');

      if (nameEl) nameEl.textContent = fileName;
      if (sizeEl) sizeEl.textContent = fileSize;

      uploadPrompt.classList.add('hidden');
      fileSelected.classList.remove('hidden');

      // Update dropbox styling to indicate file is selected
      dropbox.classList.remove('border-gray-300', 'dark:border-gray-600');
      dropbox.classList.add('border-green-300', 'dark:border-green-600');
    } catch (error) {
      UIUtils.showError(error.message);
      this.resetFileDisplay(dropbox, uploadPrompt, fileSelected);
    }
  }

  static resetFileDisplay(dropbox, uploadPrompt, fileSelected) {
    uploadPrompt.classList.remove('hidden');
    fileSelected.classList.add('hidden');

    // Reset dropbox styling
    dropbox.classList.remove('border-green-300', 'dark:border-green-600');
    dropbox.classList.add('border-gray-300', 'dark:border-gray-600');
  }

  // Assessment-specific file uploader methods
  static setupAssessmentDropbox() {
    const dropbox = document.getElementById('assessmentDropbox');
    if (!dropbox) return;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropbox.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      dropbox.addEventListener(eventName, () => {
        dropbox.classList.add('drag-over');
      });
    });

    // Remove highlight when item is no longer over drop zone
    ['dragleave', 'drop'].forEach(eventName => {
      dropbox.addEventListener(eventName, () => {
        dropbox.classList.remove('drag-over');
      });
    });

    // Handle dropped files
    dropbox.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelect('assessmentFileUpload', files[0]);
      }
    });

    // Handle click on dropbox
    const uploadPrompt = document.getElementById('assessmentUploadPrompt');
    if (uploadPrompt) {
      uploadPrompt.addEventListener('click', () => {
        document.getElementById('assessmentFileUpload').click();
      });
    }

    // Setup event listeners for file input and display updates
    this.setupEventListeners(
      'assessmentFileUpload',
      'assessmentDropbox',
      'assessmentUploadPrompt',
      'assessmentFileSelected',
      'assessmentSelectedFileName',
      'assessmentSelectedFileSize',
      'assessmentRemoveFile'
    );
  }

  static resetAssessmentDropbox() {
    const dropbox = document.getElementById('assessmentDropbox');
    const uploadPrompt = document.getElementById('assessmentUploadPrompt');
    const fileSelected = document.getElementById('assessmentFileSelected');

    if (dropbox && uploadPrompt && fileSelected) {
      this.resetFileDisplay(dropbox, uploadPrompt, fileSelected);
    }
  }
}

window.FileUploader = FileUploader;
