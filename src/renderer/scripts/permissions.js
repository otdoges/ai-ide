/**
 * Permissions Manager for Codium AI IDE
 * Handles file and folder permissions
 */

class PermissionsManager {
  constructor() {
    this.allowedPaths = [];
    this.deniedPaths = [];
    this.isOpen = false;
    
    this.init();
  }
  
  async init() {
    // Load saved permissions
    if (window.electronAPI) {
      try {
        const permissions = await window.electronAPI.getFilePermissions();
        this.allowedPaths = permissions.allowedPaths || [];
        this.deniedPaths = permissions.deniedPaths || [];
      } catch (error) {
        console.error('Failed to load permissions:', error);
      }
      
      // Set up event listeners
      window.electronAPI.showPermissionsManager(() => {
        this.showPermissionsManager();
      });
    }
  }
  
  showPermissionsManager() {
    // Don't open multiple instances
    if (this.isOpen) return;
    this.isOpen = true;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'permissions-modal';
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">File Access Permissions</span>
          <span class="modal-close"><i class="codicon codicon-close"></i></span>
        </div>
        <div class="modal-body">
          <div class="permissions-tabs">
            <div class="permissions-tab active" data-tab="allowed">Allowed Paths</div>
            <div class="permissions-tab" data-tab="denied">Denied Paths</div>
          </div>
          <div class="permissions-content">
            <div class="permissions-tab-content active" id="allowed-paths">
              <div class="permissions-list">
                ${this.renderPathsList(this.allowedPaths, 'allowed')}
              </div>
              <div class="permissions-actions">
                <button class="add-path-btn" data-type="allowed">
                  <i class="codicon codicon-add"></i> Add Allowed Path
                </button>
              </div>
            </div>
            <div class="permissions-tab-content" id="denied-paths">
              <div class="permissions-list">
                ${this.renderPathsList(this.deniedPaths, 'denied')}
              </div>
              <div class="permissions-actions">
                <button class="add-path-btn" data-type="denied">
                  <i class="codicon codicon-add"></i> Add Denied Path
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-secondary" id="reset-permissions">
            Reset All Permissions
          </button>
          <button class="modal-btn modal-btn-primary" id="close-permissions">
            Close
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    this.addModalEventListeners(modal);
    
    // Fade in animation
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 0);
  }
  
  renderPathsList(paths, type) {
    if (!paths || paths.length === 0) {
      return `<div class="empty-paths">No ${type} paths configured</div>`;
    }
    
    return paths.map(path => `
      <div class="path-item">
        <div class="path-text">${path}</div>
        <div class="path-actions">
          <button class="path-remove" data-path="${path}" data-type="${type}">
            <i class="codicon codicon-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  addModalEventListeners(modal) {
    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      this.closeModal(modal);
    });
    
    // Close button in footer
    const closeFooterBtn = modal.querySelector('#close-permissions');
    closeFooterBtn.addEventListener('click', () => {
      this.closeModal(modal);
    });
    
    // Tab switching
    const tabs = modal.querySelectorAll('.permissions-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and content
        modal.querySelectorAll('.permissions-tab').forEach(t => t.classList.remove('active'));
        modal.querySelectorAll('.permissions-tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding content
        const tabName = tab.dataset.tab;
        const content = modal.querySelector(`#${tabName}-paths`);
        if (content) {
          content.classList.add('active');
        }
      });
    });
    
    // Add path buttons
    const addPathBtns = modal.querySelectorAll('.add-path-btn');
    addPathBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.promptAddPath(type);
      });
    });
    
    // Remove path buttons
    const removePathBtns = modal.querySelectorAll('.path-remove');
    removePathBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const path = btn.dataset.path;
        const type = btn.dataset.type;
        this.removePath(path, type);
        
        // Remove from UI
        const pathItem = btn.closest('.path-item');
        if (pathItem) {
          pathItem.remove();
        }
        
        // If list is empty, show empty message
        const list = modal.querySelector(`#${type}-paths .permissions-list`);
        if (list && list.children.length === 0) {
          list.innerHTML = `<div class="empty-paths">No ${type} paths configured</div>`;
        }
      });
    });
    
    // Reset all permissions
    const resetBtn = modal.querySelector('#reset-permissions');
    resetBtn.addEventListener('click', async () => {
      const confirmed = await this.showConfirmDialog(
        'Reset Permissions',
        'Are you sure you want to reset all file permissions? This will remove all allowed and denied paths.'
      );
      
      if (confirmed) {
        this.resetPermissions();
        
        // Update UI
        const allowedList = modal.querySelector('#allowed-paths .permissions-list');
        const deniedList = modal.querySelector('#denied-paths .permissions-list');
        
        if (allowedList) {
          allowedList.innerHTML = '<div class="empty-paths">No allowed paths configured</div>';
        }
        
        if (deniedList) {
          deniedList.innerHTML = '<div class="empty-paths">No denied paths configured</div>';
        }
      }
    });
  }
  
  closeModal(modal) {
    modal.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(modal);
      this.isOpen = false;
    }, 300);
  }
  
  async promptAddPath(type) {
    // In a real app, this would open a folder picker dialog
    // For now, let's use a simple prompt
    const path = prompt(`Enter a ${type === 'allowed' ? 'trusted' : 'restricted'} path:`);
    
    if (path && path.trim() !== '') {
      if (type === 'allowed') {
        await this.addAllowedPath(path);
      } else {
        await this.addDeniedPath(path);
      }
      
      // Refresh the UI
      this.showPermissionsManager();
      this.closeModal(document.querySelector('.permissions-modal'));
    }
  }
  
  async addAllowedPath(path) {
    if (window.electronAPI) {
      try {
        await window.electronAPI.allowPath(path);
        this.allowedPaths.push(path);
        
        // Remove from denied if present
        const deniedIndex = this.deniedPaths.indexOf(path);
        if (deniedIndex !== -1) {
          this.deniedPaths.splice(deniedIndex, 1);
        }
        
        this.showNotification('success', `Added "${path}" to trusted locations`);
        return true;
      } catch (error) {
        console.error('Failed to add allowed path:', error);
        this.showNotification('error', `Failed to add "${path}" to trusted locations`);
        return false;
      }
    }
    return false;
  }
  
  async addDeniedPath(path) {
    if (window.electronAPI) {
      try {
        await window.electronAPI.denyPath(path);
        this.deniedPaths.push(path);
        
        // Remove from allowed if present
        const allowedIndex = this.allowedPaths.indexOf(path);
        if (allowedIndex !== -1) {
          this.allowedPaths.splice(allowedIndex, 1);
        }
        
        this.showNotification('success', `Added "${path}" to restricted locations`);
        return true;
      } catch (error) {
        console.error('Failed to add denied path:', error);
        this.showNotification('error', `Failed to add "${path}" to restricted locations`);
        return false;
      }
    }
    return false;
  }
  
  async removePath(path, type) {
    if (window.electronAPI) {
      try {
        if (type === 'allowed') {
          const index = this.allowedPaths.indexOf(path);
          if (index !== -1) {
            this.allowedPaths.splice(index, 1);
            await window.electronAPI.allowPath(''); // Dummy call to trigger save
            this.showNotification('success', `Removed "${path}" from trusted locations`);
          }
        } else {
          const index = this.deniedPaths.indexOf(path);
          if (index !== -1) {
            this.deniedPaths.splice(index, 1);
            await window.electronAPI.denyPath(''); // Dummy call to trigger save
            this.showNotification('success', `Removed "${path}" from restricted locations`);
          }
        }
        return true;
      } catch (error) {
        console.error(`Failed to remove ${type} path:`, error);
        this.showNotification('error', `Failed to remove "${path}"`);
        return false;
      }
    }
    return false;
  }
  
  async resetPermissions() {
    if (window.electronAPI) {
      try {
        // Clear arrays
        this.allowedPaths = [];
        this.deniedPaths = [];
        
        // Update store (dummy calls to trigger save)
        await window.electronAPI.allowPath('');
        await window.electronAPI.denyPath('');
        
        this.showNotification('success', 'All permissions have been reset');
        return true;
      } catch (error) {
        console.error('Failed to reset permissions:', error);
        this.showNotification('error', 'Failed to reset permissions');
        return false;
      }
    }
    return false;
  }
  
  showConfirmDialog(title, message) {
    return new Promise(resolve => {
      const dialog = document.createElement('div');
      dialog.className = 'confirm-dialog';
      
      dialog.innerHTML = `
        <div class="dialog-content">
          <div class="dialog-header">
            <span class="dialog-title">${title}</span>
          </div>
          <div class="dialog-body">
            <p>${message}</p>
          </div>
          <div class="dialog-footer">
            <button class="dialog-btn dialog-btn-secondary" id="dialog-cancel">Cancel</button>
            <button class="dialog-btn dialog-btn-primary" id="dialog-confirm">Confirm</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      // Fade in animation
      setTimeout(() => {
        dialog.style.opacity = '1';
      }, 0);
      
      // Add event listeners
      const cancelBtn = dialog.querySelector('#dialog-cancel');
      const confirmBtn = dialog.querySelector('#dialog-confirm');
      
      cancelBtn.addEventListener('click', () => {
        closeDialog(false);
      });
      
      confirmBtn.addEventListener('click', () => {
        closeDialog(true);
      });
      
      function closeDialog(result) {
        dialog.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(dialog);
          resolve(result);
        }, 300);
      }
    });
  }
  
  showNotification(type, message) {
    // Use extension manager's notification system if it exists
    if (window.extensionsManager && typeof window.extensionsManager.showNotification === 'function') {
      window.extensionsManager.showNotification(type, message);
      return;
    }
    
    // Otherwise, create our own notification
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
    let icon = 'info';
    switch (type) {
      case 'success': icon = 'check'; break;
      case 'error': icon = 'error'; break;
      case 'warning': icon = 'warning'; break;
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

// Initialize permissions manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.permissionsManager = new PermissionsManager();
}); 