// File Uploader Component

class FileUploader {
  // Store handler references to prevent duplicate listeners
  static _handlers = new Map();

  static setupMainDropzone() {
    const dropbox = document.getElementById('dropbox');
    if (!dropbox) return;

    // Check if already initialized
    if (dropbox.dataset.uploaderInitialized === 'true') return;
    dropbox.dataset.uploaderInitialized = 'true';

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      dropbox.addEventListener(eventName, handler);
      this._handlers.set(`dropbox-${eventName}`, handler);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      const handler = () => {
        dropbox.classList.add('drag-over');
      };
      dropbox.addEventListener(eventName, handler);
      this._handlers.set(`dropbox-highlight-${eventName}`, handler);
    });

    // Remove highlight when item is no longer over drop zone
    ['dragleave', 'drop'].forEach(eventName => {
      const handler = () => {
        dropbox.classList.remove('drag-over');
      };
      dropbox.addEventListener(eventName, handler);
      this._handlers.set(`dropbox-unhighlight-${eventName}`, handler);
    });

    // Handle dropped files
    const dropHandler = (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelect('fileUpload', files[0]);
      }
    };
    dropbox.addEventListener('drop', dropHandler);
    this._handlers.set('dropbox-drop-handle', dropHandler);

    // Handle click on dropbox
    const uploadPrompt = document.getElementById('uploadPrompt');
    if (uploadPrompt && uploadPrompt.dataset.clickListenerAdded !== 'true') {
      const clickHandler = (e) => {
        e.stopPropagation();
        const fileInput = document.getElementById('fileUpload');
        if (fileInput) {
          fileInput.click();
        }
      };
      uploadPrompt.addEventListener('click', clickHandler);
      uploadPrompt.dataset.clickListenerAdded = 'true';
      this._handlers.set('uploadPrompt-click', clickHandler);
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

    // Check if already initialized for this input
    if (fileInput && fileInput.dataset.listenersInitialized === 'true') return;
    if (fileInput) fileInput.dataset.listenersInitialized = 'true';

    if (fileInput) {
      const changeHandler = (e) => {
        const file = e.target.files[0];
        if (file) {
          this.updateFileDisplay(file, dropbox, uploadPrompt, fileSelected, nameElement, sizeElement);
        } else {
          this.resetFileDisplay(dropbox, uploadPrompt, fileSelected);
        }
      };
      fileInput.addEventListener('change', changeHandler);
      this._handlers.set(`${inputId}-change`, changeHandler);
    }

    if (removeFileBtn && removeFileBtn.dataset.clickListenerAdded !== 'true') {
      const removeHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.resetFileDisplay(dropbox, uploadPrompt, fileSelected);
        if (fileInput) fileInput.value = '';
      };
      removeFileBtn.addEventListener('click', removeHandler);
      removeFileBtn.dataset.clickListenerAdded = 'true';
      this._handlers.set(`${removeBtnId || 'removeFile'}-click`, removeHandler);
    }

    if (fileSelected && fileSelected.dataset.clickListenerAdded !== 'true') {
      const selectedClickHandler = (e) => {
        e.stopPropagation();
        if (fileInput) fileInput.click();
      };
      fileSelected.addEventListener('click', selectedClickHandler);
      fileSelected.dataset.clickListenerAdded = 'true';
      this._handlers.set(`${selectedId}-click`, selectedClickHandler);
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

    // Check if already initialized
    if (dropbox.dataset.uploaderInitialized === 'true') return;
    dropbox.dataset.uploaderInitialized = 'true';

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      dropbox.addEventListener(eventName, handler);
      this._handlers.set(`assessmentDropbox-${eventName}`, handler);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      const handler = () => {
        dropbox.classList.add('drag-over');
      };
      dropbox.addEventListener(eventName, handler);
      this._handlers.set(`assessmentDropbox-highlight-${eventName}`, handler);
    });

    // Remove highlight when item is no longer over drop zone
    ['dragleave', 'drop'].forEach(eventName => {
      const handler = () => {
        dropbox.classList.remove('drag-over');
      };
      dropbox.addEventListener(eventName, handler);
      this._handlers.set(`assessmentDropbox-unhighlight-${eventName}`, handler);
    });

    // Handle dropped files
    const dropHandler = (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelect('assessmentFileUpload', files[0]);
      }
    };
    dropbox.addEventListener('drop', dropHandler);
    this._handlers.set('assessmentDropbox-drop-handle', dropHandler);

    // Handle click on dropbox
    const uploadPrompt = document.getElementById('assessmentUploadPrompt');
    if (uploadPrompt && uploadPrompt.dataset.clickListenerAdded !== 'true') {
      const clickHandler = (e) => {
        e.stopPropagation();
        const fileInput = document.getElementById('assessmentFileUpload');
        if (fileInput) {
          fileInput.click();
        }
      };
      uploadPrompt.addEventListener('click', clickHandler);
      uploadPrompt.dataset.clickListenerAdded = 'true';
      this._handlers.set('assessmentUploadPrompt-click', clickHandler);
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
