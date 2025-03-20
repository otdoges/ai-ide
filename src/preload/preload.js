// preload.js
// You can leave this file empty for now, or add preload scripts if needed. 

// Preload script for secure communication between renderer and main process
const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');
const path = require('path');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // File operations
    openFile: (callback) => ipcRenderer.on('open-file', callback),
    openFolder: (callback) => ipcRenderer.on('open-folder', callback),
    newFile: (callback) => ipcRenderer.on('new-file', callback),
    saveFile: (callback) => ipcRenderer.on('save-file', callback),
    saveFileAs: (callback) => ipcRenderer.on('save-file-as', callback),
    
    // Directory operations
    listDirectory: (dirPath) => ipcRenderer.send('list-directory', dirPath),
    onDirectoryList: (callback) => ipcRenderer.on('directory-list', callback),
    onDirectoryError: (callback) => ipcRenderer.on('directory-error', callback),
    
    // File reading/writing
    readFile: (filePath) => ipcRenderer.send('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.send('write-file', filePath, content),
    onFileContent: (callback) => ipcRenderer.on('file-content', callback),
    onFileError: (callback) => ipcRenderer.on('file-error', callback),
    onFileSaved: (callback) => ipcRenderer.on('file-saved', callback),
    
    // Path utilities
    pathBasename: (filePath) => path.basename(filePath),
    
    // UI operations
    toggleSidebar: (callback) => ipcRenderer.on('toggle-sidebar', callback),
    toggleAIAssistant: (callback) => ipcRenderer.on('toggle-ai-assistant', callback),
    
    // Settings
    getSettings: () => {
      // This could be fetched from main via IPC, but for simplicity, we'll define it here
      return {
        theme: 'dark',
        fontSize: 14,
        tabSize: 4
      };
    },
    
    // UI toggle actions
    toggleTerminal: (callback) => ipcRenderer.on('menu-toggle-terminal', callback),
    
    // Editor actions
    find: (callback) => ipcRenderer.on('menu-find', callback),
    replace: (callback) => ipcRenderer.on('menu-replace', callback),
    
    // Basic information
    getOsInfo: () => ({
      platform: os.platform(),
      arch: os.arch(),
      version: os.release(),
      homedir: os.homedir()
    }),
    
    // Path utilities
    pathJoin: (...args) => path.join(...args),
    pathDirname: (p) => path.dirname(p),
    pathExtname: (p) => path.extname(p)
  }
); 