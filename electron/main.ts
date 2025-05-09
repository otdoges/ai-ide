import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Fix for GTK 2/3 and GTK 4 conflict on Linux
if (process.platform === 'linux') {
  // Use GTK 3 instead of GTK 4 to avoid conflicts
  process.env.GTK_VERSION = '3'
  // Ensure we're using a single GTK version throughout the app
  delete process.env.GDK_BACKEND
  // Force hardware acceleration off on Linux to prevent some issues
  app.disableHardwareAcceleration()
}

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST || ''
  : path.join(process.env.DIST || '', '../public')

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1e1e', // Dark background color that matches the UI
    show: false, // Don't show window until it's ready
  })

  // Set native window title bar style if available on the platform
  if (process.platform === 'darwin') {
    // Use type assertion to bypass TypeScript error
    (win as any).setTitleBarStyle('hiddenInset')
  }

  // Only show window when ready to avoid white flash
  win.once('ready-to-show', () => {
    win?.show()
  })

  // Enable DevTools in development mode
  if (!app.isPackaged) {
    win.webContents.openDevTools()
  }

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST || '', 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS, re-create a window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
