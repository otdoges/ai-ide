/**
 * Terminal management for Codium AI IDE
 * Inspired by VSCodium's terminal implementation
 */
class Terminal {
  constructor() {
    this.container = null;
    this.terminalInstances = [];
    this.activeTerminal = null;
    this.isVisible = false;
    this.commandHistory = [];
    this.historyIndex = -1;
    this.terminalHeight = 200;
    this.resizeHandle = null;
    this.isDragging = false;
    this.startY = 0;
    this.startHeight = 0;
  }

  /**
   * Initialize the terminal component
   */
  init() {
    // Create terminal container if it doesn't exist
    if (!this.container) {
      this.createTerminalContainer();
    }

    // Add terminal toggle button to status bar
    this.addTerminalToggleButton();

    // Create first terminal instance
    this.createTerminalInstance();

    // Setup event listeners
    this.setupEventListeners();

    // Listen for IPC events from main process
    window.electronAPI.onTerminalOutput((event, data) => {
      if (this.activeTerminal) {
        this.activeTerminal.appendOutput(data);
      }
    });
  }

  /**
   * Create the terminal container UI
   */
  createTerminalContainer() {
    // Create terminal container
    this.container = document.createElement('div');
    this.container.classList.add('terminal-container');
    this.container.style.height = '0px';
    this.container.style.display = 'none';
    
    // Create terminal header
    const header = document.createElement('div');
    header.classList.add('terminal-header');
    
    // Create terminal tabs container
    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('terminal-tabs');
    
    // Create new terminal button
    const newTerminalBtn = document.createElement('button');
    newTerminalBtn.classList.add('terminal-new-btn');
    newTerminalBtn.innerHTML = '<i class="codicon codicon-add"></i>';
    newTerminalBtn.title = 'New Terminal';
    newTerminalBtn.addEventListener('click', () => this.createTerminalInstance());
    
    // Create terminal actions
    const actions = document.createElement('div');
    actions.classList.add('terminal-actions');
    
    // Add maximize button
    const maximizeBtn = document.createElement('button');
    maximizeBtn.innerHTML = '<i class="codicon codicon-chevron-up"></i>';
    maximizeBtn.title = 'Maximize Terminal';
    maximizeBtn.addEventListener('click', () => this.toggleMaximize());
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="codicon codicon-close"></i>';
    closeBtn.title = 'Close Terminal';
    closeBtn.addEventListener('click', () => this.toggleTerminal(false));
    
    // Append buttons to actions
    actions.appendChild(maximizeBtn);
    actions.appendChild(closeBtn);
    
    // Append to header
    header.appendChild(tabsContainer);
    header.appendChild(newTerminalBtn);
    header.appendChild(actions);
    
    // Create terminal content area
    const content = document.createElement('div');
    content.classList.add('terminal-content');
    
    // Create resize handle
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.classList.add('terminal-resize-handle');
    
    // Append all to container
    this.container.appendChild(this.resizeHandle);
    this.container.appendChild(header);
    this.container.appendChild(content);
    
    // Append to body
    document.body.appendChild(this.container);
  }

  /**
   * Add terminal toggle button to status bar
   */
  addTerminalToggleButton() {
    const statusBar = document.querySelector('.status-bar');
    if (!statusBar) return;
    
    const terminalBtn = document.createElement('div');
    terminalBtn.classList.add('status-item', 'clickable');
    terminalBtn.innerHTML = '<i class="codicon codicon-terminal"></i> Terminal';
    terminalBtn.addEventListener('click', () => this.toggleTerminal());
    
    statusBar.appendChild(terminalBtn);
  }

