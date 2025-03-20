/**
 * Settings Manager for Codium AI IDE
 * Inspired by VSCodium's settings implementation
 */
class SettingsManager {
  constructor() {
    this.container = null;
    this.settingsContainer = null;
    this.activeSidebarItem = null;
    this.defaultSettings = {
      editor: {
        fontSize: 14,
        fontFamily: "'Menlo', 'Consolas', monospace",
        tabSize: 2,
        insertSpaces: true,
        wordWrap: "off",
        lineNumbers: "on",
        renderWhitespace: "none",
        autoSave: "off",
        autoIndent: true,
        formatOnSave: false,
        minimap: {
          enabled: true,
          side: "right",
          showSlider: "always"
        }
      },
      workbench: {
        colorTheme: "dark",
        iconTheme: "vs-seti",
        sideBarLocation: "left",
        statusBarVisible: true,
        activityBarVisible: true,
        fontSize: 13
      },
      terminal: {
        fontSize: 13,
        fontFamily: "'Menlo', 'Consolas', monospace",
        lineHeight: 1.2,
        shellPath: "",
        cursorStyle: "block",
        cursorBlinking: true,
        scrollback: 1000
      },
      files: {
        encoding: "utf8",
        autoSave: "off",
        eol: "\n",
        associations: {
          "*.js": "javascript",
          "*.jsx": "javascriptreact",
          "*.ts": "typescript",
          "*.tsx": "typescriptreact",
          "*.md": "markdown",
          "*.json": "json"
        },
        exclude: {
          "**/.git": true,
          "**/.DS_Store": true,
          "**/node_modules": true,
          "**/.vscode": true
        },
        watcherExclude: {
          "**/.git/objects/**": true,
          "**/node_modules/**": true
        }
      },
      ai: {
        provider: "openai",
        model: "gpt-4o",
        temperature: 0.7,
        maxTokens: 2000,
        autoResponse: false,
        inlineCompletions: true
      }
    };
    this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
    this.sections = [
      { id: "editor", label: "Editor" },
      { id: "workbench", label: "Workbench" },
      { id: "terminal", label: "Terminal" },
      { id: "files", label: "Files" },
      { id: "ai", label: "AI Assistant" }
    ];
  }

