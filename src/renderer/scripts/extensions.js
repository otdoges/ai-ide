/**
 * Extensions Manager for Codium AI IDE
 * Handles fetching, installing, and managing extensions
 */

class ExtensionsManager {
  constructor() {
    this.installedExtensions = [];
    this.extensionsRegistry = [];
    this.isLoading = false;
    this.searchTimeout = null;
    
    // DOM elements
    this.extensionsPanel = document.querySelector('.extensions-panel');
    this.extensionsList = document.querySelector('.extensions-list');
    this.searchInput = document.querySelector('.extensions-search-input');
    
    this.init();
  }
  
  async init() {
    // Fetch installed extensions from main process
    if (window.electronAPI) {
      this.installedExtensions = await window.electronAPI.getExtensions();
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Fetch extensions registry
    this.fetchExtensionsRegistry();
  }
  
  setupEventListeners() {
    // Listen for marketplace open event
    if (window.electronAPI) {
      window.electronAPI.openExtensionsMarketplace(() => {
        this.showExtensionsPanel();
      });
      
      window.electronAPI.manageExtensions(() => {
        this.showExtensionsPanel(true);
      });
      
      window.electronAPI.installVSIX((event, vsixPath) => {
        this.installVSIXExtension(vsixPath);
      });
    }
    
    // Search input handler
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.searchExtensions(this.searchInput.value);
        }, 300);
      });
    }
  }
  
  showExtensionsPanel(showInstalled = false) {
    // Show extensions panel
    if (this.extensionsPanel) {
      this.extensionsPanel.classList.remove('hidden');
      
      // Render extensions list
      if (showInstalled) {
        this.renderInstalledExtensions();
      } else {
        this.renderExtensionsRegistry();
      }
      
      // Focus search input
      if (this.searchInput) {
        this.searchInput.focus();
      }
    }
  }
  
  hideExtensionsPanel() {
    if (this.extensionsPanel) {
      this.extensionsPanel.classList.add('hidden');
    }
  }
  
  async fetchExtensionsRegistry() {
    try {
      this.isLoading = true;
      // Render loading state
      this.renderLoadingState();
      
      // Fetch from a mock API for now
      // In a real app, this would fetch from a real extensions API
      const response = await this.getMockExtensions();
      this.extensionsRegistry = response;
      
      // Render extensions
      this.renderExtensionsRegistry();
      
      this.isLoading = false;
    } catch (error) {
      console.error('Error fetching extensions registry:', error);
      this.isLoading = false;
      this.renderError('Failed to fetch extensions. Please try again later.');
    }
  }
  
  renderExtensionsRegistry() {
    if (!this.extensionsList) return;
    
    // Clear previous content
    this.extensionsList.innerHTML = '';
    
    if (this.extensionsRegistry.length === 0) {
      this.renderEmptyState('No extensions found');
      return;
    }
    
    // Render each extension
    this.extensionsRegistry.forEach(extension => {
      const isInstalled = this.installedExtensions.some(e => e.id === extension.id);
      const extensionElement = this.createExtensionElement(extension, isInstalled);
      this.extensionsList.appendChild(extensionElement);
    });
  }
  
  renderInstalledExtensions() {
    if (!this.extensionsList) return;
    
    // Clear previous content
    this.extensionsList.innerHTML = '';
    
    if (this.installedExtensions.length === 0) {
      this.renderEmptyState('No extensions installed');
      return;
    }
    
    // Render each installed extension
    this.installedExtensions.forEach(extension => {
      const extensionElement = this.createExtensionElement(extension, true);
      this.extensionsList.appendChild(extensionElement);
    });
  }
  
  createExtensionElement(extension, isInstalled) {
    const extensionCard = document.createElement('div');
    extensionCard.className = 'extension-card';
    extensionCard.dataset.id = extension.id;
    
    // Create header with name and publisher
    const header = document.createElement('div');
    header.className = 'extension-header';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'extension-name';
    nameElement.textContent = extension.name;
    
    const publisherElement = document.createElement('div');
    publisherElement.className = 'extension-publisher';
    publisherElement.textContent = extension.publisher;
    
    header.appendChild(nameElement);
    header.appendChild(publisherElement);
    
    // Create description
    const description = document.createElement('div');
    description.className = 'extension-description';
    description.textContent = extension.description;
    
    // Create footer with metadata and action button
    const footer = document.createElement('div');
    footer.className = 'extension-footer';
    
    const meta = document.createElement('div');
    meta.className = 'extension-meta';
    meta.innerHTML = `
      <span><i class="codicon codicon-eye"></i> ${extension.installs || 0}</span>
      <span><i class="codicon codicon-star"></i> ${extension.rating || '0.0'}</span>
    `;
    
    const button = document.createElement('button');
    button.className = 'extension-button';
    
    if (isInstalled) {
      button.textContent = 'Uninstall';
      button.classList.add('uninstall');
      button.addEventListener('click', () => this.uninstallExtension(extension.id));
    } else {
      button.textContent = 'Install';
      button.addEventListener('click', () => this.installExtension(extension));
    }
    
    footer.appendChild(meta);
    footer.appendChild(button);
    
    // Assemble the card
    extensionCard.appendChild(header);
    extensionCard.appendChild(description);
    extensionCard.appendChild(footer);
    
    return extensionCard;
  }
  
  renderLoadingState() {
    if (!this.extensionsList) return;
    
    this.extensionsList.innerHTML = `
      <div class="extensions-loading">
        <div class="spinner"></div>
        <div class="loading-text">Loading extensions...</div>
      </div>
    `;
  }
  
  renderEmptyState(message) {
    if (!this.extensionsList) return;
    
    this.extensionsList.innerHTML = `
      <div class="extensions-empty">
        <div class="empty-icon"><i class="codicon codicon-info"></i></div>
        <div class="empty-text">${message}</div>
      </div>
    `;
  }
  
  renderError(message) {
    if (!this.extensionsList) return;
    
    this.extensionsList.innerHTML = `
      <div class="extensions-error">
        <div class="error-icon"><i class="codicon codicon-error"></i></div>
        <div class="error-text">${message}</div>
        <button class="retry-button" onclick="extensionsManager.fetchExtensionsRegistry()">
          Retry
        </button>
      </div>
    `;
  }
  
  searchExtensions(query) {
    if (!query || query.trim() === '') {
      this.renderExtensionsRegistry();
      return;
    }
    
    const searchResults = this.extensionsRegistry.filter(extension => {
      const searchableText = `${extension.name} ${extension.publisher} ${extension.description}`.toLowerCase();
      return searchableText.includes(query.toLowerCase());
    });
    
    if (!this.extensionsList) return;
    
    // Clear previous content
    this.extensionsList.innerHTML = '';
    
    if (searchResults.length === 0) {
      this.renderEmptyState(`No extensions found matching "${query}"`);
      return;
    }
    
    // Render search results
    searchResults.forEach(extension => {
      const isInstalled = this.installedExtensions.some(e => e.id === extension.id);
      const extensionElement = this.createExtensionElement(extension, isInstalled);
      this.extensionsList.appendChild(extensionElement);
    });
  }
  
  async installExtension(extension) {
    try {
      if (window.electronAPI) {
        const success = await window.electronAPI.installExtension(extension);
        
        if (success) {
          this.installedExtensions.push(extension);
          
          // Show notification
          this.showNotification('success', `Extension "${extension.name}" installed successfully.`);
          
          // Refresh view
          this.renderExtensionsRegistry();
        }
      }
    } catch (error) {
      console.error('Error installing extension:', error);
      this.showNotification('error', `Failed to install "${extension.name}". ${error.message}`);
    }
  }
  
  async uninstallExtension(extensionId) {
    try {
      if (window.electronAPI) {
        const success = await window.electronAPI.uninstallExtension(extensionId);
        
        if (success) {
          // Find extension name before removing
          const extension = this.installedExtensions.find(e => e.id === extensionId);
          const name = extension ? extension.name : 'Extension';
          
          // Remove from installed extensions
          this.installedExtensions = this.installedExtensions.filter(e => e.id !== extensionId);
          
          // Show notification
          this.showNotification('success', `Extension "${name}" uninstalled successfully.`);
          
          // Refresh view
          this.renderExtensionsRegistry();
        }
      }
    } catch (error) {
      console.error('Error uninstalling extension:', error);
      this.showNotification('error', `Failed to uninstall extension. ${error.message}`);
    }
  }
  
  async installVSIXExtension(vsixPath) {
    // This would extract and install a VSIX file
    // For demonstration purposes, we'll just show a notification
    this.showNotification('info', `VSIX installation from "${vsixPath}" is not implemented yet.`);
  }
  
  showNotification(type, message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    let icon = '';
    switch (type) {
      case 'success':
        icon = 'check';
        break;
      case 'error':
        icon = 'error';
        break;
      case 'warning':
        icon = 'warning';
        break;
      default:
        icon = 'info';
    }
    
    toast.innerHTML = `
      <div class="toast-icon"><i class="codicon codicon-${icon}"></i></div>
      <div class="toast-message">${message}</div>
      <div class="toast-close"><i class="codicon codicon-close"></i></div>
    `;
    
    // Add close functionality
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    });
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  }
  
  // Mock extensions data for demonstration
  getMockExtensions() {
    return Promise.resolve([
      {
        id: 'dbaeumer.vscode-eslint',
        name: 'ESLint',
        publisher: 'Microsoft',
        description: 'Integrates ESLint JavaScript into VS Code.',
        installs: 25000000,
        rating: 4.8,
        version: '2.2.6'
      },
      {
        id: 'ms-python.python',
        name: 'Python',
        publisher: 'Microsoft',
        description: 'IntelliSense (Pylance), Linting, Debugging, code formatting, refactoring, unit tests, and more.',
        installs: 20000000,
        rating: 4.7,
        version: '2022.4.1'
      },
      {
        id: 'esbenp.prettier-vscode',
        name: 'Prettier - Code formatter',
        publisher: 'Prettier',
        description: 'Code formatter using prettier',
        installs: 18000000,
        rating: 4.9,
        version: '9.5.0'
      },
      {
        id: 'ritwickdey.liveserver',
        name: 'Live Server',
        publisher: 'Ritwick Dey',
        description: 'Launch a development local Server with live reload feature for static & dynamic pages',
        installs: 16000000,
        rating: 4.6,
        version: '5.7.9'
      },
      {
        id: 'ms-vscode.cpptools',
        name: 'C/C++',
        publisher: 'Microsoft',
        description: 'C/C++ IntelliSense, debugging, and code browsing.',
        installs: 12000000,
        rating: 4.5,
        version: '1.10.7'
      },
      {
        id: 'pkief.material-icon-theme',
        name: 'Material Icon Theme',
        publisher: 'Philipp Kief',
        description: 'Material Design Icons for Visual Studio Code',
        installs: 10000000,
        rating: 4.9,
        version: '4.20.0'
      },
      {
        id: 'formulahendry.code-runner',
        name: 'Code Runner',
        publisher: 'Jun Han',
        description: 'Run code snippet or code file for multiple languages',
        installs: 9000000,
        rating: 4.7,
        version: '0.11.6'
      },
      {
        id: 'ms-azuretools.vscode-docker',
        name: 'Docker',
        publisher: 'Microsoft',
        description: 'Makes it easy to build, manage, and deploy containerized applications.',
        installs: 8000000,
        rating: 4.6,
        version: '1.22.1'
      }
    ]);
  }
}

// Initialize extensions manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.extensionsManager = new ExtensionsManager();
}); 