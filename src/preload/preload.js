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
    pathDirname: (filePath) => path.dirname(filePath),
    pathExtname: (filePath) => path.extname(filePath),
    pathJoin: (...args) => path.join(...args),
    
    // UI operations
    toggleSidebar: (callback) => ipcRenderer.on('toggle-sidebar', callback),
    toggleTerminal: (callback) => ipcRenderer.on('toggle-terminal', callback),
    toggleAIAssistant: (callback) => ipcRenderer.on('toggle-ai-assistant', callback),
    
    // Editor actions
    find: (callback) => ipcRenderer.on('find', callback),
    replace: (callback) => ipcRenderer.on('replace', callback),

    // Theme operations
    changeTheme: (callback) => ipcRenderer.on('change-theme', callback),
    browseThemes: (callback) => ipcRenderer.on('browse-themes', callback),
    getThemes: () => ipcRenderer.invoke('get-themes'),
    installTheme: (theme) => ipcRenderer.invoke('install-theme', theme),
    
    // Extension operations
    openExtensionsMarketplace: (callback) => ipcRenderer.on('open-extensions-marketplace', callback),
    manageExtensions: (callback) => ipcRenderer.on('manage-extensions', callback),
    installVSIX: (callback) => ipcRenderer.on('install-vsix', callback),
    getExtensions: () => ipcRenderer.invoke('get-extensions'),
    installExtension: (extension) => ipcRenderer.invoke('install-extension', extension),
    uninstallExtension: (extensionId) => ipcRenderer.invoke('uninstall-extension', extensionId),
    
    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    
    // Permissions
    getFilePermissions: () => ipcRenderer.invoke('get-file-permissions'),
    allowPath: (path) => ipcRenderer.invoke('allow-path', path),
    denyPath: (path) => ipcRenderer.invoke('deny-path', path),
    showPermissionsManager: (callback) => ipcRenderer.on('show-permissions-manager', callback),
    
    // Basic information
    getOsInfo: () => ({
      platform: os.platform(),
      arch: os.arch(),
      version: os.release(),
      homedir: os.homedir()
    })
  }
); 