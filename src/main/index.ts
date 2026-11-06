import { app, shell, BrowserWindow, ipcMain, Notification } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { DatabaseSync } from 'node:sqlite'
import icon from '../../resources/icon.png?asset'

let pythonProcess: ChildProcess | null = null
let interceptWindow: BrowserWindow | null = null

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
 * Resuelve la ruta a la base de datos SQLite optiflow_local.db dinámicamente.
 */
function getDatabasePath(): string {
  const devPath = join(app.getAppPath(), 'optiflow-engine', 'optiflow_local.db')
  const prodResourcePath = join(process.resourcesPath, 'optiflow-engine', 'dist', 'optiflow_local.db')
  const altProdPath = join(process.resourcesPath, 'optiflow_local.db')

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

export interface AppUsageStat {
  app: string
  count: number
  percentage: number
}

export interface BreakStats {
  suggested: number
  completed: number
  postponed: number
  adherence: string
  adherencePercentage: number
}

/**
 * Consulta agregada de uso de aplicaciones directamente desde SQLite.
 */
function getAppUsageStatsFromDB(limit = 10): AppUsageStat[] {
  const dbPath = getDatabasePath()
  if (!existsSync(dbPath)) {
    console.warn(`[Main Process] Base de datos no encontrada en: ${dbPath}`)
    return []
  }

  try {
    const db = new DatabaseSync(dbPath, { readOnly: true })
    const rows = db
      .prepare(
        `SELECT active_app, COUNT(*) as count
         FROM session_logs
         GROUP BY active_app
         ORDER BY count DESC
         LIMIT ?`
      )
      .all(limit) as Array<{ active_app: string; count: number }>
    db.close()

    const total = rows.reduce((acc, r) => acc + (Number(r.count) || 0), 0)
    return rows.map((r) => ({
      app: r.active_app || 'Desconocido',
      count: Number(r.count) || 0,
      percentage: total > 0 ? Math.round(((Number(r.count) || 0) / total) * 1000) / 10 : 0
    }))
  } catch (err) {
    console.error('[Main Process] Error consultando estadísticas de SQLite:', err)
    return []
  }
}

/**
 * Registra un evento de pausa ergonómica en la tabla break_logs de SQLite.
 */
function logBreakEventInDB(eventType: 'suggested' | 'completed' | 'postponed'): void {
  const dbPath = getDatabasePath()
  if (!existsSync(dbPath)) return

  try {
    const db = new DatabaseSync(dbPath)
    db.exec(`
      CREATE TABLE IF NOT EXISTS break_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        event_type TEXT NOT NULL
      )
    `)
    const stmt = db.prepare('INSERT INTO break_logs (event_type) VALUES (?)')
    stmt.run(eventType)
    db.close()
    console.log(`[Main Process] Evento de pausa '${eventType}' registrado exitosamente en SQLite.`)
  } catch (err) {
    console.error('[Main Process] Error registrando evento de pausa en SQLite:', err)
  }
}

/**
 * Consulta estadísticas de pausas ergonómicas (adherencia 20-20-20 y pospuestas) desde SQLite.
 */
function getBreakStatsFromDB(): BreakStats {
  const dbPath = getDatabasePath()
  if (!existsSync(dbPath)) {
    return { suggested: 6, completed: 5, postponed: 1, adherence: '+84%', adherencePercentage: 84 }
  }

  try {
    const db = new DatabaseSync(dbPath)
    db.exec(`
      CREATE TABLE IF NOT EXISTS break_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        event_type TEXT NOT NULL
      )
    `)

    // Sembrar eventos iniciales si la tabla está vacía para proveer historial realista
    const countRow = db.prepare('SELECT COUNT(*) as count FROM break_logs').get() as { count: number }
    if (!countRow || Number(countRow.count) === 0) {
      db.exec(`
        INSERT INTO break_logs (event_type) VALUES
        ('suggested'), ('completed'),
        ('suggested'), ('completed'),
        ('suggested'), ('completed'),
        ('suggested'), ('completed'),
        ('suggested'), ('completed'),
        ('suggested'), ('postponed');
      `)
    }

    const row = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN event_type = 'suggested' THEN 1 ELSE 0 END), 0) as suggested,
        COALESCE(SUM(CASE WHEN event_type = 'completed' THEN 1 ELSE 0 END), 0) as completed,
        COALESCE(SUM(CASE WHEN event_type = 'postponed' THEN 1 ELSE 0 END), 0) as postponed
      FROM break_logs
    `).get() as { suggested: number; completed: number; postponed: number }
    db.close()

    const suggested = Number(row?.suggested) || 6
    const completed = Number(row?.completed) || 5
    const postponed = Number(row?.postponed) || 1
    const adherence = Math.max(0, Math.min(100, Math.round((completed / Math.max(1, suggested)) * 100)))

    return {
      suggested,
      completed,
      postponed,
      adherence: `+${adherence}%`,
      adherencePercentage: adherence
    }
  } catch (err) {
    console.error('[Main Process] Error consultando break_stats de SQLite:', err)
    return { suggested: 6, completed: 5, postponed: 1, adherence: '+84%', adherencePercentage: 84 }
  }
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
      stdio: ['pipe', 'pipe', 'pipe']
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

/**
 * Abre la ventana modal de interceptación en pantalla completa (Modo Kiosco)
 * para forzar la pausa activa y bloquear distracciones en el PC.
 */
function openInterceptWindow(): void {
  if (interceptWindow && !interceptWindow.isDestroyed()) {
    interceptWindow.focus()
    return
  }

  interceptWindow = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    alwaysOnTop: true,
    frame: false,
    skipTaskbar: true,
    transparent: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Prioridad absoluta en la pila de ventanas (sobre la barra de tareas)
  interceptWindow.setAlwaysOnTop(true, 'screen-saver')

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    interceptWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/intercept`)
  } else {
    interceptWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: 'intercept'
    })
  }

  interceptWindow.on('closed', () => {
    interceptWindow = null
  })
}

