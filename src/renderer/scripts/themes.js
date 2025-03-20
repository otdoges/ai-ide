/**
 * Theme Manager for Codium AI IDE
 * Handles theme switching, customization, and storage
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.themes = [
      { id: 'dark', name: 'Dark (Default)', type: 'dark' },
      { id: 'light', name: 'Light', type: 'light' },
      { id: 'high-contrast', name: 'High Contrast', type: 'high-contrast' }
    ];
    
    this.init();
  }
  
  async init() {
    // Get stored theme from electron API
    if (window.electronAPI) {
      const settings = await window.electronAPI.getSettings();
      if (settings && settings.theme) {
        this.currentTheme = settings.theme;
      }
      
      // Get available themes
      const themesData = await window.electronAPI.getThemes();
      if (themesData && themesData.installed) {
        this.themes = themesData.installed;
        this.currentTheme = themesData.current || 'dark';
      }
      
      // Setup event listeners
      this.setupEventListeners();
    }
    
    // Apply the stored theme
    this.applyTheme(this.currentTheme);
  }
  
  setupEventListeners() {
    // Listen for theme change events from main process
    if (window.electronAPI) {
      window.electronAPI.changeTheme((event, themeId) => {
        this.applyTheme(themeId);
      });
      
      window.electronAPI.browseThemes(() => {
        this.showThemeBrowser();
      });
    }
    
    // Add theme switcher to status bar if exists
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
      const themeIndicator = document.createElement('div');
      themeIndicator.className = 'status-item theme-indicator';
      themeIndicator.innerHTML = `
        <i class="codicon codicon-color-mode status-icon"></i>
        <span class="theme-name">${this.getThemeName(this.currentTheme)}</span>
      `;
      
      themeIndicator.addEventListener('click', () => {
        this.showThemeQuickPick();
      });
      
      const statusRight = statusBar.querySelector('.status-right') || statusBar;
      statusRight.appendChild(themeIndicator);
    }
  }
  
  applyTheme(themeId) {
    // Find the theme
    const theme = this.themes.find(t => t.id === themeId) || this.themes[0];
    
    // Update current theme
    this.currentTheme = theme.id;
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme.id);
    
    // Update monaco editor theme if it exists
    this.updateMonacoTheme(theme.id);
    
    // Update theme name in status bar
    const themeNameElement = document.querySelector('.theme-name');
    if (themeNameElement) {
      themeNameElement.textContent = theme.name;
    }
    
    // Save theme setting
    if (window.electronAPI) {
      window.electronAPI.saveSettings({ theme: theme.id });
    }
    
    // Add animation to show theme transition
    this.addThemeTransitionAnimation();
  }
  
  updateMonacoTheme(themeId) {
    // If Monaco is loaded, update its theme
    if (window.monaco) {
      let monacoTheme = 'vs-dark';
      
      switch(themeId) {
        case 'light':
          monacoTheme = 'vs';
          break;
        case 'high-contrast':
          monacoTheme = 'hc-black';
          break;
        default:
          monacoTheme = 'vs-dark';
      }
      
      // Apply theme to all editors
      const models = window.monaco.editor.getModels();
      models.forEach(model => {
        const editors = window.monaco.editor.getEditors();
        editors.forEach(editor => {
          editor.updateOptions({ theme: monacoTheme });
        });
      });
    }
  }
  
  addThemeTransitionAnimation() {
    // Add a subtle animation to show theme change
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';
    
    document.body.appendChild(overlay);
    
    // Fade in and out
    setTimeout(() => {
      overlay.style.opacity = '0.2';
      
      setTimeout(() => {
        overlay.style.opacity = '0';
        
        setTimeout(() => {
          document.body.removeChild(overlay);
        }, 200);
      }, 100);
    }, 0);
  }
  
  getThemeName(themeId) {
    const theme = this.themes.find(t => t.id === themeId);
    return theme ? theme.name : 'Theme';
  }
  
  showThemeQuickPick() {
    // Create and show a dropdown for quick theme selection
    const quickPick = document.createElement('div');
    quickPick.className = 'theme-quick-pick';
    
    // Add a header
    const header = document.createElement('div');
    header.className = 'quick-pick-header';
    header.textContent = 'Select Theme';
    quickPick.appendChild(header);
    
    // Add theme options
    const optionsList = document.createElement('div');
    optionsList.className = 'quick-pick-options';
    
    this.themes.forEach(theme => {
      const option = document.createElement('div');
      option.className = 'quick-pick-option';
      if (theme.id === this.currentTheme) {
        option.classList.add('selected');
      }
      
      option.innerHTML = `
        <i class="codicon ${theme.id === this.currentTheme ? 'codicon-check' : ''}"></i>
        <span>${theme.name}</span>
      `;
      
      option.addEventListener('click', () => {
        this.applyTheme(theme.id);
        document.body.removeChild(quickPick);
      });
      
      optionsList.appendChild(option);
    });
    
    quickPick.appendChild(optionsList);
    
    // Add a browse more option
    const browseOption = document.createElement('div');
    browseOption.className = 'quick-pick-browse';
    browseOption.innerHTML = `
      <i class="codicon codicon-extensions"></i>
      <span>Browse themes...</span>
    `;
    
    browseOption.addEventListener('click', () => {
      this.showThemeBrowser();
      document.body.removeChild(quickPick);
    });
    
    quickPick.appendChild(browseOption);
    
    // Add to body
    document.body.appendChild(quickPick);
    
    // Position near the theme indicator
    const themeIndicator = document.querySelector('.theme-indicator');
    if (themeIndicator) {
      const rect = themeIndicator.getBoundingClientRect();
      quickPick.style.bottom = `${window.innerHeight - rect.top + 10}px`;
      quickPick.style.right = `${window.innerWidth - rect.right + 10}px`;
    } else {
      quickPick.style.bottom = '40px';
      quickPick.style.right = '20px';
    }
    
    // Close when clicking outside
    const closeHandler = (event) => {
      if (!quickPick.contains(event.target) && !document.querySelector('.theme-indicator').contains(event.target)) {
        document.body.removeChild(quickPick);
        document.removeEventListener('click', closeHandler);
      }
    };
    
    // Delay adding the click handler to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('click', closeHandler);
    }, 0);
  }
  
  showThemeBrowser() {
    // This would show a more detailed theme browser
    // For now, let's create a simple modal
    
    const modal = document.createElement('div');
    modal.className = 'theme-browser-modal';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">Theme Browser</span>
          <span class="modal-close"><i class="codicon codicon-close"></i></span>
        </div>
        <div class="modal-body">
          <div class="theme-search">
            <input type="text" placeholder="Search themes..." class="theme-search-input">
          </div>
          <div class="theme-list">
            ${this.themes.map(theme => `
              <div class="theme-item ${theme.id === this.currentTheme ? 'active' : ''}">
                <div class="theme-preview ${theme.id}"></div>
                <div class="theme-details">
                  <div class="theme-name">${theme.name}</div>
                  <div class="theme-description">A ${theme.type} theme for coding</div>
                </div>
                <button class="theme-apply-btn">
                  ${theme.id === this.currentTheme ? 'Applied' : 'Apply'}
                </button>
              </div>
            `).join('')}
            
            <div class="theme-item premium">
              <div class="theme-preview github-dark"></div>
              <div class="theme-details">
                <div class="theme-name">GitHub Dark</div>
                <div class="theme-description">GitHub's dark theme</div>
              </div>
              <button class="theme-install-btn">Install</button>
            </div>
            
            <div class="theme-item premium">
              <div class="theme-preview monokai"></div>
              <div class="theme-details">
                <div class="theme-name">Monokai</div>
                <div class="theme-description">Classic Monokai theme</div>
              </div>
              <button class="theme-install-btn">Install</button>
            </div>
            
            <div class="theme-item premium">
              <div class="theme-preview solarized"></div>
              <div class="theme-details">
                <div class="theme-name">Solarized Dark</div>
                <div class="theme-description">Ethan Schoonover's Solarized dark theme</div>
              </div>
              <button class="theme-install-btn">Install</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Apply buttons
    const applyBtns = modal.querySelectorAll('.theme-apply-btn');
    applyBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        this.applyTheme(this.themes[index].id);
        document.body.removeChild(modal);
      });
    });
    
    // Install buttons demonstration
    const installBtns = modal.querySelectorAll('.theme-install-btn');
    installBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const themeItem = btn.closest('.theme-item');
        const themeName = themeItem.querySelector('.theme-name').textContent;
        
        // Show notification that this is just a demo
        this.showNotification('info', `Installing "${themeName}" theme is not implemented in this demo.`);
        
        // Change button text
        btn.textContent = 'Installing...';
        btn.disabled = true;
      });
    });
    
    // Fade in animation
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 0);
  }
  
  showNotification(type, message) {
    // Use the same notification system from extensions manager if it exists
    if (window.extensionsManager && typeof window.extensionsManager.showNotification === 'function') {
      window.extensionsManager.showNotification(type, message);
      return;
    }
    
    // Otherwise create our own notification
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
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
}); 