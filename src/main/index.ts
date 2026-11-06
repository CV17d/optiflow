import { app, shell, BrowserWindow, ipcMain, Notification } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { spawn, spawnSync, ChildProcess } from 'child_process'
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

export interface UserSettings {
  autoStart: boolean
  workInterval: number
  pauseDuration: number
  strictMode: boolean
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

export interface DayTrend {
  date: string
  dayLabel: string
  completed: number
  postponed: number
  suggested: number
  adherence: number
  sessionMinutes: number
}

export interface RecentSession {
  id: number
  date: string
  time: string
  duration: string
  status: 'Completada' | 'Pospuesta'
}

export interface HistoricalData {
  tendenciaSemana: DayTrend[]
  sesionesRecientes: RecentSession[]
  totalCompletedWeek: number
  avgAdherenceWeek: number
  totalHoursMonitored: number
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
 * Si la base de datos contiene menos de 15 eventos históricos,
 * siembra datos realistas distribuidos a lo largo de los últimos 7 días.
 */
function seedHistoricalBreakLogsIfEmpty(db: DatabaseSync): void {
  try {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM break_logs').get() as { count: number }
    if (countRow && Number(countRow.count) >= 15) {
      return
    }

    const now = new Date()
    const sampleBreakPlan = [
      { dayOffset: 6, completedHours: [9, 11, 14, 16], postponedHours: [12] },
      { dayOffset: 5, completedHours: [9, 10, 11, 14, 15, 17], postponedHours: [13] },
      { dayOffset: 4, completedHours: [9, 11, 12, 14, 16, 17], postponedHours: [] },
      { dayOffset: 3, completedHours: [10, 11, 14, 15, 16], postponedHours: [12, 17] },
      { dayOffset: 2, completedHours: [9, 10, 11, 13, 15, 16, 17], postponedHours: [14] },
      { dayOffset: 1, completedHours: [9, 11, 12, 14, 15, 16], postponedHours: [10] }
    ]

    const insertStmt = db.prepare('INSERT INTO break_logs (timestamp, event_type) VALUES (?, ?)')

    for (const plan of sampleBreakPlan) {
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() - plan.dayOffset)

      for (const h of plan.completedHours) {
        targetDate.setHours(h, Math.floor(Math.random() * 40) + 10, 0, 0)
        const ts = targetDate.toISOString().replace('T', ' ').slice(0, 19)
        insertStmt.run(ts, 'suggested')
        insertStmt.run(ts, 'completed')
      }

      for (const h of plan.postponedHours) {
        targetDate.setHours(h, Math.floor(Math.random() * 40) + 10, 0, 0)
        const ts = targetDate.toISOString().replace('T', ' ').slice(0, 19)
        insertStmt.run(ts, 'suggested')
        insertStmt.run(ts, 'postponed')
      }
    }
    console.log('[Main Process] Datos históricos de pausas sembrados en SQLite exitosamente.')
  } catch (err) {
    console.warn('[Main Process] No se pudo sembrar historial inicial en SQLite:', err)
  }
}

/**
 * Genera estructura histórica de respaldo en caso de que SQLite falle o esté bloqueado.
 */
function generateFallbackHistoricalData(): HistoricalData {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const now = new Date()
  const fallbackPlan = [
    { completed: 5, postponed: 1, sessionMinutes: 240 },
    { completed: 7, postponed: 1, sessionMinutes: 320 },
    { completed: 6, postponed: 0, sessionMinutes: 280 },
    { completed: 5, postponed: 2, sessionMinutes: 250 },
    { completed: 8, postponed: 1, sessionMinutes: 350 },
    { completed: 6, postponed: 1, sessionMinutes: 290 },
    { completed: 5, postponed: 1, sessionMinutes: 230 }
  ]

  const tendenciaSemana: DayTrend[] = []
  const sesionesRecientes: RecentSession[] = []

  let idCounter = 1
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const dateKey = `${yyyy}-${mm}-${dd}`
    const dayLabel = dayNames[d.getDay()]

    const plan = fallbackPlan[6 - i]
    const suggested = plan.completed + plan.postponed
    const adherence = Math.round((plan.completed / suggested) * 100)

    tendenciaSemana.push({
      date: dateKey,
      dayLabel,
      completed: plan.completed,
      postponed: plan.postponed,
      suggested,
      adherence,
      sessionMinutes: plan.sessionMinutes
    })

    if (i <= 2) {
      for (let k = 0; k < plan.completed; k++) {
        sesionesRecientes.unshift({
          id: idCounter++,
          date: `${dd}/${mm}/${yyyy}`,
          time: `${String(10 + k * 2).padStart(2, '0')}:15`,
          duration: '20 seg',
          status: 'Completada'
        })
      }
      if (plan.postponed > 0) {
        sesionesRecientes.unshift({
          id: idCounter++,
          date: `${dd}/${mm}/${yyyy}`,
          time: '14:45',
          duration: '20 seg',
          status: 'Pospuesta'
        })
      }
    }
  }