  /**
   * Create a new terminal instance
   */
  createTerminalInstance() {
    const terminalInstance = new TerminalInstance(this, this.terminalInstances.length + 1);
    this.terminalInstances.push(terminalInstance);
    
    // Add tab for this terminal
    const tabsContainer = this.container.querySelector('.terminal-tabs');
    const tab = document.createElement('div');
    tab.classList.add('terminal-tab');
    tab.dataset.terminalId = terminalInstance.id;
    tab.textContent = `Terminal ${terminalInstance.id}`;
    tab.addEventListener('click', () => this.activateTerminal(terminalInstance.id));
    
    // Add close button to tab
    const closeBtn = document.createElement('span');
    closeBtn.classList.add('terminal-tab-close');
    closeBtn.innerHTML = '<i class="codicon codicon-close"></i>';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTerminalInstance(terminalInstance.id);
    });
    
    tab.appendChild(closeBtn);
    tabsContainer.appendChild(tab);
    
    // Activate the new terminal
    this.activateTerminal(terminalInstance.id);
    
    return terminalInstance;
  }

  /**
   * Activate a terminal instance by ID
   */
  activateTerminal(id) {
    // Hide all terminals
    this.terminalInstances.forEach(term => {
      term.container.style.display = 'none';
      this.container.querySelector(`.terminal-tab[data-terminal-id="${term.id}"]`)?.classList.remove('active');
    });
    
    // Show the active terminal
    this.activeTerminal = this.terminalInstances.find(term => term.id === id);
    if (this.activeTerminal) {
      this.activeTerminal.container.style.display = 'block';
      this.container.querySelector(`.terminal-tab[data-terminal-id="${id}"]`)?.classList.add('active');
      this.activeTerminal.focus();
    }
  }

  /**
   * Close a terminal instance by ID
   */
  closeTerminalInstance(id) {
    const index = this.terminalInstances.findIndex(term => term.id === id);
    if (index !== -1) {
      // Remove the terminal instance
      const instance = this.terminalInstances[index];
      instance.destroy();
      this.terminalInstances.splice(index, 1);
      
      // Remove the tab
      const tab = this.container.querySelector(`.terminal-tab[data-terminal-id="${id}"]`);
      if (tab) tab.remove();
      
      // If this was the active terminal, activate another one
      if (this.activeTerminal && this.activeTerminal.id === id) {
        this.activeTerminal = null;
        if (this.terminalInstances.length > 0) {
          this.activateTerminal(this.terminalInstances[0].id);
        } else {
          // No more terminals, hide the terminal panel
          this.toggleTerminal(false);
        }
      }
    }
  }

  /**
   * Toggle terminal visibility
   */
  toggleTerminal(show = null) {
    this.isVisible = show !== null ? show : !this.isVisible;
    
    if (this.isVisible) {
      this.container.style.display = 'flex';
      setTimeout(() => {
        this.container.style.height = `${this.terminalHeight}px`;
        document.querySelector('.editor-container').style.height = `calc(100% - ${this.terminalHeight}px)`;
        
        // Activate the first terminal if none is active
        if (!this.activeTerminal && this.terminalInstances.length > 0) {
          this.activateTerminal(this.terminalInstances[0].id);
        }
        
        // Create a terminal if none exists
        if (this.terminalInstances.length === 0) {
          this.createTerminalInstance();
        }
      }, 10);
    } else {
      this.container.style.height = '0px';
      document.querySelector('.editor-container').style.height = '100%';
      setTimeout(() => {
        this.container.style.display = 'none';
      }, 300);
    }
  }

  /**
   * Toggle maximize terminal
   */
  toggleMaximize() {
    if (this.container.classList.contains('maximized')) {
      this.container.classList.remove('maximized');
      this.container.style.height = `${this.terminalHeight}px`;
      document.querySelector('.editor-container').style.height = `calc(100% - ${this.terminalHeight}px)`;
    } else {
      this.container.classList.add('maximized');
      this.container.style.height = 'calc(100% - 50px)'; // Leave space for status bar
      document.querySelector('.editor-container').style.height = '0px';
    }
  }

  /**
   * Setup event listeners for resize handle
   */
  setupEventListeners() {
    this.resizeHandle.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.startY = e.clientY;
      this.startHeight = this.terminalHeight;
      document.body.classList.add('resizing-terminal');
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const deltaY = this.startY - e.clientY;
      const newHeight = Math.min(Math.max(this.startHeight + deltaY, 100), window.innerHeight - 200);
      
      this.terminalHeight = newHeight;
      this.container.style.height = `${newHeight}px`;
      document.querySelector('.editor-container').style.height = `calc(100% - ${newHeight}px)`;
    });
    
    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.body.classList.remove('resizing-terminal');
      }
    });
    
    // Handle keyboard shortcut - Ctrl+` to toggle terminal
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === '`') {
        this.toggleTerminal();
        e.preventDefault();
      }
    });
  }
}

/**
 * Terminal instance class for individual terminals
 */
class TerminalInstance {
  constructor(manager, id) {
    this.manager = manager;
    this.id = id;
    this.container = null;
    this.outputContainer = null;
    this.inputElement = null;
    this.cwd = '/';
    this.commandHistory = [];
    this.historyIndex = -1;
    this.cursorPosition = 0;
    
    this.createTerminalInstance();
  }

  /**
   * Create the terminal instance UI
   */
  createTerminalInstance() {
    const content = this.manager.container.querySelector('.terminal-content');
    
    // Create terminal instance container
    this.container = document.createElement('div');
    this.container.classList.add('terminal-instance');
    this.container.dataset.terminalId = this.id;
    
    // Create output container
    this.outputContainer = document.createElement('div');
    this.outputContainer.classList.add('terminal-output');
    
    // Add welcome message
    const welcomeMsg = document.createElement('div');
    welcomeMsg.classList.add('terminal-line');
    welcomeMsg.textContent = `Codium AI Terminal [${new Date().toLocaleString()}]`;
    this.outputContainer.appendChild(welcomeMsg);
    
    // Create the prompt line container
    const promptContainer = document.createElement('div');
    promptContainer.classList.add('terminal-prompt-container');
    
    // Create the prompt
    const prompt = document.createElement('span');
    prompt.classList.add('terminal-prompt');
    prompt.textContent = `user@codium:${this.cwd}$ `;
    promptContainer.appendChild(prompt);
    
    // Create input element
    this.inputElement = document.createElement('input');
    this.inputElement.classList.add('terminal-input');
    this.inputElement.type = 'text';
    this.inputElement.autofocus = true;
    
    // Set up input event listeners
    this.setupInputListeners();
    
    promptContainer.appendChild(this.inputElement);
    
    // Append all to container
    this.container.appendChild(this.outputContainer);
    this.container.appendChild(promptContainer);
    
    // Append to terminal content
    content.appendChild(this.container);
  }

