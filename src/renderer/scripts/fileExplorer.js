/**
 * File Explorer for Codium AI IDE
 * Inspired by VSCodium's file explorer implementation
 */
class FileExplorer {
  constructor() {
    this.container = null;
    this.treeView = null;
    this.rootPath = '';
    this.fileTree = {};
    this.draggedItem = null;
    this.dragOverItem = null;
    this.selectedItem = null;
    this.contextMenu = null;
    this.isLoading = false;
    this.expandedFolders = new Set();
  }

  /**
   * Initialize the file explorer
   */
  init() {
    this.container = document.querySelector('.file-explorer');
    
    if (!this.container) {
      console.error('File explorer container not found');
      return;
    }
    
    // Create tree view container
    this.treeView = document.createElement('div');
    this.treeView.classList.add('file-explorer-tree');
    this.container.appendChild(this.treeView);
    
    // Create context menu
    this.createContextMenu();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Get the workspace root path
    window.electronAPI.getWorkspacePath()
      .then(path => {
        this.rootPath = path;
        this.refreshFileExplorer();
      })
      .catch(error => {
        console.error('Failed to get workspace path:', error);
        this.setErrorState('Failed to load workspace');
      });
  }

  /**
   * Setup event listeners for file explorer actions
   */
  setupEventListeners() {
    // Handle tree item click
    this.treeView.addEventListener('click', (e) => {
      const treeItem = e.target.closest('.file-explorer-item');
      if (!treeItem) return;
      
      // Handle folder click (toggle expand/collapse)
      if (treeItem.dataset.type === 'folder') {
        this.toggleFolder(treeItem);
      } 
      // Handle file click (open in editor)
      else if (treeItem.dataset.type === 'file') {
        this.openFile(treeItem.dataset.path);
      }
      
      // Select the clicked item
      this.selectItem(treeItem);
    });
    
    // Handle tree item double click
    this.treeView.addEventListener('dblclick', (e) => {
      const treeItem = e.target.closest('.file-explorer-item');
      if (!treeItem) return;
      
      // For files, open in editor
      if (treeItem.dataset.type === 'file') {
        this.openFile(treeItem.dataset.path);
      }
    });
    
    // Handle context menu
    this.treeView.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const treeItem = e.target.closest('.file-explorer-item');
      if (!treeItem) return;
      
      // Select the right-clicked item
      this.selectItem(treeItem);
      
      // Show context menu
      this.showContextMenu(e.clientX, e.clientY, treeItem);
    });
    
    // Handle drag and drop
    this.setupDragAndDrop();
    
    // Handle action buttons
    const newFileBtn = document.querySelector('.file-explorer-action-new-file');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', () => this.createNewFile());
    }
    
    const newFolderBtn = document.querySelector('.file-explorer-action-new-folder');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', () => this.createNewFolder());
    }
    
    const refreshBtn = document.querySelector('.file-explorer-action-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshFileExplorer());
    }
    
    const collapseBtn = document.querySelector('.file-explorer-action-collapse');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => this.collapseAll());
    }
    
    // Close context menu when clicking elsewhere
    document.addEventListener('click', () => {
      if (this.contextMenu) {
        this.contextMenu.style.display = 'none';
      }
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when file explorer is focused
      if (!this.container.contains(document.activeElement) && 
          !this.container.classList.contains('focused')) {
        return;
      }
      
      switch (e.key) {
        case 'Delete':
          if (this.selectedItem) {
            this.deleteItem(this.selectedItem.dataset.path);
            e.preventDefault();
          }
          break;
          
        case 'F2':
          if (this.selectedItem) {
            this.renameItem(this.selectedItem);
            e.preventDefault();
          }
          break;
          
        case 'Enter':
          if (this.selectedItem) {
            if (this.selectedItem.dataset.type === 'folder') {
              this.toggleFolder(this.selectedItem);
            } else {
              this.openFile(this.selectedItem.dataset.path);
            }
            e.preventDefault();
          }
          break;
          
        case 'c':
          if (e.ctrlKey && this.selectedItem) {
            this.copyItem(this.selectedItem.dataset.path);
            e.preventDefault();
          }
          break;
          
        case 'x':
          if (e.ctrlKey && this.selectedItem) {
            this.cutItem(this.selectedItem.dataset.path);
            e.preventDefault();
          }
          break;
          
        case 'v':
          if (e.ctrlKey) {
            this.pasteItem();
            e.preventDefault();
          }
          break;
      }
    });
  }

  /**
   * Set up drag and drop functionality
   */
  setupDragAndDrop() {
    // Make items draggable
    this.treeView.addEventListener('dragstart', (e) => {
      const treeItem = e.target.closest('.file-explorer-item');
      if (!treeItem) return;
      
      this.draggedItem = treeItem;
      e.dataTransfer.setData('text/plain', treeItem.dataset.path);
      e.dataTransfer.effectAllowed = 'move';
      
      // Add dragging class
      treeItem.classList.add('dragging');
    });
    
    // Handle drag end
    this.treeView.addEventListener('dragend', (e) => {
      const treeItem = e.target.closest('.file-explorer-item');
      if (treeItem) {
        treeItem.classList.remove('dragging');
      }
      
      // Reset drag state
      this.draggedItem = null;
      
      // Remove all drag over indicators
      const dragOverItems = this.treeView.querySelectorAll('.drag-over');
      dragOverItems.forEach(item => item.classList.remove('drag-over'));
    });
    
    // Handle drag over
    this.treeView.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const treeItem = e.target.closest('.file-explorer-item');
      if (!treeItem || treeItem === this.draggedItem) return;
      
      // Remove drag over class from previous item
      if (this.dragOverItem && this.dragOverItem !== treeItem) {
        this.dragOverItem.classList.remove('drag-over');
      }
      
      // Add drag over class to current item
      treeItem.classList.add('drag-over');
      this.dragOverItem = treeItem;
    });
    
    // Handle drop
    this.treeView.addEventListener('drop', (e) => {
      e.preventDefault();
      
      const targetItem = e.target.closest('.file-explorer-item');
      if (!targetItem || !this.draggedItem) return;
      
      // Get source and target paths
      const sourcePath = this.draggedItem.dataset.path;
      let targetPath = targetItem.dataset.path;
      
      // If target is a file, use its parent folder
      if (targetItem.dataset.type === 'file') {
        targetPath = targetPath.substring(0, targetPath.lastIndexOf('/'));
      }
      
      // Move the file or folder
      this.moveItem(sourcePath, targetPath);
      
      // Remove drag over class
      targetItem.classList.remove('drag-over');
    });
  }

  /**
   * Create the context menu
   */
  createContextMenu() {
    // Create context menu if it doesn't exist
    if (!this.contextMenu) {
      this.contextMenu = document.createElement('div');
      this.contextMenu.classList.add('context-menu');
      document.body.appendChild(this.contextMenu);
    }
  }

  /**
   * Show context menu
   */
  showContextMenu(x, y, treeItem) {
    // Clear existing menu items
    this.contextMenu.innerHTML = '';
    
    // Create menu items based on item type
    const isFolder = treeItem.dataset.type === 'folder';
    const menuItems = [
      {
        label: 'New File',
        icon: 'file-add',
        callback: () => this.createNewFile(treeItem.dataset.path)
      },
      {
        label: 'New Folder',
        icon: 'folder-add',
        callback: () => this.createNewFolder(treeItem.dataset.path)
      },
      { type: 'separator' },
      {
        label: 'Open',
        icon: isFolder ? 'folder-opened' : 'go-to-file',
        callback: () => {
          if (isFolder) {
            this.toggleFolder(treeItem);
          } else {
            this.openFile(treeItem.dataset.path);
          }
        }
      }
    ];
    
    if (isFolder) {
      menuItems.push({
        label: treeItem.classList.contains('expanded') ? 'Collapse' : 'Expand',
        icon: treeItem.classList.contains('expanded') ? 'chevron-up' : 'chevron-down',
        callback: () => this.toggleFolder(treeItem)
      });
    }
    
    menuItems.push(
      { type: 'separator' },
      {
        label: 'Cut',
        icon: 'cut',
        callback: () => this.cutItem(treeItem.dataset.path)
      },
      {
        label: 'Copy',
        icon: 'copy',
        callback: () => this.copyItem(treeItem.dataset.path)
      },
      {
        label: 'Paste',
        icon: 'paste',
        callback: () => this.pasteItem(treeItem.dataset.path),
        disabled: !this.clipboardItem
      },
      { type: 'separator' },
      {
        label: 'Rename',
        icon: 'edit',
        callback: () => this.renameItem(treeItem)
      },
      {
        label: 'Delete',
        icon: 'trash',
        callback: () => this.deleteItem(treeItem.dataset.path)
      }
    );
    
    // Create menu HTML
    menuItems.forEach(item => {
      if (item.type === 'separator') {
        const separator = document.createElement('div');
        separator.classList.add('context-menu-separator');
        this.contextMenu.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.classList.add('context-menu-item');
        
        if (item.disabled) {
          menuItem.classList.add('disabled');
        }
        
        const icon = document.createElement('i');
        icon.classList.add('codicon', `codicon-${item.icon}`);
        
        const label = document.createElement('span');
        label.textContent = item.label;
        
        menuItem.appendChild(icon);
        menuItem.appendChild(label);
        
        if (!item.disabled) {
          menuItem.addEventListener('click', item.callback);
        }
        
        this.contextMenu.appendChild(menuItem);
      }
    });
    
    // Position menu
    const menuWidth = 200;
    const menuHeight = menuItems.length * 24 + (menuItems.filter(item => item.type === 'separator').length * 1);
    
    // Adjust position to keep menu in viewport
    let menuX = x;
    let menuY = y;
    
    if (menuX + menuWidth > window.innerWidth) {
      menuX = window.innerWidth - menuWidth - 5;
    }
    
    if (menuY + menuHeight > window.innerHeight) {
      menuY = window.innerHeight - menuHeight - 5;
    }
    
    this.contextMenu.style.left = `${menuX}px`;
    this.contextMenu.style.top = `${menuY}px`;
    this.contextMenu.style.display = 'block';
  }

  /**
   * Refresh the file explorer
   */
  refreshFileExplorer() {
    this.setLoadingState();
    
    // Get file tree from main process
    window.electronAPI.getFileTree(this.rootPath)
      .then(fileTree => {
        this.fileTree = fileTree;
        this.renderFileTree();
      })
      .catch(error => {
        console.error('Failed to get file tree:', error);
        this.setErrorState('Failed to load file tree');
      });
  }

  /**
   * Render the file tree
   */
  renderFileTree() {
    // Clear tree view
    this.treeView.innerHTML = '';
    
    if (!this.fileTree || !this.fileTree.children) {
      this.setErrorState('No files found');
      return;
    }
    
    // Create root folder
    const rootFolder = document.createElement('div');
    rootFolder.classList.add('file-explorer-item', 'root-folder', 'expanded');
    rootFolder.dataset.type = 'folder';
    rootFolder.dataset.path = this.rootPath;
    rootFolder.draggable = false; // Root folder should not be draggable
    
    const rootIcon = document.createElement('i');
    rootIcon.classList.add('codicon', 'codicon-folder-opened');
    
    const rootLabel = document.createElement('span');
    const rootName = this.rootPath.split('/').pop() || this.rootPath.split('\\').pop() || 'Workspace';
    rootLabel.textContent = rootName;
    
    rootFolder.appendChild(rootIcon);
    rootFolder.appendChild(rootLabel);
    
    // Create children container
    const childrenContainer = document.createElement('div');
    childrenContainer.classList.add('file-explorer-children');
    
    // Render children
    this.renderChildren(this.fileTree.children, childrenContainer);
    
    // Append to tree view
    this.treeView.appendChild(rootFolder);
    this.treeView.appendChild(childrenContainer);
    
    // Remove loading state
    this.setLoadingState(false);
    
    // Restore expanded state
    this.restoreExpandedState();
  }

  /**
   * Render children of a folder
   */
  renderChildren(children, container) {
    if (!children || children.length === 0) {
      return;
    }
    
    // Sort children: folders first, then files, alphabetically
    const sortedChildren = [...children].sort((a, b) => {
      // Folders first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
    
    // Create items for each child
    sortedChildren.forEach(child => {
      const item = document.createElement('div');
      item.classList.add('file-explorer-item');
      item.dataset.type = child.type;
      item.dataset.path = child.path;
      item.draggable = true;
      
      const icon = document.createElement('i');
      if (child.type === 'folder') {
        icon.classList.add('codicon', 'codicon-folder');
        
        // Check if this folder was previously expanded
        if (this.expandedFolders.has(child.path)) {
          item.classList.add('expanded');
          icon.classList.remove('codicon-folder');
          icon.classList.add('codicon-folder-opened');
        }
      } else {
        // Set icon based on file extension
        const iconClass = this.getFileIconClass(child.name);
        icon.classList.add('codicon', iconClass);
      }
      
      const label = document.createElement('span');
      label.textContent = child.name;
      
      item.appendChild(icon);
      item.appendChild(label);
      
      container.appendChild(item);
      
      // If it's a folder and it was expanded, render its children
      if (child.type === 'folder' && child.children && this.expandedFolders.has(child.path)) {
        const childrenContainer = document.createElement('div');
        childrenContainer.classList.add('file-explorer-children');
        container.appendChild(childrenContainer);
        
        this.renderChildren(child.children, childrenContainer);
      }
    });
  }

  /**
   * Get file icon based on extension
   */
  getFileIconClass(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const iconMap = {
      'js': 'file-code',
      'jsx': 'file-code',
      'ts': 'file-code',
      'tsx': 'file-code',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'txt': 'file-text',
      'png': 'file-media',
      'jpg': 'file-media',
      'jpeg': 'file-media',
      'gif': 'file-media',
      'svg': 'file-media',
      'pdf': 'file-pdf',
      'gitignore': 'github',
      'gitattributes': 'github',
      'sh': 'terminal',
      'bat': 'terminal',
      'cmd': 'terminal'
    };
    
    return iconMap[ext] || 'file';
  }

  /**
   * Toggle folder expanded/collapsed state
   */
  toggleFolder(folderItem) {
    const isExpanded = folderItem.classList.contains('expanded');
    const folderPath = folderItem.dataset.path;
    const folderIcon = folderItem.querySelector('i');
    
    // Update UI
    if (isExpanded) {
      // Collapse folder
      folderItem.classList.remove('expanded');
      folderIcon.classList.remove('codicon-folder-opened');
      folderIcon.classList.add('codicon-folder');
      
      // Remove from expanded set
      this.expandedFolders.delete(folderPath);
      
      // Find and hide children container
      let nextEl = folderItem.nextElementSibling;
      if (nextEl && nextEl.classList.contains('file-explorer-children')) {
        nextEl.style.display = 'none';
      }
    } else {
      // Expand folder
      folderItem.classList.add('expanded');
      folderIcon.classList.remove('codicon-folder');
      folderIcon.classList.add('codicon-folder-opened');
      
      // Add to expanded set
      this.expandedFolders.add(folderPath);
      
      // Find children container or create it
      let nextEl = folderItem.nextElementSibling;
      if (nextEl && nextEl.classList.contains('file-explorer-children')) {
        nextEl.style.display = 'block';
      } else {
        // Need to fetch and render children
        this.fetchFolderContents(folderPath, folderItem);
      }
    }
  }

  /**
   * Fetch folder contents
   */
  fetchFolderContents(folderPath, folderItem) {
    // Show loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.classList.add('file-explorer-loading');
    loadingEl.textContent = 'Loading...';
    
    // Insert after folder item
    folderItem.parentNode.insertBefore(loadingEl, folderItem.nextSibling);
    
    // Fetch folder contents
    window.electronAPI.getFolderContents(folderPath)
      .then(children => {
        // Remove loading indicator
        loadingEl.remove();
        
        // Create children container
        const childrenContainer = document.createElement('div');
        childrenContainer.classList.add('file-explorer-children');
        
        // Render children
        this.renderChildren(children, childrenContainer);
        
        // Insert after folder item
        folderItem.parentNode.insertBefore(childrenContainer, folderItem.nextSibling);
      })
      .catch(error => {
        console.error('Failed to fetch folder contents:', error);
        
        // Remove loading indicator
        loadingEl.remove();
        
        // Show error
        const errorEl = document.createElement('div');
        errorEl.classList.add('file-explorer-error');
        errorEl.textContent = 'Failed to load folder contents';
        
        // Insert after folder item
        folderItem.parentNode.insertBefore(errorEl, folderItem.nextSibling);
      });
  }

  /**
   * Open a file in the editor
   */
  openFile(filePath) {
    window.electronAPI.openFile(filePath)
      .catch(error => {
        console.error('Failed to open file:', error);
        this.showNotification('Failed to open file', 'error');
      });
  }

  /**
   * Create a new file
   */
  createNewFile(parentPath = this.rootPath) {
    // Get default parent path if needed
    if (this.selectedItem && this.selectedItem.dataset.type === 'folder') {
      parentPath = this.selectedItem.dataset.path;
    }
    
    // Show file creation dialog
    this.showFileCreationDialog('file', parentPath);
  }

  /**
   * Create a new folder
   */
  createNewFolder(parentPath = this.rootPath) {
    // Get default parent path if needed
    if (this.selectedItem && this.selectedItem.dataset.type === 'folder') {
      parentPath = this.selectedItem.dataset.path;
    }
    
    // Show folder creation dialog
    this.showFileCreationDialog('folder', parentPath);
  }

  /**
   * Show file/folder creation dialog
   */
  showFileCreationDialog(type, parentPath) {
    // Create dialog container
    const dialog = document.createElement('div');
    dialog.classList.add('file-creation-dialog');
    
    // Create dialog content
    const content = document.createElement('div');
    content.classList.add('file-creation-dialog-content');
    
    // Create dialog header
    const header = document.createElement('div');
    header.classList.add('file-creation-dialog-header');
    
    const title = document.createElement('div');
    title.classList.add('file-creation-dialog-title');
    title.textContent = type === 'file' ? 'Create New File' : 'Create New Folder';
    
    const closeBtn = document.createElement('div');
    closeBtn.classList.add('file-creation-dialog-close');
    closeBtn.innerHTML = '<i class="codicon codicon-close"></i>';
    closeBtn.addEventListener('click', () => dialog.remove());
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create dialog body
    const body = document.createElement('div');
    body.classList.add('file-creation-dialog-body');
    
    // Create form
    const form = document.createElement('div');
    form.classList.add('file-creation-dialog-form');
    
    // If creating a file, show templates
    if (type === 'file') {
      const templates = document.createElement('div');
      templates.classList.add('file-creation-dialog-templates');
      
      // Common file templates
      const fileTemplates = [
        { icon: 'html', label: 'HTML', extension: '.html' },
        { icon: 'css', label: 'CSS', extension: '.css' },
        { icon: 'javascript', label: 'JavaScript', extension: '.js' },
        { icon: 'json', label: 'JSON', extension: '.json' },
        { icon: 'markdown', label: 'Markdown', extension: '.md' },
        { icon: 'typescript', label: 'TypeScript', extension: '.ts' },
        { icon: 'react', label: 'React', extension: '.jsx' },
        { icon: 'file-code', label: 'Text', extension: '.txt' }
      ];
      
      let selectedTemplate = null;
      
      fileTemplates.forEach(template => {
        const templateEl = document.createElement('div');
        templateEl.classList.add('file-creation-dialog-template');
        templateEl.dataset.extension = template.extension;
        
        const iconEl = document.createElement('div');
        iconEl.classList.add('file-creation-dialog-template-icon');
        iconEl.innerHTML = `<i class="codicon codicon-${template.icon}"></i>`;
        
        const labelEl = document.createElement('div');
        labelEl.classList.add('file-creation-dialog-template-label');
        labelEl.textContent = template.label;
        
        templateEl.appendChild(iconEl);
        templateEl.appendChild(labelEl);
        
        // Template click handler
        templateEl.addEventListener('click', () => {
          // Remove selected class from previous template
          if (selectedTemplate) {
            selectedTemplate.classList.remove('selected');
          }
          
          // Add selected class to this template
          templateEl.classList.add('selected');
          selectedTemplate = templateEl;
          
          // Update filename input with extension
          const filenameInput = form.querySelector('.file-creation-dialog-input');
          const currentName = filenameInput.value;
          const baseName = currentName.includes('.') ? 
            currentName.substring(0, currentName.lastIndexOf('.')) : 
            currentName;
            
          filenameInput.value = baseName + template.extension;
        });
        
        templates.appendChild(templateEl);
      });
      
      form.appendChild(templates);
    }
    
    // Create input group
    const inputGroup = document.createElement('div');
    inputGroup.classList.add('file-creation-dialog-input-group');
    
    const label = document.createElement('label');
    label.classList.add('file-creation-dialog-label');
    label.textContent = type === 'file' ? 'File name:' : 'Folder name:';
    
    const input = document.createElement('input');
    input.classList.add('file-creation-dialog-input');
    input.type = 'text';
    input.value = type === 'file' ? 'new-file.js' : 'new-folder';
    input.select();
    
    inputGroup.appendChild(label);
    inputGroup.appendChild(input);
    
    // Create location group
    const locationGroup = document.createElement('div');
    locationGroup.classList.add('file-creation-dialog-input-group');
    
    const locationLabel = document.createElement('label');
    locationLabel.classList.add('file-creation-dialog-label');
    locationLabel.textContent = 'Location:';
    
    const locationText = document.createElement('div');
    locationText.textContent = parentPath;
    locationText.style.fontSize = '13px';
    locationText.style.padding = '6px 0';
    
    locationGroup.appendChild(locationLabel);
    locationGroup.appendChild(locationText);
    
    // Create buttons
    const buttons = document.createElement('div');
    buttons.classList.add('file-creation-dialog-buttons');
    
    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('file-creation-dialog-button', 'file-creation-dialog-button-cancel');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => dialog.remove());
    
    const createBtn = document.createElement('button');
    createBtn.classList.add('file-creation-dialog-button', 'file-creation-dialog-button-create');
    createBtn.textContent = type === 'file' ? 'Create File' : 'Create Folder';
    createBtn.addEventListener('click', () => {
      const name = input.value.trim();
      if (!name) return;
      
      if (type === 'file') {
        // Create file
        window.electronAPI.createFile(parentPath, name)
          .then(() => {
            this.refreshFileExplorer();
            this.showNotification(`Created file: ${name}`, 'success');
            dialog.remove();
          })
          .catch(error => {
            console.error('Failed to create file:', error);
            this.showNotification('Failed to create file', 'error');
          });
      } else {
        // Create folder
        window.electronAPI.createFolder(parentPath, name)
          .then(() => {
            this.refreshFileExplorer();
            this.showNotification(`Created folder: ${name}`, 'success');
            dialog.remove();
          })
          .catch(error => {
            console.error('Failed to create folder:', error);
            this.showNotification('Failed to create folder', 'error');
          });
      }
    });
    
    // Enter key should trigger create
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        createBtn.click();
      } else if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(createBtn);
    
    // Assemble the form
    form.appendChild(inputGroup);
    form.appendChild(locationGroup);
    form.appendChild(buttons);
    
    body.appendChild(form);
    
    // Assemble the dialog
    content.appendChild(header);
    content.appendChild(body);
    dialog.appendChild(content);
    
    // Add to document
    document.body.appendChild(dialog);
    
    // Focus input
    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  }

  /**
   * Rename an item
   */
  renameItem(item) {
    const oldPath = item.dataset.path;
    const oldName = item.querySelector('span').textContent;
    const type = item.dataset.type;

    // Create dialog container
    const dialog = document.createElement('div');
    dialog.classList.add('file-creation-dialog');
    
    // Create dialog content
    const content = document.createElement('div');
    content.classList.add('file-creation-dialog-content');
    
    // Create dialog header
    const header = document.createElement('div');
    header.classList.add('file-creation-dialog-header');
    
    const title = document.createElement('div');
    title.classList.add('file-creation-dialog-title');
    title.textContent = `Rename ${type === 'folder' ? 'Folder' : 'File'}`;
    
    const closeBtn = document.createElement('div');
    closeBtn.classList.add('file-creation-dialog-close');
    closeBtn.innerHTML = '<i class="codicon codicon-close"></i>';
    closeBtn.addEventListener('click', () => dialog.remove());
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create dialog body
    const body = document.createElement('div');
    body.classList.add('file-creation-dialog-body');
    
    // Create form
    const form = document.createElement('div');
    form.classList.add('file-creation-dialog-form');
    
    // Create input group
    const inputGroup = document.createElement('div');
    inputGroup.classList.add('file-creation-dialog-input-group');
    
    const label = document.createElement('label');
    label.classList.add('file-creation-dialog-label');
    label.textContent = 'New name:';
    
    const input = document.createElement('input');
    input.classList.add('file-creation-dialog-input');
    input.type = 'text';
    input.value = oldName;
    
    // Select filename without extension
    if (type === 'file' && oldName.includes('.')) {
      const lastDot = oldName.lastIndexOf('.');
      input.setSelectionRange(0, lastDot);
    } else {
      input.select();
    }
    
    inputGroup.appendChild(label);
    inputGroup.appendChild(input);
    
    // Create location group
    const locationGroup = document.createElement('div');
    locationGroup.classList.add('file-creation-dialog-input-group');
    
    const locationLabel = document.createElement('label');
    locationLabel.classList.add('file-creation-dialog-label');
    locationLabel.textContent = 'Location:';
    
    // Get parent path
    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    
    const locationText = document.createElement('div');
    locationText.textContent = parentPath;
    locationText.style.fontSize = '13px';
    locationText.style.padding = '6px 0';
    
    locationGroup.appendChild(locationLabel);
    locationGroup.appendChild(locationText);
    
    // Create buttons
    const buttons = document.createElement('div');
    buttons.classList.add('file-creation-dialog-buttons');
    
    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('file-creation-dialog-button', 'file-creation-dialog-button-cancel');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => dialog.remove());
    
    const renameBtn = document.createElement('button');
    renameBtn.classList.add('file-creation-dialog-button', 'file-creation-dialog-button-create');
    renameBtn.textContent = 'Rename';
    renameBtn.addEventListener('click', () => {
      const newName = input.value.trim();
      if (!newName || newName === oldName) {
        dialog.remove();
        return;
      }
      
      const newPath = `${parentPath}/${newName}`;
      
      // Rename file/folder
      window.electronAPI.renameItem(oldPath, newPath)
        .then(() => {
          this.refreshFileExplorer();
          this.showNotification(`Renamed to: ${newName}`, 'success');
          dialog.remove();
        })
        .catch(error => {
          console.error('Failed to rename item:', error);
          this.showNotification('Failed to rename item', 'error');
        });
    });
    
    // Enter key should trigger rename
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        renameBtn.click();
      } else if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(renameBtn);
    
    // Assemble the form
    form.appendChild(inputGroup);
    form.appendChild(locationGroup);
    form.appendChild(buttons);
    
    body.appendChild(form);
    
    // Assemble the dialog
    content.appendChild(header);
    content.appendChild(body);
    dialog.appendChild(content);
    
    // Add to document
    document.body.appendChild(dialog);
    
    // Focus input
    setTimeout(() => {
      input.focus();
    }, 0);
  }

  /**
   * Delete an item
   */
  deleteItem(path) {
    // Confirm deletion
    const itemName = path.split('/').pop() || path.split('\\').pop();
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }
    
    // Delete file/folder
    window.electronAPI.deleteItem(path)
      .then(() => {
        this.refreshFileExplorer();
        this.showNotification(`Deleted: ${itemName}`, 'success');
      })
      .catch(error => {
        console.error('Failed to delete item:', error);
        this.showNotification('Failed to delete item', 'error');
      });
  }

  /**
   * Copy an item to clipboard
   */
  copyItem(path) {
    this.clipboardItem = {
      action: 'copy',
      path
    };
    this.showNotification('Item copied to clipboard', 'info');
  }

  /**
   * Cut an item to clipboard
   */
  cutItem(path) {
    this.clipboardItem = {
      action: 'cut',
      path
    };
    this.showNotification('Item cut to clipboard', 'info');
  }

  /**
   * Paste item from clipboard
   */
  pasteItem(targetPath = null) {
    if (!this.clipboardItem) {
      this.showNotification('Nothing to paste', 'error');
      return;
    }
    
    // Get default target path if needed
    if (!targetPath) {
      if (this.selectedItem && this.selectedItem.dataset.type === 'folder') {
        targetPath = this.selectedItem.dataset.path;
      } else {
        targetPath = this.rootPath;
      }
    }
    
    const sourcePath = this.clipboardItem.path;
    const action = this.clipboardItem.action;
    
    if (action === 'copy') {
      // Copy item
      window.electronAPI.copyItem(sourcePath, targetPath)
        .then(() => {
          this.refreshFileExplorer();
          this.showNotification('Item copied successfully', 'success');
        })
        .catch(error => {
          console.error('Failed to copy item:', error);
          this.showNotification('Failed to copy item', 'error');
        });
    } else if (action === 'cut') {
      // Move item
      window.electronAPI.moveItem(sourcePath, targetPath)
        .then(() => {
          this.refreshFileExplorer();
          this.showNotification('Item moved successfully', 'success');
          
          // Clear clipboard after cut
          this.clipboardItem = null;
        })
        .catch(error => {
          console.error('Failed to move item:', error);
          this.showNotification('Failed to move item', 'error');
        });
    }
  }

  /**
   * Move an item to a new location
   */
  moveItem(sourcePath, targetPath) {
    // Don't move to the same folder
    if (sourcePath === targetPath) return;
    
    // Don't move parent to child
    if (targetPath.startsWith(sourcePath + '/')) {
      this.showNotification('Cannot move a folder to its subfolder', 'error');
      return;
    }
    
    // Move item
    window.electronAPI.moveItem(sourcePath, targetPath)
      .then(() => {
        this.refreshFileExplorer();
        this.showNotification('Item moved successfully', 'success');
      })
      .catch(error => {
        console.error('Failed to move item:', error);
        this.showNotification('Failed to move item', 'error');
      });
  }

  /**
   * Collapse all folders
   */
  collapseAll() {
    this.expandedFolders.clear();
    this.refreshFileExplorer();
  }

  /**
   * Select an item
   */
  selectItem(item) {
    // Deselect previous item
    if (this.selectedItem) {
      this.selectedItem.classList.remove('selected');
    }
    
    // Select new item
    item.classList.add('selected');
    this.selectedItem = item;
  }

  /**
   * Save expanded state
   */
  saveExpandedState() {
    localStorage.setItem('expandedFolders', JSON.stringify(Array.from(this.expandedFolders)));
  }

  /**
   * Restore expanded state
   */
  restoreExpandedState() {
    try {
      const savedState = localStorage.getItem('expandedFolders');
      if (savedState) {
        this.expandedFolders = new Set(JSON.parse(savedState));
      }
    } catch (error) {
      console.error('Failed to restore expanded state:', error);
    }
  }

  /**
   * Set loading state
   */
  setLoadingState(isLoading = true) {
    this.isLoading = isLoading;
    
    if (isLoading) {
      // Show loading indicator
      this.treeView.innerHTML = '<div class="file-explorer-loading">Loading files...</div>';
    }
  }

  /**
   * Set error state
   */
  setErrorState(message) {
    this.treeView.innerHTML = `<div class="file-explorer-error">${message}</div>`;
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification if it doesn't exist
    let notification = document.querySelector('.file-explorer-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.classList.add('file-explorer-notification');
      document.body.appendChild(notification);
    }
    
    // Set message and type
    notification.textContent = message;
    notification.className = 'file-explorer-notification'; // Reset classes
    notification.classList.add(type);
    
    // Show notification
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

// Initialize file explorer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.fileExplorer = new FileExplorer();
  window.fileExplorer.init();
}); 