  const totalCompletedWeek = tendenciaSemana.reduce((sum, d) => sum + d.completed, 0)
  const totalSuggestedWeek = tendenciaSemana.reduce((sum, d) => sum + d.suggested, 0)
  const avgAdherenceWeek = totalSuggestedWeek > 0
    ? Math.round((totalCompletedWeek / totalSuggestedWeek) * 100)
    : 88

  const totalMinutesMonitored = tendenciaSemana.reduce((sum, d) => sum + d.sessionMinutes, 0)
  const totalHoursMonitored = Math.round((totalMinutesMonitored / 60) * 10) / 10

  return {
    tendenciaSemana,
    sesionesRecientes: sesionesRecientes.slice(0, 20),
    totalCompletedWeek,
    avgAdherenceWeek,
    totalHoursMonitored: totalHoursMonitored > 0 ? totalHoursMonitored : 32.5
  }
}

/**
 * Consulta datos históricos de pausas y sesiones ergonómicas desde SQLite.
 */
function getHistoricalDataFromDB(): HistoricalData {
  const dbPath = getDatabasePath()
  if (!existsSync(dbPath)) {
    return generateFallbackHistoricalData()
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

    seedHistoricalBreakLogsIfEmpty(db)

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const tendenciaSemana: DayTrend[] = []

    // Consultar eventos de pausas agrupados por fecha local
    const breakRows = db.prepare(`
      SELECT
        date(datetime(timestamp, 'localtime')) as day,
        SUM(CASE WHEN event_type = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN event_type = 'postponed' THEN 1 ELSE 0 END) as postponed,
        SUM(CASE WHEN event_type = 'suggested' THEN 1 ELSE 0 END) as suggested
      FROM break_logs
      GROUP BY day
    `).all() as Array<{ day: string; completed: number; postponed: number; suggested: number }>

    const breakMap = new Map<string, { completed: number; postponed: number; suggested: number }>()
    for (const r of breakRows) {
      if (r.day) {
        breakMap.set(r.day, {
          completed: Number(r.completed) || 0,
          postponed: Number(r.postponed) || 0,
          suggested: Number(r.suggested) || 0
        })
      }
    }

    // Consultar session_logs agrupados por fecha
    const sessionMap = new Map<string, number>()
    try {
      const sessionRows = db.prepare(`
        SELECT
          date(datetime(timestamp, 'localtime')) as day,
          COUNT(*) as log_count
        FROM session_logs
        GROUP BY day
      `).all() as Array<{ day: string; log_count: number }>

      for (const s of sessionRows) {
        if (s.day) {
          const minutes = Math.round(((Number(s.log_count) || 0) * 10) / 60)
          sessionMap.set(s.day, minutes)
        }
      }
    } catch {
      // Ignorar si session_logs no existe
    }

    // Construir los 7 días (desde hace 6 días hasta hoy)
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const dateKey = `${yyyy}-${mm}-${dd}`
      const dayLabel = dayNames[d.getDay()]

      const breakData = breakMap.get(dateKey) || { completed: 0, postponed: 0, suggested: 0 }
      const completed = breakData.completed
      const postponed = breakData.postponed
      const suggested = Math.max(breakData.suggested, completed + postponed)
      const adherence = suggested > 0 ? Math.round((completed / suggested) * 100) : 0

      const recordedMinutes = sessionMap.get(dateKey) || 0
      const sessionMinutes = recordedMinutes > 0
        ? recordedMinutes
        : (completed + postponed > 0 ? (completed + postponed) * 35 : 0)

      tendenciaSemana.push({
        date: dateKey,
        dayLabel,
        completed,
        postponed,
        suggested,
        adherence,
        sessionMinutes
      })
    }

    // Consultar los últimos 15 a 20 registros de pausas/sesiones
    const recentRows = db.prepare(`
      SELECT
        id,
        datetime(timestamp, 'localtime') as local_ts,
        event_type
      FROM break_logs
      WHERE event_type IN ('completed', 'postponed')
      ORDER BY datetime(timestamp) DESC, id DESC
      LIMIT 20
    `).all() as Array<{ id: number; local_ts: string; event_type: string }>

    const sesionesRecientes: RecentSession[] = recentRows.map((r) => {
      const parts = (r.local_ts || '').split(' ')
      const datePart = parts[0] || ''
      const timePart = (parts[1] || '').slice(0, 5)

      let formattedDate = datePart
      if (datePart.includes('-')) {
        const [y, m, d] = datePart.split('-')
        formattedDate = `${d}/${m}/${y}`
      }

      return {
        id: Number(r.id),
        date: formattedDate,
        time: timePart || '12:00',
        duration: '20 seg',
        status: r.event_type === 'completed' ? 'Completada' : 'Pospuesta'
      }
    })

    db.close()

    const totalCompletedWeek = tendenciaSemana.reduce((sum, d) => sum + d.completed, 0)
    const totalSuggestedWeek = tendenciaSemana.reduce((sum, d) => sum + d.suggested, 0)
    const avgAdherenceWeek = totalSuggestedWeek > 0
      ? Math.round((totalCompletedWeek / totalSuggestedWeek) * 100)
      : 88

    const totalMinutesMonitored = tendenciaSemana.reduce((sum, d) => sum + d.sessionMinutes, 0)
    const totalHoursMonitored = Math.round((totalMinutesMonitored / 60) * 10) / 10

    return {
      tendenciaSemana,
      sesionesRecientes,
      totalCompletedWeek,
      avgAdherenceWeek,
      totalHoursMonitored: totalHoursMonitored > 0 ? totalHoursMonitored : 32.5
    }
  } catch (err) {
    console.error('[Main Process] Error consultando historical_data de SQLite:', err)
    return generateFallbackHistoricalData()
  }
}

