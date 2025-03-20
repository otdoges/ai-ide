// preload.js
// You can leave this file empty for now, or add preload scripts if needed. 

// Preload script for secure communication between renderer and main process
const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');
const path = require('path');

// Expose protected methods that allow the renderer process to use IPC
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  openFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  openFolder: (callback) => ipcRenderer.on('menu-open-folder', callback),
  newFile: (callback) => ipcRenderer.on('menu-new-file', callback),
  saveFile: (callback) => ipcRenderer.on('menu-save-file', callback),
  saveFileAs: (callback) => ipcRenderer.on('menu-save-file-as', callback),
  
  // Read file content
  readFile: (filePath) => ipcRenderer.send('read-file', filePath),
  onFileContent: (callback) => ipcRenderer.on('file-content', callback),
  onFileError: (callback) => ipcRenderer.on('file-error', callback),
  
  // Save file content
  writeFile: (filePath, content) => ipcRenderer.send('save-file', { filePath, content }),
  onFileSaved: (callback) => ipcRenderer.on('file-saved', callback),
  
  // Directory listing
  listDirectory: (dirPath) => ipcRenderer.send('list-directory', dirPath),
  onDirectoryList: (callback) => ipcRenderer.on('directory-list', callback),
  onDirectoryError: (callback) => ipcRenderer.on('directory-error', callback),
  
  // UI toggle actions
  toggleSidebar: (callback) => ipcRenderer.on('menu-toggle-sidebar', callback),
  toggleTerminal: (callback) => ipcRenderer.on('menu-toggle-terminal', callback),
  toggleAIAssistant: (callback) => ipcRenderer.on('menu-toggle-ai-assistant', callback),
  
  // Editor actions
  find: (callback) => ipcRenderer.on('menu-find', callback),
  replace: (callback) => ipcRenderer.on('menu-replace', callback),
  
  // Settings management
  getSettings: () => ipcRenderer.sendSync('get-settings'),
  saveSettings: (settings) => ipcRenderer.sendSync('save-settings', settings),
  
  // Basic information
  getOsInfo: () => ({
    platform: os.platform(),
    arch: os.arch(),
    version: os.release(),
    homedir: os.homedir()
  }),
  
  // Path utilities
  pathJoin: (...args) => path.join(...args),
  pathBasename: (p) => path.basename(p),
  pathDirname: (p) => path.dirname(p),
  pathExtname: (p) => path.extname(p)
}); 