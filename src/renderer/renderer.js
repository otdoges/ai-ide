require('dotenv').config(); // Load environment variables from .env file
const path = require('path');
const fs = require('fs');

// Renderer process
// Access APIs exposed by preload script
const electronAPI = window.electronAPI;
const settings = electronAPI ? electronAPI.getSettings() : { theme: 'dark', fontSize: 14 };

// DOM elements
const fileTreeContainer = document.getElementById('file-tree');
const editorContainer = document.getElementById('editor-container');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const statusBar = document.querySelector('.status-bar');
const activityBarIcons = document.querySelectorAll('.activity-bar-icon');

// Current file state
let currentFile = {
  path: null,
  isDirty: false
};

// Theme settings
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
};

// Initialize Monaco Editor
require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' }});

let editor;
require(['vs/editor/editor.main'], function() {
  // Define a custom theme that matches VSCodium
  monaco.editor.defineTheme('vscodium-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editorCursor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#2d2d2d',
      'editorLineNumber.foreground': '#858585',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#3a3d41'
    }
  });

  // Create editor instance
  editor = monaco.editor.create(editorContainer, {
    value: '// Welcome to VSCodium-style IDE with AI\n// Start coding or ask questions in the chat!',
    language: 'javascript',
    theme: 'vscodium-dark',
    minimap: { enabled: true },
    automaticLayout: true,
    fontSize: settings.fontSize,
    tabSize: settings.tabSize,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all',
    rulers: [80, 120],
    bracketPairColorization: { enabled: true },
    autoIndent: 'full',
    formatOnPaste: true,
    formatOnType: true
  });

  // Set up editor events
  editor.onDidChangeModelContent(() => {
    if (currentFile.path) {
      if (!currentFile.isDirty) {
        currentFile.isDirty = true;
        updateTitle();
      }
    }
  });

  // Apply theme setting
  applyTheme(settings.theme);
  
  // Set up file explorer if electron is available
  if (electronAPI) {
    setupFileExplorer();
    setupMenuListeners();
  }
});

// Set up file explorer
function setupFileExplorer() {
  // Listen for directory listing results
  electronAPI.onDirectoryList((event, { dirPath, files }) => {
    renderFileTree(dirPath, files);
  });

  // Listen for directory listing errors
  electronAPI.onDirectoryError((event, { dirPath, error }) => {
    console.error(`Error listing directory ${dirPath}:`, error);
  });
}

// Render file tree
function renderFileTree(dirPath, files) {
  fileTreeContainer.innerHTML = '';
  
  // Sort: folders first, then files
  files.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  files.forEach(file => {
    const itemEl = document.createElement('div');
    itemEl.className = 'file-item';
    
    const iconEl = document.createElement('span');
    iconEl.className = file.isDirectory ? 'codicon codicon-folder' : 'codicon codicon-file';
    
    const nameEl = document.createElement('span');
    nameEl.className = 'file-name';
    nameEl.textContent = file.name;
    
    itemEl.appendChild(iconEl);
    itemEl.appendChild(nameEl);
    fileTreeContainer.appendChild(itemEl);
    
    // Add click event
    itemEl.addEventListener('click', () => {
      if (file.isDirectory) {
        electronAPI.listDirectory(file.path);
      } else {
        openFile(file.path);
      }
    });
  });
}

// Open file
function openFile(filePath) {
  if (electronAPI) {
    electronAPI.readFile(filePath);
  }
}

// Set up file content listeners
function setupMenuListeners() {
  // Listen for file content
  electronAPI.onFileContent((event, { filePath, content }) => {
    // Set editor value
    editor.setValue(content);
    
    // Update current file
    currentFile.path = filePath;
    currentFile.isDirty = false;
    
    // Update UI
    updateTitle();
    updateLanguageFromPath(filePath);
    updateStatusBar(`File: ${electronAPI.pathBasename(filePath)}`);
  });
  
  // Listen for file errors
  electronAPI.onFileError((event, { filePath, error }) => {
    console.error(`Error reading file ${filePath}:`, error);
    updateStatusBar(`Error: ${error}`, true);
  });
  
  // Listen for saved file confirmation
  electronAPI.onFileSaved((event, { filePath, success }) => {
    if (success) {
      currentFile.isDirty = false;
      updateTitle();
      updateStatusBar(`File saved: ${electronAPI.pathBasename(filePath)}`);
    }
  });
  
  // File menu events
  electronAPI.openFile((event, filePath) => {
    openFile(filePath);
  });
  
  electronAPI.openFolder((event, folderPath) => {
    electronAPI.listDirectory(folderPath);
  });
  
  electronAPI.newFile(() => {
    // Create a new file
    editor.setValue('');
    currentFile.path = null;
    currentFile.isDirty = false;
    updateTitle();
    updateLanguageFromPath('untitled.js');
  });
  
  electronAPI.saveFile(() => {
    if (currentFile.path) {
      saveCurrentFile();
    } else {
      saveFileAs();
    }
  });
  
  electronAPI.saveFileAs(() => {
    saveFileAs();
  });
  
  // UI toggles
  electronAPI.toggleSidebar(() => {
    document.querySelector('.sidebar').classList.toggle('hidden');
  });
  
  electronAPI.toggleAIAssistant(() => {
    document.querySelector('.chat-container').classList.toggle('hidden');
  });
}