  /**
   * Initialize the settings manager
   */
  init() {
    // Load settings from storage
    this.loadSettings();

    // Add event listener for settings button
    const settingsButton = document.querySelector('.activity-bar-icon[title="Settings"]');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => this.toggleSettings());
    }

    // Create keyboard shortcut for settings
    document.addEventListener('keydown', (e) => {
      // Ctrl+, (comma) for settings
      if (e.ctrlKey && e.key === ',') {
        this.toggleSettings();
        e.preventDefault();
      }
    });
  }

  /**
   * Toggle settings panel visibility
   */
  toggleSettings() {
    // If settings panel exists, remove it
    if (this.settingsContainer) {
      this.settingsContainer.remove();
      this.settingsContainer = null;
      return;
    }

    // Create settings container
    this.createSettingsUI();
  }

  /**
   * Create settings UI
   */
  createSettingsUI() {
    // Create settings container
    this.settingsContainer = document.createElement('div');
    this.settingsContainer.classList.add('settings-container');

    // Create settings header
    const header = document.createElement('div');
    header.classList.add('settings-header');

    const title = document.createElement('div');
    title.classList.add('settings-title');
    title.textContent = 'Settings';

    const closeBtn = document.createElement('div');
    closeBtn.classList.add('chat-close'); // Reuse chat close styling
    closeBtn.innerHTML = '<i class="codicon codicon-close"></i>';
    closeBtn.addEventListener('click', () => this.toggleSettings());

    header.appendChild(title);
    header.appendChild(closeBtn);
    this.settingsContainer.appendChild(header);

    // Create settings body
    const body = document.createElement('div');
    body.classList.add('settings-body');

    // Create settings sidebar
    const sidebar = document.createElement('div');
    sidebar.classList.add('settings-sidebar');

    // Add sections to sidebar
    this.sections.forEach(section => {
      const sidebarItem = document.createElement('div');
      sidebarItem.classList.add('settings-sidebar-item');
      sidebarItem.textContent = section.label;
      sidebarItem.dataset.section = section.id;
      sidebarItem.addEventListener('click', () => {
        this.showSection(section.id);
        
        // Update active class
        if (this.activeSidebarItem) {
          this.activeSidebarItem.classList.remove('active');
        }
        sidebarItem.classList.add('active');
        this.activeSidebarItem = sidebarItem;
      });
      sidebar.appendChild(sidebarItem);
    });

    // Create settings content
    const content = document.createElement('div');
    content.classList.add('settings-content');
    content.id = 'settings-content';

    body.appendChild(sidebar);
    body.appendChild(content);
    this.settingsContainer.appendChild(body);

    // Add settings container to the DOM
    const editorContainer = document.getElementById('editor-container');
    editorContainer.parentNode.insertBefore(this.settingsContainer, editorContainer);
    editorContainer.style.display = 'none';

    // Show first section by default
    sidebar.querySelector('.settings-sidebar-item').click();
  }

  /**
   * Show settings section
   */
  showSection(sectionId) {
    const content = document.getElementById('settings-content');
    content.innerHTML = '';

    // Create section container
    const section = document.createElement('div');
    section.classList.add('settings-section');

    // Create section title
    const title = document.createElement('div');
    title.classList.add('settings-section-title');
    title.textContent = this.sections.find(s => s.id === sectionId).label;
    section.appendChild(title);

    // Create settings items based on section
    switch (sectionId) {
      case 'editor':
        this.createEditorSettings(section);
        break;
      case 'workbench':
        this.createWorkbenchSettings(section);
        break;
      case 'terminal':
        this.createTerminalSettings(section);
        break;
      case 'files':
        this.createFilesSettings(section);
        break;
      case 'ai':
        this.createAISettings(section);
        break;
    }

    content.appendChild(section);
  }

  /**
   * Create editor settings
   */
  createEditorSettings(container) {
    // Font Size
    this.createNumberSetting(
      container,
      'editor.fontSize',
      'Font Size',
      'Controls the font size in pixels.',
      this.settings.editor.fontSize,
      8, 30
    );

    // Font Family
    this.createTextSetting(
      container,
      'editor.fontFamily',
      'Font Family',
      'Controls the font family.',
      this.settings.editor.fontFamily
    );

    // Tab Size
    this.createNumberSetting(
      container,
      'editor.tabSize',
      'Tab Size',
      'Controls the number of spaces a tab is equal to.',
      this.settings.editor.tabSize,
      1, 8
    );

    // Insert Spaces
    this.createBooleanSetting(
      container,
      'editor.insertSpaces',
      'Insert Spaces',
      'Controls whether the editor will insert spaces for tabs.',
      this.settings.editor.insertSpaces
    );

    // Word Wrap
    this.createDropdownSetting(
      container,
      'editor.wordWrap',
      'Word Wrap',
      'Controls how lines should wrap.',
      this.settings.editor.wordWrap,
      [
        { value: 'off', label: 'Off' },
        { value: 'on', label: 'On' },
        { value: 'wordWrapColumn', label: 'Word Wrap Column' },
        { value: 'bounded', label: 'Bounded' }
      ]
    );

    // Line Numbers
    this.createDropdownSetting(
      container,
      'editor.lineNumbers',
      'Line Numbers',
      'Controls the display of line numbers.',
      this.settings.editor.lineNumbers,
      [
        { value: 'on', label: 'On' },
        { value: 'off', label: 'Off' },
        { value: 'relative', label: 'Relative' }
      ]
    );

    // Render Whitespace
    this.createDropdownSetting(
      container,
      'editor.renderWhitespace',
      'Render Whitespace',
      'Controls how whitespace is rendered.',
      this.settings.editor.renderWhitespace,
      [
        { value: 'none', label: 'None' },
        { value: 'boundary', label: 'Boundary' },
        { value: 'selection', label: 'Selection' },
        { value: 'all', label: 'All' }
      ]
    );

    // Auto Save
    this.createDropdownSetting(
      container,
      'editor.autoSave',
      'Auto Save',
      'Controls auto save of dirty editors.',
      this.settings.editor.autoSave,
      [
        { value: 'off', label: 'Off' },
        { value: 'afterDelay', label: 'After Delay' },
        { value: 'onFocusChange', label: 'On Focus Change' },
        { value: 'onWindowChange', label: 'On Window Change' }
      ]
    );

    // Format On Save
    this.createBooleanSetting(
      container,
      'editor.formatOnSave',
      'Format On Save',
      'Format a file on save.',
      this.settings.editor.formatOnSave
    );

    // Minimap Enabled
    this.createBooleanSetting(
      container,
      'editor.minimap.enabled',
      'Minimap Enabled',
      'Controls whether the minimap is shown.',
      this.settings.editor.minimap.enabled
    );
  }

  /**
   * Create workbench settings
   */
  createWorkbenchSettings(container) {
    // Color Theme
    this.createDropdownSetting(
      container,
      'workbench.colorTheme',
      'Color Theme',
      'Specifies the color theme used in the workbench.',
      this.settings.workbench.colorTheme,
      [
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
        { value: 'high-contrast', label: 'High Contrast' }
      ]
    );

    // Icon Theme
    this.createDropdownSetting(
      container,
      'workbench.iconTheme',
      'Icon Theme',
      'Specifies the icon theme used in the workbench.',
      this.settings.workbench.iconTheme,
      [
        { value: 'vs-seti', label: 'Seti' },
        { value: 'material-icon-theme', label: 'Material Icon Theme' }
      ]
    );

    // Sidebar Location
    this.createDropdownSetting(
      container,
      'workbench.sideBarLocation',
      'Side Bar Location',
      'Controls the location of the sidebar.',
      this.settings.workbench.sideBarLocation,
      [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' }
      ]
    );

    // Status Bar Visible
    this.createBooleanSetting(
      container,
      'workbench.statusBarVisible',
      'Status Bar Visible',
      'Controls the visibility of the status bar.',
      this.settings.workbench.statusBarVisible
    );

    // Activity Bar Visible
    this.createBooleanSetting(
      container,
      'workbench.activityBarVisible',
      'Activity Bar Visible',
      'Controls the visibility of the activity bar.',
      this.settings.workbench.activityBarVisible
    );

    // Font Size
    this.createNumberSetting(
      container,
      'workbench.fontSize',
      'Font Size',
      'Controls the font size in pixels of the workbench.',
      this.settings.workbench.fontSize,
      10, 20
    );
  }

  /**
   * Create terminal settings
   */
  createTerminalSettings(container) {
    // Font Size
    this.createNumberSetting(
      container,
      'terminal.fontSize',
      'Font Size',
      'Controls the font size in pixels of the terminal.',
      this.settings.terminal.fontSize,
      8, 24
    );

    // Font Family
    this.createTextSetting(
      container,
      'terminal.fontFamily',
      'Font Family',
      'Controls the font family of the terminal.',
      this.settings.terminal.fontFamily
    );

    // Line Height
    this.createNumberSetting(
      container,
      'terminal.lineHeight',
      'Line Height',
      'Controls the line height of the terminal.',
      this.settings.terminal.lineHeight,
      1.0, 2.0,
      0.1
    );

    // Shell Path
    this.createTextSetting(
      container,
      'terminal.shellPath',
      'Shell Path',
      'The path of the shell that the terminal uses (empty to use OS default).',
      this.settings.terminal.shellPath
    );

    // Cursor Style
    this.createDropdownSetting(
      container,
      'terminal.cursorStyle',
      'Cursor Style',
      'Controls the style of the terminal cursor.',
      this.settings.terminal.cursorStyle,
      [
        { value: 'block', label: 'Block' },
        { value: 'line', label: 'Line' },
        { value: 'underline', label: 'Underline' }
      ]
    );

    // Cursor Blinking
    this.createBooleanSetting(
      container,
      'terminal.cursorBlinking',
      'Cursor Blinking',
      'Controls whether the terminal cursor blinks.',
      this.settings.terminal.cursorBlinking
    );

    // Scrollback
    this.createNumberSetting(
      container,
      'terminal.scrollback',
      'Scrollback',
      'Controls the maximum number of lines the terminal keeps in its buffer.',
      this.settings.terminal.scrollback,
      100, 10000
    );
  }

  /**
   * Create files settings
   */
  createFilesSettings(container) {
    // Encoding
    this.createDropdownSetting(
      container,
      'files.encoding',
      'Encoding',
      'The default character set encoding to use when reading and writing files.',
      this.settings.files.encoding,
      [
        { value: 'utf8', label: 'UTF-8' },
        { value: 'utf16le', label: 'UTF-16 LE' },
        { value: 'utf16be', label: 'UTF-16 BE' },
        { value: 'ascii', label: 'ASCII' },
        { value: 'binary', label: 'Binary' }
      ]
    );

    // Auto Save
    this.createDropdownSetting(
      container,
      'files.autoSave',
      'Auto Save',
      'Controls auto save of dirty files.',
      this.settings.files.autoSave,
      [
        { value: 'off', label: 'Off' },
        { value: 'afterDelay', label: 'After Delay' },
        { value: 'onFocusChange', label: 'On Focus Change' },
        { value: 'onWindowChange', label: 'On Window Change' }
      ]
    );

    // EOL
    this.createDropdownSetting(
      container,
      'files.eol',
      'End of Line',
      'The default end of line character.',
      this.settings.files.eol,
      [
        { value: '\n', label: 'LF (\\n)' },
        { value: '\r\n', label: 'CRLF (\\r\\n)' }
      ]
    );

    // File associations
    this.createTextAreaSetting(
      container,
      'files.associations',
      'File Associations',
      'Configure file associations (e.g. "*.js": "javascript").',
      JSON.stringify(this.settings.files.associations, null, 2)
    );

    // Exclude files
    this.createTextAreaSetting(
      container,
      'files.exclude',
      'Files to Exclude',
      'Configure glob patterns for excluding files and folders.',
      JSON.stringify(this.settings.files.exclude, null, 2)
    );
  }

  /**
   * Create AI settings
   */
  createAISettings(container) {
    // Provider
    this.createDropdownSetting(
      container,
      'ai.provider',
      'AI Provider',
      'The AI service provider to use.',
      this.settings.ai.provider,
      [
        { value: 'openai', label: 'OpenAI' },
        { value: 'azure', label: 'Azure OpenAI' },
        { value: 'anthropic', label: 'Anthropic' }
      ]
    );

    // Model
    this.createDropdownSetting(
      container,
      'ai.model',
      'AI Model',
      'The AI model to use for code assistance.',
      this.settings.ai.model,
      [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'claude-3-opus', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' }
      ]
    );

    // Temperature
    this.createNumberSetting(
      container,
      'ai.temperature',
      'Temperature',
      'Controls randomness of AI responses (0 = deterministic, 1 = creative).',
      this.settings.ai.temperature,
      0, 1,
      0.1
    );

    // Max Tokens
    this.createNumberSetting(
      container,
      'ai.maxTokens',
      'Max Tokens',
      'Maximum number of tokens for AI responses.',
      this.settings.ai.maxTokens,
      100, 4000
    );

    // Auto Response
    this.createBooleanSetting(
      container,
      'ai.autoResponse',
      'Auto Response',
      'Automatically suggest answers as you type code.',
      this.settings.ai.autoResponse
    );

    // Inline Completions
    this.createBooleanSetting(
      container,
      'ai.inlineCompletions',
      'Inline Completions',
      'Show inline code completions from AI.',
      this.settings.ai.inlineCompletions
    );
  }

  /**
   * Create a text input setting
   */
  createTextSetting(container, key, title, description, value) {
    const item = document.createElement('div');
    item.classList.add('settings-item');

    const titleEl = document.createElement('div');
    titleEl.classList.add('settings-item-title');
    titleEl.textContent = title;
    item.appendChild(titleEl);

    const descEl = document.createElement('div');
    descEl.classList.add('settings-item-description');
    descEl.textContent = description;
    item.appendChild(descEl);

    const input = document.createElement('input');
    input.type = 'text';
    input.classList.add('settings-input');
    input.value = value;
    input.addEventListener('change', () => {
      this.updateSetting(key, input.value);
    });
    item.appendChild(input);

    container.appendChild(item);
  }

  /**
   * Create a number input setting
   */
  createNumberSetting(container, key, title, description, value, min, max, step = 1) {
    const item = document.createElement('div');
    item.classList.add('settings-item');

    const titleEl = document.createElement('div');
    titleEl.classList.add('settings-item-title');
    titleEl.textContent = title;
    item.appendChild(titleEl);

    const descEl = document.createElement('div');
    descEl.classList.add('settings-item-description');
    descEl.textContent = description;
    item.appendChild(descEl);

    const input = document.createElement('input');
    input.type = 'number';
    input.classList.add('settings-input');
    input.value = value;
    input.min = min;
    input.max = max;
    input.step = step;
    input.addEventListener('change', () => {
      this.updateSetting(key, parseFloat(input.value));
    });
    item.appendChild(input);

    container.appendChild(item);
  }

  /**
   * Create a boolean checkbox setting
   */
  createBooleanSetting(container, key, title, description, value) {
    const item = document.createElement('div');
    item.classList.add('settings-item');

    const titleEl = document.createElement('div');
    titleEl.classList.add('settings-item-title');
    titleEl.textContent = title;
    item.appendChild(titleEl);

    const descEl = document.createElement('div');
    descEl.classList.add('settings-item-description');
    descEl.textContent = description;
    item.appendChild(descEl);

    const checkboxContainer = document.createElement('div');
    checkboxContainer.classList.add('settings-checkbox');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    input.addEventListener('change', () => {
      this.updateSetting(key, input.checked);
    });
    checkboxContainer.appendChild(input);

    const label = document.createElement('label');
    label.textContent = title;
    checkboxContainer.appendChild(label);

    item.appendChild(checkboxContainer);
    container.appendChild(item);
  }

  /**
   * Create a dropdown setting
   */
  createDropdownSetting(container, key, title, description, value, options) {
    const item = document.createElement('div');
    item.classList.add('settings-item');

    const titleEl = document.createElement('div');
    titleEl.classList.add('settings-item-title');
    titleEl.textContent = title;
    item.appendChild(titleEl);

    const descEl = document.createElement('div');
    descEl.classList.add('settings-item-description');
    descEl.textContent = description;
    item.appendChild(descEl);

    const select = document.createElement('select');
    select.classList.add('settings-select');
    
    options.forEach(option => {
      const optionEl = document.createElement('option');
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      optionEl.selected = option.value === value;
      select.appendChild(optionEl);
    });

    select.addEventListener('change', () => {
      this.updateSetting(key, select.value);
    });
    item.appendChild(select);

    container.appendChild(item);
  }

  /**
   * Create a textarea setting
   */
  createTextAreaSetting(container, key, title, description, value) {
    const item = document.createElement('div');
    item.classList.add('settings-item');

    const titleEl = document.createElement('div');
    titleEl.classList.add('settings-item-title');
    titleEl.textContent = title;
    item.appendChild(titleEl);

    const descEl = document.createElement('div');
    descEl.classList.add('settings-item-description');
    descEl.textContent = description;
    item.appendChild(descEl);

    const textarea = document.createElement('textarea');
    textarea.classList.add('settings-input');
    textarea.style.height = '100px';
    textarea.value = value;
    textarea.addEventListener('change', () => {
      try {
        const parsed = JSON.parse(textarea.value);
        this.updateSetting(key, parsed);
        textarea.style.borderColor = '';
      } catch (e) {
        textarea.style.borderColor = 'var(--error-color)';
      }
    });
    item.appendChild(textarea);

    container.appendChild(item);
  }

  /**
   * Update a setting value
   */
  updateSetting(key, value) {
    // Split key by dots
    const keys = key.split('.');
    let current = this.settings;
    
    // Navigate to the correct object
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    // Update the setting
    current[keys[keys.length - 1]] = value;
    
    // Save settings
    this.saveSettings();
    
    // Apply setting immediately if possible
    this.applySettings(key, value);
  }

  /**
   * Apply settings immediately when changed
   */
  applySettings(key, value) {
    // Apply theme change
    if (key === 'workbench.colorTheme') {
      document.documentElement.setAttribute('data-theme', value);
      if (window.themeManager) {
        window.themeManager.changeTheme(value);
      }
    }
    
    // Apply editor settings if editor exists
    if (key.startsWith('editor.') && window.monacoEditor) {
      const editorOptions = {};
      
      // Map our settings to Monaco editor options
      if (key === 'editor.fontSize') {
        editorOptions.fontSize = value;
      } else if (key === 'editor.fontFamily') {
        editorOptions.fontFamily = value;
      } else if (key === 'editor.tabSize') {
        editorOptions.tabSize = value;
      } else if (key === 'editor.insertSpaces') {
        editorOptions.insertSpaces = value;
      } else if (key === 'editor.wordWrap') {
        editorOptions.wordWrap = value;
      } else if (key === 'editor.lineNumbers') {
        editorOptions.lineNumbers = value;
      } else if (key === 'editor.renderWhitespace') {
        editorOptions.renderWhitespace = value;
      } else if (key === 'editor.minimap.enabled') {
        editorOptions.minimap = { enabled: value };
      }
      
      // Update editor options
      if (Object.keys(editorOptions).length > 0) {
        window.monacoEditor.updateOptions(editorOptions);
      }
    }
    
    // Apply terminal settings
    if (key.startsWith('terminal.') && window.terminalManager) {
      window.terminalManager.updateOptions(this.settings.terminal);
    }
    
    // Apply workbench settings
    if (key === 'workbench.activityBarVisible') {
      const activityBar = document.querySelector('.activity-bar');
      if (activityBar) {
        activityBar.style.display = value ? 'flex' : 'none';
      }
    }
    
    if (key === 'workbench.statusBarVisible') {
      const statusBar = document.querySelector('.status-bar');
      if (statusBar) {
        statusBar.style.display = value ? 'flex' : 'none';
      }
    }
    
    if (key === 'workbench.sideBarLocation') {
      const container = document.querySelector('.container');
      if (container) {
        if (value === 'right') {
          container.style.gridTemplateAreas = `
            "tabs sidebar activity-bar"
            "editor sidebar activity-bar"
            "status-bar sidebar activity-bar"
          `;
        } else {
          container.style.gridTemplateAreas = `
            "activity-bar sidebar tabs"
            "activity-bar sidebar editor"
            "activity-bar sidebar status-bar"
          `;
        }
      }
    }
  }

  /**
   * Load settings from storage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('ide-settings');
      if (savedSettings) {
        this.settings = JSON.parse(savedSettings);
      }
      
      // Apply initial settings
      this.applyInitialSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  saveSettings() {
    try {
      localStorage.setItem('ide-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Apply initial settings when app loads
   */
  applyInitialSettings() {
    // Apply theme
    document.documentElement.setAttribute('data-theme', this.settings.workbench.colorTheme);
    
    // Apply sidebar location
    const container = document.querySelector('.container');
    if (container && this.settings.workbench.sideBarLocation === 'right') {
      container.style.gridTemplateAreas = `
        "tabs sidebar activity-bar"
        "editor sidebar activity-bar"
        "status-bar sidebar activity-bar"
      `;
    }
    
    // Apply visibility settings
    const activityBar = document.querySelector('.activity-bar');
    if (activityBar) {
      activityBar.style.display = this.settings.workbench.activityBarVisible ? 'flex' : 'none';
    }
    
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
      statusBar.style.display = this.settings.workbench.statusBarVisible ? 'flex' : 'none';
    }
  }

  /**
   * Reset settings to defaults
   */
  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
      this.saveSettings();
      this.applyInitialSettings();
      
      // Reload settings UI if open
      if (this.settingsContainer) {
        const activeSection = this.activeSidebarItem?.dataset.section;
        this.toggleSettings();
        this.toggleSettings();
        if (activeSection) {
          document.querySelector(`.settings-sidebar-item[data-section="${activeSection}"]`).click();
        }
      }
    }
  }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.settingsManager = new SettingsManager();
  window.settingsManager.init();
}); 