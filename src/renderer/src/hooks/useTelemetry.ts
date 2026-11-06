import { useState, useEffect, useRef } from 'react'

export interface TelemetryData {
  fatigue_level: number
  blink_rate: number
  active_app: string
  app_status?: string
  ear?: number
  average_ear?: number
  left_ear?: number
  right_ear?: number
  ear_symmetry?: number
  distance?: number
  distance_cm?: number | string
  posture_status?: 'Óptima' | 'Leve Inclinación' | 'Mala Postura' | string
  posture_angle?: number
  ear_threshold?: number
}

export interface CalibrationResult {
  threshold: number
  minEar: number
  maxEar: number
  completed: boolean
}

export interface CalibrationState {
  isActive: boolean
  progress: number
  remainingSeconds: number
  currentEar: number
  faceMesh: number[][]
  imageB64?: string
  result: CalibrationResult | null
  isSaved: boolean
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

export interface HistoricalEarRecord {
  id: number
  timestamp: string
  ear: number
  fatigue_level?: number
  blink_rate?: number
}

export interface HistoryData {
  average_fatigue: number
  average_ear?: number
  app_usage_stats: AppUsageStat[]
  historical_ear: HistoricalEarRecord[]
}

export interface UseTelemetryReturn {
  data: TelemetryData
  historyData: HistoryData | null
  calibrationState: CalibrationState
  isConnected: boolean
  error: string | null
  sendCommand: (cmd: { action: string; [key: string]: unknown }) => void
  startCalibration: () => void
  saveCalibration: (threshold: number) => void
  resetCalibration: () => void
}

const DEFAULT_TELEMETRY: TelemetryData = {
  fatigue_level: 18,
  blink_rate: 18,
  active_app: 'VS Code',
  app_status: 'Enfoque Profundo',
  ear: 0.28,
  average_ear: 0.26,
  left_ear: 0.27,
  right_ear: 0.27,
  ear_symmetry: 98.2,
  distance: 58.4,
  distance_cm: 58.4,
  posture_status: 'Óptima',
  posture_angle: 12.0,
  ear_threshold: 0.18
}

const DEFAULT_CALIBRATION: CalibrationState = {
  isActive: false,
  progress: 0,
  remainingSeconds: 15,
  currentEar: 0.25,
  faceMesh: [],
  imageB64: '',
  result: null,
  isSaved: false
}

const DEFAULT_HISTORY: HistoryData = {
  average_fatigue: 20,
  app_usage_stats: [],
  historical_ear: []
}

export function useTelemetry(url: string = 'ws://localhost:8765'): UseTelemetryReturn {
  const [data, setData] = useState<TelemetryData>(DEFAULT_TELEMETRY)
  const [historyData, setHistoryData] = useState<HistoryData | null>(DEFAULT_HISTORY)
  const [calibrationState, setCalibrationState] = useState<CalibrationState>(DEFAULT_CALIBRATION)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let isMounted = true

    function connect(): void {
      try {
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = (): void => {
          if (!isMounted) return
          console.log('Conexión establecida con ws://localhost:8765')
          setIsConnected(true)
          setError(null)
        }

        ws.onmessage = (event: MessageEvent): void => {
          if (!isMounted) return
          try {
            const parsed = JSON.parse(event.data)

            // Manejo de eventos de Calibración Biométrica Interactiva
            if (parsed.type === 'calibration_stream') {
              setCalibrationState((prev) => ({
                ...prev,
                isActive: parsed.calibration_active ?? true,
                progress: typeof parsed.progress === 'number' ? parsed.progress : prev.progress,
                remainingSeconds:
                  typeof parsed.remaining_seconds === 'number'
                    ? parsed.remaining_seconds
                    : prev.remainingSeconds,
                currentEar:
                  typeof parsed.current_ear === 'number' ? parsed.current_ear : prev.currentEar,
                faceMesh: Array.isArray(parsed.face_mesh) ? parsed.face_mesh : prev.faceMesh,
                imageB64: typeof parsed.image_b64 === 'string' ? parsed.image_b64 : prev.imageB64,
                result: parsed.result
                  ? {
                      threshold: parsed.result.threshold,
                      minEar: parsed.result.min_ear,
                      maxEar: parsed.result.max_ear,
                      completed: parsed.result.completed
                    }
                  : prev.result
              }))
            } else if (parsed.type === 'calibration_result') {
              setCalibrationState((prev) => ({
                ...prev,
                isActive: false,
                progress: 100,
                remainingSeconds: 0,
                result: {
                  threshold: parsed.threshold,
                  minEar: parsed.min_ear,
                  maxEar: parsed.max_ear,
                  completed: parsed.completed ?? true
                }
              }))
            } else if (parsed.type === 'calibration_saved') {
              setCalibrationState((prev) => ({
                ...prev,
                isSaved: true
              }))
              if (typeof parsed.threshold === 'number') {
                setData((prev) => ({ ...prev, ear_threshold: parsed.threshold }))
              }
            } else if (parsed.type === 'calibration_started') {
              setCalibrationState((prev) => ({
                ...prev,
                isActive: true,
                progress: 0,
                remainingSeconds: 15,
                result: null,
                isSaved: false
              }))
            } else if (parsed.type === 'initial_history' || parsed.event === 'initial_history') {
              const stats = parsed.historical_stats || parsed
              const parsedHistory: HistoryData = {
                average_fatigue: Number(stats.average_fatigue ?? parsed.average_fatigue ?? 0),
                average_ear: Number(stats.average_ear ?? parsed.average_ear ?? 0.26),
                app_usage_stats: Array.isArray(stats.app_usage_stats)
                  ? stats.app_usage_stats
                  : parsed.app_usage_stats || [],
                historical_ear: Array.isArray(stats.historical_ear)
                  ? stats.historical_ear
                  : parsed.historical_ear || []
              }
              console.log('Historial inicial de SQLite recibido:', parsedHistory)
              setHistoryData(parsedHistory)
            } else {
              // Telemetría normal en tiempo real
              setData((prev) => ({
                ...prev,
                ...parsed
              }))
            }
          } catch (err) {
            console.error('Error al parsear telemetría WebSocket:', err)
          }
        }

        ws.onerror = (): void => {
          if (!isMounted) return
          setError('Error en la conexión con el motor de telemetría')
        }

        ws.onclose = (): void => {
          if (!isMounted) return
          setIsConnected(false)
          // Reintentar conexión automáticamente tras 2 segundos
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect()
          }, 2000)
        }
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Error desconocido al conectar')
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) connect()
        }, 2000)
      }
    }

    connect()

    return () => {
      isMounted = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [url])

  const sendCommand = (cmd: { action: string; [key: string]: unknown }): void => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(cmd))
        console.log('[WebSocket] Comando enviado al backend Python:', cmd)
      }
    } catch (err) {
      console.error('[WebSocket] Error enviando comando:', err)
    }
  }

  const startCalibration = (): void => {
    setCalibrationState({
      isActive: true,
      progress: 0,
      remainingSeconds: 15,
      currentEar: 0.25,
      faceMesh: [],
      imageB64: '',
      result: null,
      isSaved: false
    })
    sendCommand({ action: 'start_calibration' })
  }

  const saveCalibration = (threshold: number): void => {
    sendCommand({ action: 'save_calibration', threshold })
    setCalibrationState((prev) => ({ ...prev, isSaved: true }))
    setData((prev) => ({ ...prev, ear_threshold: threshold }))
  }

  const resetCalibration = (): void => {
    setCalibrationState(DEFAULT_CALIBRATION)
  }

  return {
    data,
    historyData,
    calibrationState,
    isConnected,
    error,
    sendCommand,
    startCalibration,
    saveCalibration,
    resetCalibration
  }
}

export default useTelemetry
