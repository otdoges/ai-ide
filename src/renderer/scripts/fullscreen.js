/**
 * Fullscreen Mode for Codium AI IDE
 * Implements VSCodium-like fullscreen toggle
 */
class FullscreenManager {
  constructor() {
    this.container = document.querySelector('.container');
    this.fullscreenButton = document.getElementById('fullscreen-toggle');
    this.isFullscreen = false;
  }

  /**
   * Initialize fullscreen manager
   */
  init() {
    if (!this.fullscreenButton) {
      console.error('Fullscreen button not found');
      return;
    }

    // Add event listeners
    this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
    
    // Listen for F11 key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });

    // Listen for escape key to exit fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isFullscreen) {
        this.exitFullscreen();
      }
    });

    // Listen for fullscreenchange event
    document.addEventListener('fullscreenchange', () => {
      this.updateFullscreenState();
    });
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  /**
   * Enter fullscreen mode
   */
  enterFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
  }

  /**
   * Exit fullscreen mode
   */
  exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  }

  /**
   * Update fullscreen state and UI
   */
  updateFullscreenState() {
    this.isFullscreen = !!document.fullscreenElement;
    
    // Update button icon
    if (this.fullscreenButton) {
      const icon = this.fullscreenButton.querySelector('i');
      if (icon) {
        if (this.isFullscreen) {
          icon.classList.remove('codicon-screen-full');
          icon.classList.add('codicon-screen-normal');
          this.fullscreenButton.title = 'Exit Full Screen (F11)';
        } else {
          icon.classList.remove('codicon-screen-normal');
          icon.classList.add('codicon-screen-full');
          this.fullscreenButton.title = 'Toggle Full Screen (F11)';
        }
      }
    }

    // Add/remove fullscreen class to container
    if (this.container) {
      if (this.isFullscreen) {
        this.container.classList.add('fullscreen-mode');
      } else {
        this.container.classList.remove('fullscreen-mode');
      }
    }
  }

  /**
   * Check if browser supports fullscreen
   */
  isFullscreenSupported() {
    return document.documentElement.requestFullscreen !== undefined;
  }
}

// Initialize fullscreen manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.fullscreenManager = new FullscreenManager();
  window.fullscreenManager.init();
}); 