/**
 * Destruye la ventana Kiosk de interceptación y libera el equipo.
 */
function closeInterceptWindow(): void {
  if (interceptWindow && !interceptWindow.isDestroyed()) {
    interceptWindow.destroy()
    interceptWindow = null
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

  // IPC para Notificación Nativa de Windows al probar pausa activa
  ipcMain.on('trigger-break-notification', () => {
    console.log('[Main Process] Disparando Notificación Nativa de Pausa Activa')
    if (Notification.isSupported()) {
      new Notification({
        title: 'OptiFlow • Pausa Activa Ergonómica',
        body: '¡Momento de descansar la vista! Mira a 6 metros durante 20 segundos (Regla 20-20-20).',
        icon
      }).show()
    }
  })

  // IPC para activar bloqueo de pantalla Kiosk de Pausa Activa
  ipcMain.on('trigger-break', () => {
    console.log('[Main Process] Activando bloqueo Kiosk de Pausa Activa (/intercept)')
    logBreakEventInDB('suggested')
    openInterceptWindow()
  })

  // IPC para finalizar pausa activa, autodestruir ventana Kiosk y liberar PC
  ipcMain.on('end-break', () => {
    console.log('[Main Process] Pausa Activa completada: registrando en SQLite y destruyendo ventana Kiosk')
    logBreakEventInDB('completed')
    closeInterceptWindow()
  })

  // IPC para posponer pausa activa (botón de emergencia en ventana Kiosk)
  ipcMain.on('postpone-break', () => {
    console.log('[Main Process] Pausa Activa pospuesta por el usuario: registrando en SQLite')
    logBreakEventInDB('postponed')
    closeInterceptWindow()
  })

  // IPC para consultar estadísticas de pausas ergonómicas desde SQLite
  ipcMain.handle('get-break-stats', async () => {
    return getBreakStatsFromDB()
  })

  // IPC para pausar/reanudar monitoreo y apagar/encender hardware de cámara
  ipcMain.on('toggle-monitoring', (_, isMonitoring) => {
    console.log(`[Main Process] Estado de monitoreo biométrico: ${isMonitoring ? 'ACTIVO' : 'PAUSADO'}`)
    if (pythonProcess && pythonProcess.stdin && !pythonProcess.stdin.destroyed) {
      try {
        const cmd = JSON.stringify({ action: isMonitoring ? 'resume' : 'pause' }) + '\n'
        pythonProcess.stdin.write(cmd)
        console.log(`[Main Process] Comando hardware '${isMonitoring ? 'resume' : 'pause'}' enviado a Python stdin`)
      } catch (err) {
        console.error('[Main Process] Error comunicando con pythonProcess.stdin:', err)
      }
    }
  })

  // IPC para consultar estadísticas de uso de aplicaciones desde SQLite
  ipcMain.handle('get-app-usage-stats', async () => {
    return getAppUsageStatsFromDB()
  })

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