  /**
   * Set up input element event listeners
   */
  setupInputListeners() {
    this.inputElement.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
          this.executeCommand();
          break;
        case 'ArrowUp':
          this.navigateHistory(-1);
          e.preventDefault();
          break;
        case 'ArrowDown':
          this.navigateHistory(1);
          e.preventDefault();
          break;
        case 'Tab':
          this.handleTabCompletion();
          e.preventDefault();
          break;
      }
    });
    
    // Focus the terminal when clicked
    this.container.addEventListener('click', () => {
      this.focus();
    });
  }

  /**
   * Execute the current command
   */
  executeCommand() {
    const command = this.inputElement.value.trim();
    if (!command) {
      this.appendPromptLine('');
      return;
    }
    
    // Add to command history
    this.commandHistory.unshift(command);
    if (this.commandHistory.length > 50) {
      this.commandHistory.pop();
    }
    this.historyIndex = -1;
    
    // Add command to output
    this.appendPromptLine(command);
    
    // Handle built-in commands
    if (this.handleBuiltInCommand(command)) {
      return;
    }
    
    // Send command to main process
    window.electronAPI.runTerminalCommand(command, this.id)
      .catch(error => {
        this.appendOutput(`Error: ${error.message}`);
      });
    
    // Clear input
    this.inputElement.value = '';
  }

  /**
   * Handle built-in commands (clear, etc.)
   * @returns {boolean} True if command was handled
   */
  handleBuiltInCommand(command) {
    const cmd = command.toLowerCase();
    
    if (cmd === 'clear' || cmd === 'cls') {
      this.outputContainer.innerHTML = '';
      return true;
    }
    
    if (cmd === 'help') {
      this.appendOutput(`
Available commands:
  clear, cls     Clear the terminal
  help           Show this help message
  cd [dir]       Change directory
  ls, dir        List directory contents
  pwd            Print working directory
  
All other commands are executed in the system shell.
      `.trim());
      return true;
    }
    
    return false;
  }

  /**
   * Append output to the terminal
   */
  appendOutput(output) {
    if (!output) return;
    
    const lines = output.split('\n');
    for (const line of lines) {
      const outputLine = document.createElement('div');
      outputLine.classList.add('terminal-line');
      outputLine.textContent = line;
      this.outputContainer.appendChild(outputLine);
    }
    
    // Scroll to bottom
    this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
  }

  /**
   * Append a prompt line with the given command
   */
  appendPromptLine(command) {
    const promptLine = document.createElement('div');
    promptLine.classList.add('terminal-line', 'terminal-prompt-line');
    promptLine.textContent = `user@codium:${this.cwd}$ ${command}`;
    this.outputContainer.appendChild(promptLine);
    
    // Scroll to bottom
    this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
  }

  /**
   * Navigate command history
   */
  navigateHistory(direction) {
    if (this.commandHistory.length === 0) return;
    
    this.historyIndex += direction;
    
    if (this.historyIndex < -1) {
      this.historyIndex = -1;
    } else if (this.historyIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length - 1;
    }
    
    if (this.historyIndex === -1) {
      this.inputElement.value = '';
    } else {
      this.inputElement.value = this.commandHistory[this.historyIndex];
    }
    
    // Move cursor to end
    setTimeout(() => {
      this.inputElement.selectionStart = this.inputElement.value.length;
      this.inputElement.selectionEnd = this.inputElement.value.length;
    }, 0);
  }

  /**
   * Handle tab completion
   */
  handleTabCompletion() {
    const command = this.inputElement.value;
    
    // Request tab completion from main process
    window.electronAPI.getTabCompletion(command, this.id)
      .then(completions => {
        if (completions.length === 1) {
          // Single completion, apply it
          this.inputElement.value = completions[0];
          
          // Move cursor to end
          setTimeout(() => {
            this.inputElement.selectionStart = this.inputElement.value.length;
            this.inputElement.selectionEnd = this.inputElement.value.length;
          }, 0);
        } else if (completions.length > 1) {
          // Multiple completions, show them
          this.appendOutput(completions.join('    '));
        }
      })
      .catch(error => {
        console.error('Tab completion error:', error);
      });
  }

  /**
   * Focus this terminal instance
   */
  focus() {
    this.inputElement.focus();
  }

  /**
   * Destroy this terminal instance
   */
  destroy() {
    if (this.container) {
      this.container.remove();
    }
  }
}

// Initialize terminal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.terminalManager = new Terminal();
  window.terminalManager.init();
}); 