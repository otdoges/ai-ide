const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');
const Store = require('electron-store');
require('dotenv').config();

// Initialize store for settings and extensions
const store = new Store({
  name: 'settings',
  defaults: {
    windowBounds: { width: 1200, height: 800 },
    theme: 'dark',
    extensions: [],
    fontSize: 14,
    recentFiles: [],
    recentFolders: []
  }
});

// Initialize extensions store
const extensionsStore = new Store({
  name: 'extensions',
  defaults: {
    installed: []
  }
});

// Initialize themes store
const themesStore = new Store({
  name: 'themes',
  defaults: {
    installed: [
      { id: 'dark', name: 'Dark (Default)', type: 'dark' },
      { id: 'light', name: 'Light', type: 'light' },
      { id: 'high-contrast', name: 'High Contrast', type: 'high-contrast' }
    ],
    current: 'dark'
  }
});

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Get stored window dimensions
  const { width, height } = store.get('windowBounds');

  // Create the browser window
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#1E1E1E', // Default dark background
    show: false // Don't show until ready-to-show
  });

  // Save window size on resize
  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    store.set('windowBounds', { width, height });
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Show window when content is ready (smoother startup)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Add smooth fade-in animation
    mainWindow.webContents.executeJavaScript(`
      document.body.style.opacity = 0;
      document.body.style.transition = 'opacity 0.3s ease-in-out';
      setTimeout(() => { document.body.style.opacity = 1; }, 100);
    `);
  });

  // Create menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-file');
          }
        },
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
              properties: ['openFile']
            });
            if (!canceled && filePaths.length > 0) {
              const filePath = filePaths[0];
              // Add to recent files
              const recentFiles = store.get('recentFiles');
              if (!recentFiles.includes(filePath)) {
                recentFiles.unshift(filePath);
                if (recentFiles.length > 10) recentFiles.pop();
                store.set('recentFiles', recentFiles);
              }
              mainWindow.webContents.send('open-file', filePath);
            }
          }
        },
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
              properties: ['openDirectory']
            });
            if (!canceled && filePaths.length > 0) {
              const folderPath = filePaths[0];
              // Add to recent folders
              const recentFolders = store.get('recentFolders');
              if (!recentFolders.includes(folderPath)) {
                recentFolders.unshift(folderPath);
                if (recentFolders.length > 10) recentFolders.pop();
                store.set('recentFolders', recentFolders);
              }
              mainWindow.webContents.send('open-folder', folderPath);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-file');
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('save-file-as');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow.webContents.send('find');
          }
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.webContents.send('replace');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('toggle-sidebar');
          }
        },
        {
          label: 'Toggle Terminal',
          accelerator: 'CmdOrCtrl+`',
          click: () => {
            mainWindow.webContents.send('toggle-terminal');
          }
        },
        {
          label: 'Toggle AI Assistant',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            mainWindow.webContents.send('toggle-ai-assistant');
          }
        },
        { type: 'separator' },
        {
          label: 'Themes',
          submenu: [
            {
              label: 'Dark (Default)',
              type: 'radio',
              checked: themesStore.get('current') === 'dark',
              click: () => {
                themesStore.set('current', 'dark');
                mainWindow.webContents.send('change-theme', 'dark');
              }
            },
            {
              label: 'Light',
              type: 'radio',
              checked: themesStore.get('current') === 'light',
              click: () => {
                themesStore.set('current', 'light');
                mainWindow.webContents.send('change-theme', 'light');
              }
            },
            {
              label: 'High Contrast',
              type: 'radio',
              checked: themesStore.get('current') === 'high-contrast',
              click: () => {
                themesStore.set('current', 'high-contrast');
                mainWindow.webContents.send('change-theme', 'high-contrast');
              }
            },
            { type: 'separator' },
            {
              label: 'Browse Themes...',
              click: () => {
                mainWindow.webContents.send('browse-themes');
              }
            }
          ]
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Extensions',
      submenu: [
        {
          label: 'Extensions Marketplace',
          click: () => {
            mainWindow.webContents.send('open-extensions-marketplace');
          }
        },
        {
          label: 'Manage Extensions',
          click: () => {
            mainWindow.webContents.send('manage-extensions');
          }
        },
        { type: 'separator' },
        {
          label: 'Install from VSIX...',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
              properties: ['openFile'],
              filters: [{ name: 'VSIX Files', extensions: ['vsix'] }]
            });
            if (!canceled && filePaths.length > 0) {
              mainWindow.webContents.send('install-vsix', filePaths[0]);
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/VSCodium/vscodium');
          }
        },
        {
          label: 'Report Issue',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/VSCodium/vscodium/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: 'About Codium AI IDE',
              message: 'Codium AI IDE',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChromium: ${process.versions.chrome}\nNode.js: ${process.versions.node}\nV8: ${process.versions.v8}`,
              buttons: ['OK'],
              icon: path.join(__dirname, '../../assets/icon.png')
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Register IPC handlers
function registerIpcHandlers() {
  // Directory operations
  ipcMain.on('list-directory', (event, dirPath) => {
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true }).map(dirent => {
        const filePath = path.join(dirPath, dirent.name);
        return {
          name: dirent.name,
          path: filePath,
          isDirectory: dirent.isDirectory(),
          // Add additional metadata as needed
          ext: path.extname(dirent.name),
          size: dirent.isDirectory() ? null : fs.statSync(filePath).size
        };
      });
      event.reply('directory-list', { dirPath, files });
    } catch (err) {
      event.reply('directory-error', { dirPath, error: err.message });
    }
  });

  // File operations
  ipcMain.on('read-file', (event, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      event.reply('file-content', { filePath, content });
      
      // Add to recent files
      const recentFiles = store.get('recentFiles');
      if (!recentFiles.includes(filePath)) {
        recentFiles.unshift(filePath);
        if (recentFiles.length > 10) recentFiles.pop();
        store.set('recentFiles', recentFiles);
      }
    } catch (err) {
      event.reply('file-error', { filePath, error: err.message });
    }
  });

  ipcMain.on('write-file', (event, filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      event.reply('file-saved', { filePath, success: true });
    } catch (err) {
      event.reply('file-error', { filePath, error: err.message });
    }
  });

  // Settings operations
  ipcMain.handle('get-settings', async () => {
    return {
      theme: themesStore.get('current'),
      fontSize: store.get('fontSize'),
      recentFiles: store.get('recentFiles'),
      recentFolders: store.get('recentFolders')
    };
  });

  ipcMain.handle('save-settings', async (event, settings) => {
    if (settings.theme) themesStore.set('current', settings.theme);
    if (settings.fontSize) store.set('fontSize', settings.fontSize);
    return true;
  });

  // Extensions operations
  ipcMain.handle('get-extensions', async () => {
    return extensionsStore.get('installed');
  });

  ipcMain.handle('install-extension', async (event, extension) => {
    const installed = extensionsStore.get('installed');
    if (!installed.some(e => e.id === extension.id)) {
      installed.push(extension);
      extensionsStore.set('installed', installed);
      return true;
    }
    return false;
  });

  ipcMain.handle('uninstall-extension', async (event, extensionId) => {
    const installed = extensionsStore.get('installed');
    const newInstalled = installed.filter(e => e.id !== extensionId);
    extensionsStore.set('installed', newInstalled);
    return true;
  });

  // Themes operations
  ipcMain.handle('get-themes', async () => {
    return {
      installed: themesStore.get('installed'),
      current: themesStore.get('current')
    };
  });

  ipcMain.handle('install-theme', async (event, theme) => {
    const installed = themesStore.get('installed');
    if (!installed.some(t => t.id === theme.id)) {
      installed.push(theme);
      themesStore.set('installed', installed);
      return true;
    }
    return false;
  });
}

// App lifecycle events
app.whenReady().then(() => {
  createWindow();
  registerIpcHandlers();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 