// Save current file
function saveCurrentFile() {
  if (currentFile.path && electronAPI) {
    const content = editor.getValue();
    electronAPI.writeFile(currentFile.path, content);
  }
}

// Save file as
function saveFileAs() {
  // This would typically show a save dialog, but in Electron this is handled in the main process
  // We'll rely on the menu item to trigger the dialog
}

// Update title to show current file
function updateTitle() {
  const titlePrefix = currentFile.isDirty ? '* ' : '';
  const fileName = currentFile.path ? 
    electronAPI.pathBasename(currentFile.path) : 
    'untitled';
  document.title = `${titlePrefix}${fileName} - VSCodium-style IDE with AI`;
}

// Update editor language based on file extension
function updateLanguageFromPath(filePath) {
  if (!filePath) return;
  
  const ext = filePath.split('.').pop().toLowerCase();
  let language = 'plaintext';
  
  // Map common extensions to languages
  const extensionMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rust': 'rust',
    'sh': 'shell'
  };
  
  if (extensionMap[ext]) {
    language = extensionMap[ext];
  }
  
  monaco.editor.setModelLanguage(editor.getModel(), language);
}

// Update status bar
function updateStatusBar(message, isError = false) {
  statusBar.textContent = message;
  statusBar.className = 'status-bar' + (isError ? ' error' : '');
}

// Activity bar click handlers
activityBarIcons.forEach((icon, index) => {
  icon.addEventListener('click', () => {
    // Remove active class from all icons
    activityBarIcons.forEach(i => i.classList.remove('active'));
    // Add active class to clicked icon
    icon.classList.add('active');
    
    // Handle sidebar content switching based on index
    // 0 - Explorer, 1 - Search, 2 - Source Control, 3 - Debug, 4 - AI Assistant
    switch(index) {
      case 0: // Explorer
        document.querySelector('.sidebar').classList.remove('hidden');
        break;
      case 4: // AI Assistant
        document.querySelector('.chat-container').classList.remove('hidden');
        break;
    }
  });
});

// Import our AI service
import aiService from './aiService.js';

// Initialize AI Chat functionality
async function sendMessage(message) {
  // Add user message to chat
  addMessageToChat('user', message);

  try {
    // Use our AI service
    const response = await aiService.generateCompletion(message);
    
    if (response.success) {
      addMessageToChat('ai', response.content);
    } else {
      throw new Error(response.content);
    }
  } catch (err) {
    console.error('AI Chat error:', err);
    addMessageToChat('ai', `Error: ${err.message || 'Failed to connect to AI service'}`);
  }
}

function addMessageToChat(role, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}-message`;
  
  // Handle code blocks in markdown-like format
  if (content.includes('```')) {
    const segments = content.split(/```(?:[a-z]*\n)?/);
    let isCodeBlock = false;
    
    segments.forEach(segment => {
      if (segment.trim()) {
        const element = document.createElement(isCodeBlock ? 'pre' : 'p');
        if (isCodeBlock) {
          element.className = 'code-block';
          const code = document.createElement('code');
          code.textContent = segment;
          element.appendChild(code);
        } else {
          element.textContent = segment;
        }
        messageDiv.appendChild(element);
      }
      isCodeBlock = !isCodeBlock;
    });
  } else {
    messageDiv.textContent = content;
  }
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event listeners for chat
sendButton.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (message) {
    sendMessage(message);
    chatInput.value = '';
  }
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendButton.click();
  }
});

// Initial setup for split views
Split(['.editor-container', '.chat-container'], {
  sizes: [70, 30],
  minSize: [200, 200],
  gutterSize: 8,
  cursor: 'col-resize'
}); 