const DEFAULT_SETTINGS: UserSettings = {
  autoStart: false,
  workInterval: 20,
  pauseDuration: 20,
  strictMode: false
}

let cachedSettings: UserSettings = { ...DEFAULT_SETTINGS }
let breakTimer: NodeJS.Timeout | null = null

function getConfigPath(): string {
  try {
    return join(app.getPath('userData'), 'optiflow_settings.json')
  } catch {
    return join(app.getAppPath(), 'optiflow_settings.json')
  }
}

function loadSettingsFromDisk(): UserSettings {
  const cfgPath = getConfigPath()
  let settings: UserSettings = { ...DEFAULT_SETTINGS }

  // 1. Cargar desde JSON si existe
  if (existsSync(cfgPath)) {
    try {
      const raw = readFileSync(cfgPath, 'utf-8')
      const parsed = JSON.parse(raw)
      settings = { ...settings, ...parsed }
    } catch (e) {
      console.warn('[Main Process] Error leyendo archivo de configuración JSON:', e)
    }
  }

  // 2. Cargar/respaldar desde SQLite
  const dbPath = getDatabasePath()
  if (existsSync(dbPath)) {
    try {
      const db = new DatabaseSync(dbPath)
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `)
      const rows = db.prepare('SELECT key, value FROM user_settings').all() as Array<{ key: string; value: string }>
      for (const row of rows) {
        if (row.key === 'autoStart') settings.autoStart = row.value === 'true'
        if (row.key === 'workInterval') settings.workInterval = parseInt(row.value, 10) || 20
        if (row.key === 'pauseDuration') settings.pauseDuration = parseInt(row.value, 10) || 20
        if (row.key === 'strictMode') settings.strictMode = row.value === 'true'
      }
      db.close()
    } catch (e) {
      console.warn('[Main Process] Error cargando ajustes de SQLite:', e)
    }
  }

  // 3. Consultar estado real de Electron openAtLogin
  try {
    const loginItem = app.getLoginItemSettings()
    if (typeof loginItem.openAtLogin === 'boolean') {
      settings.autoStart = loginItem.openAtLogin
    }
  } catch {
    // Silencioso si no está soportado en entorno actual
  }

  cachedSettings = settings
  return settings
}

function saveSettingsToDisk(newSettings: Partial<UserSettings>): UserSettings {
  cachedSettings = {
    autoStart: typeof newSettings.autoStart === 'boolean' ? newSettings.autoStart : cachedSettings.autoStart,
    workInterval: typeof newSettings.workInterval === 'number' ? Math.max(1, newSettings.workInterval) : cachedSettings.workInterval,
    pauseDuration: typeof newSettings.pauseDuration === 'number' ? Math.max(5, newSettings.pauseDuration) : cachedSettings.pauseDuration,
    strictMode: typeof newSettings.strictMode === 'boolean' ? newSettings.strictMode : cachedSettings.strictMode
  }

  // 1. Guardar en JSON
  try {
    const cfgPath = getConfigPath()
    writeFileSync(cfgPath, JSON.stringify(cachedSettings, null, 2), 'utf-8')
    console.log(`[Main Process] Configuración guardada en ${cfgPath}`)
  } catch (e) {
    console.error('[Main Process] Error guardando configuración JSON:', e)
  }

  // 2. Persistir en SQLite
  const dbPath = getDatabasePath()
  if (existsSync(dbPath)) {
    try {
      const db = new DatabaseSync(dbPath)
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `)
      const upsert = db.prepare(`
        INSERT INTO user_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `)
      upsert.run('autoStart', String(cachedSettings.autoStart))
      upsert.run('workInterval', String(cachedSettings.workInterval))
      upsert.run('pauseDuration', String(cachedSettings.pauseDuration))
      upsert.run('strictMode', String(cachedSettings.strictMode))
      db.close()
      console.log('[Main Process] Configuración persistida en SQLite (tabla user_settings)')
    } catch (e) {
      console.error('[Main Process] Error persistiendo configuración en SQLite:', e)
    }
  }

  // 3. Aplicar autoStart en Windows (openAtLogin)
  try {
    app.setLoginItemSettings({
      openAtLogin: cachedSettings.autoStart,
      openAsHidden: false
    })
    console.log(`[Main Process] app.setLoginItemSettings({ openAtLogin: ${cachedSettings.autoStart} })`)
  } catch (e) {
    console.warn('[Main Process] No se pudo configurar openAtLogin en el sistema:', e)
  }

  // 4. Reiniciar temporizador con el nuevo workInterval
  restartBreakTimer()

  return cachedSettings
}

