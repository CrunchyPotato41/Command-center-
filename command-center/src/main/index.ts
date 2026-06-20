import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import chokidar from 'chokidar'
import { TRACKER_PATH } from './config'

let mainWindow: BrowserWindow | null = null
let lastWriteTime = 0
let watcherActive = false
let watcher: chokidar.FSWatcher | null = null

// ─── IPC Handlers (registered once at module level) ──────────

ipcMain.handle('tracker:read', async () => {
  try {
    if (!fs.existsSync(TRACKER_PATH)) return null
    return fs.readFileSync(TRACKER_PATH, 'utf-8')
  } catch {
    return null
  }
})

ipcMain.handle('tracker:write', async (_event, json: string) => {
  try {
    lastWriteTime = Date.now()
    fs.writeFileSync(TRACKER_PATH, json, 'utf-8')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('tracker:path', async () => {
  return TRACKER_PATH
})

ipcMain.handle('tracker:fileInfo', async () => {
  try {
    const exists = fs.existsSync(TRACKER_PATH)
    if (!exists) return { exists: false, size: 0, lastModified: '', watcherActive }
    const stats = fs.statSync(TRACKER_PATH)
    return {
      exists: true,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      watcherActive
    }
  } catch {
    return { exists: false, size: 0, lastModified: '', watcherActive }
  }
})

ipcMain.on('window:close', (event) => {
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  if (win) win.close()
})

ipcMain.on('window:minimize', (event) => {
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  if (win) win.minimize()
})

ipcMain.on('window:maximize', (event) => {
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

// ─── File Watcher ────────────────────────────────────────────

function startWatcher(trackerPath: string, win: BrowserWindow): void {
  if (watcherActive) return

  watcher = chokidar.watch(trackerPath, {
    usePolling: false,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    },
    ignoreInitial: true
  })

  watcherActive = true

  watcher.on('change', () => {
    if (Date.now() - lastWriteTime < 1000) return

    try {
      const content = fs.readFileSync(trackerPath, 'utf-8')
      JSON.parse(content) // Validate before sending
      win.webContents.send('tracker:updated', content)
    } catch {
      // Ignore corrupt JSON (file might be mid-write)
    }
  })

  watcher.on('error', (err) => {
    console.error('[chokidar] watcher error:', err)
  })

  app.once('before-quit', () => {
    if (watcher) watcher.close()
    watcherActive = false
  })
}

// ─── Window Creation ─────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: '#0A0A10',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`RENDERER [${level}]: ${message} (${sourceId}:${line})`);
  });

  // Load the renderer
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  startWatcher(TRACKER_PATH, mainWindow)
}

// ─── App Lifecycle ───────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
