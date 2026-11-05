import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let pythonProcess: ChildProcess | null = null

/**
 * Resuelve la ruta al ejecutable de Python dinámicamente según el entorno (Dev o Prod).
 */
function getPythonBinaryPath(): string {
  const devPath = join(app.getAppPath(), 'optiflow-engine', 'dist', 'server.exe')
  const prodResourcePath = join(process.resourcesPath, 'optiflow-engine', 'dist', 'server.exe')
  const altProdPath = join(process.resourcesPath, 'server.exe')

  if (!app.isPackaged && existsSync(devPath)) {
    return devPath
  }
  if (existsSync(prodResourcePath)) {
    return prodResourcePath
  }
  if (existsSync(altProdPath)) {
    return altProdPath
  }
  return devPath
}

/**
 * Inicia el binario de Python silenciosamente en segundo plano.
 */
function startPythonBackend(): void {
  const binaryPath = getPythonBinaryPath()
  console.log(`[Main Process] Iniciando motor Python desde: ${binaryPath}`)

  if (!existsSync(binaryPath)) {
    console.error(`[Main Process] No se encontró el binario del motor de Python en: ${binaryPath}`)
    return
  }

  try {
    pythonProcess = spawn(binaryPath, [], {
      detached: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    pythonProcess.stdout?.on('data', (data) => {
      console.log(`[Python Engine]: ${data.toString().trim()}`)
    })

    pythonProcess.stderr?.on('data', (data) => {
      console.error(`[Python Engine Error]: ${data.toString().trim()}`)
    })

    pythonProcess.on('error', (err) => {
      console.error('[Main Process] Error al instanciar el motor de Python:', err)
    })

    pythonProcess.on('exit', (code, signal) => {
      console.log(`[Main Process] Motor de Python finalizado (código: ${code}, señal: ${signal})`)
      pythonProcess = null
    })
  } catch (err) {
    console.error('[Main Process] Excepción al lanzar el proceso de Python:', err)
  }
}

/**
 * Termina el proceso hijo de Python limpiamente para evitar procesos huérfanos en el SO.
 */
function stopPythonBackend(): void {
  if (pythonProcess && pythonProcess.pid) {
    console.log(`[Main Process] Finalizando proceso del motor de Python (PID: ${pythonProcess.pid})...`)
    try {
      if (process.platform === 'win32') {
        // En Windows, taskkill /pid /T /F asegura terminar el proceso y todos sus subprocesos
        spawn('taskkill', ['/pid', pythonProcess.pid.toString(), '/T', '/F'])
      } else {
        pythonProcess.kill('SIGTERM')
      }
    } catch (e) {
      console.error('[Main Process] Error cerrando el proceso de Python:', e)
    }
    pythonProcess = null
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Inicialización de Electron
app.whenReady().then(() => {
  // Iniciar silenciosamente el backend de Python
  startPythonBackend()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Limpieza garantizada del proceso hijo en todos los eventos de cierre
app.on('window-all-closed', () => {
  stopPythonBackend()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  stopPythonBackend()
})

app.on('before-quit', () => {
  stopPythonBackend()
})