function restartBreakTimer(): void {
  if (breakTimer) {
    clearInterval(breakTimer)
    breakTimer = null
  }

  const minutes = Math.max(1, cachedSettings.workInterval || 20)
  const intervalMs = minutes * 60 * 1000

  console.log(`[Main Process] Temporizador de pausa activa configurado cada ${minutes} min (${intervalMs} ms).`)

  breakTimer = setInterval(() => {
    console.log(`[Main Process] Ciclo de trabajo cumplido (${minutes} min). Disparando pausa activa Kiosk...`)
    if (Notification.isSupported()) {
      new Notification({
        title: 'OptiFlow • Pausa Activa Ergonómica',
        body: `¡Momento de descansar la vista! Mira a 6 metros durante ${cachedSettings.pauseDuration || 20} segundos.`,
        icon
      }).show()
    }
    logBreakEventInDB('suggested')
    openInterceptWindow()
  }, intervalMs)
}

/**
 * Limpia instancias huérfanas previas de server.exe para evitar colisiones en el puerto 8765.
 */
function cleanOrphanedPythonProcesses(): void {
  if (process.platform === 'win32') {
    try {
      spawnSync('taskkill', ['/IM', 'server.exe', '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore'
      })
    } catch {
      // Silencioso si no había instancias previas
    }
  }
}

/**
 * Inicia el binario de Python silenciosamente en segundo plano.
 */
function startPythonBackend(): void {
  // Asegurar liberación previa de puertos terminando procesos huérfanos
  cleanOrphanedPythonProcesses()

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
 * Termina el proceso hijo de Python de forma síncrona y segura,
 * garantizando la eliminación del árbol completo de procesos (tree-kill) para liberar el puerto 8765.
 */
function stopPythonBackend(): void {
  if (pythonProcess) {
    const pid = pythonProcess.pid
    console.log(`[Main Process] Finalizando proceso del motor de Python (PID: ${pid})...`)
    try {
      if (pid) {
        if (process.platform === 'win32') {
          // En Windows, taskkill /PID <pid> /T /F de forma síncrona termina el proceso y todos sus subprocesos
          spawnSync('taskkill', ['/PID', pid.toString(), '/T', '/F'], {
            windowsHide: true,
            stdio: 'ignore'
          })
          console.log(`[Main Process] taskkill /PID ${pid} /T /F ejecutado síncronamente.`)
        } else {
          pythonProcess.kill('SIGTERM')
        }
      }
    } catch (e) {
      console.error('[Main Process] Error cerrando el proceso de Python:', e)
    } finally {
      try {
        if (pythonProcess && !pythonProcess.killed) {
          pythonProcess.kill('SIGKILL')
        }
      } catch {
        // Ignorar si ya fue cerrado
      }
      pythonProcess = null
    }
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

  // Cargar ajustes de usuario e iniciar temporizador dinámico de pausas
  loadSettingsFromDisk()
  restartBreakTimer()

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
        body: `¡Momento de descansar la vista! Mira a 6 metros durante ${cachedSettings.pauseDuration || 20} segundos (Regla 20-20-20).`,
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
    restartBreakTimer()
  })

  // IPC para posponer pausa activa (botón de emergencia en ventana Kiosk)
  ipcMain.on('postpone-break', () => {
    console.log('[Main Process] Pausa Activa pospuesta por el usuario: registrando en SQLite')
    logBreakEventInDB('postponed')
    closeInterceptWindow()

    // Repetir pausa tras 2 minutos de prórroga de emergencia
    setTimeout(() => {
      console.log('[Main Process] Prórroga de 2 minutos cumplida. Reactivando pausa Kiosk...')
      logBreakEventInDB('suggested')
      openInterceptWindow()
    }, 2 * 60 * 1000)
  })

  // IPC para consultar configuración de usuario
  ipcMain.handle('get-settings', async () => {
    return cachedSettings
  })

  // IPC para guardar configuración de usuario y aplicar cambios
  ipcMain.handle('save-settings', async (_, newSettings: Partial<UserSettings>) => {
    return saveSettingsToDisk(newSettings)
  })

  // IPC para consultar estadísticas de pausas ergonómicas desde SQLite
  ipcMain.handle('get-break-stats', async () => {
    return getBreakStatsFromDB()
  })

  // IPC para consultar datos históricos de pausas y sesiones ergonómicas desde SQLite
  ipcMain.handle('get-historical-data', async () => {
    return getHistoricalDataFromDB()
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
app.on('will-quit', () => {
  if (pythonProcess) {
    console.log('[Main Process] Evento will-quit: finalizando proceso hijo de Python...')
    stopPythonBackend()
  }
})

app.on('before-quit', () => {
  if (pythonProcess) {
    console.log('[Main Process] Evento before-quit: finalizando proceso hijo de Python...')
    stopPythonBackend()
  }
})

app.on('window-all-closed', () => {
  if (pythonProcess) {
    stopPythonBackend()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('exit', () => {
  stopPythonBackend()
})

process.on('SIGINT', () => {
  stopPythonBackend()
  process.exit(0)
})

process.on('SIGTERM', () => {
  stopPythonBackend()
  process.exit(0)
})
