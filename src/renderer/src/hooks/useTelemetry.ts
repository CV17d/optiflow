import { useState, useEffect, useRef } from 'react'

export interface TelemetryData {
  fatigue_level: number
  blink_rate: number
  active_app: string
  app_status?: string
  ear?: number
  average_ear?: number
  distance?: number
  distance_cm?: string
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
  isConnected: boolean
  error: string | null
  sendCommand: (cmd: { action: string; [key: string]: unknown }) => void
}

const DEFAULT_TELEMETRY: TelemetryData = {
  fatigue_level: 18,
  blink_rate: 18,
  active_app: 'VS Code',
  app_status: 'Enfoque Profundo',
  ear: 0.28,
  average_ear: 0.26,
  distance: 58.4,
  distance_cm: '58.4 cm'
}

const DEFAULT_HISTORY: HistoryData = {
  average_fatigue: 20,
  app_usage_stats: [],
  historical_ear: []
}

export function useTelemetry(url: string = 'ws://localhost:8765'): UseTelemetryReturn {
  const [data, setData] = useState<TelemetryData>(DEFAULT_TELEMETRY)
  const [historyData, setHistoryData] = useState<HistoryData | null>(DEFAULT_HISTORY)
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

            // Detectar si el mensaje entrante es el paquete inicial de historial de SQLite
            if (parsed.type === 'initial_history' || parsed.event === 'initial_history') {
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
              console.log('Telemetría en tiempo real recibida:', parsed)
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

  return { data, historyData, isConnected, error, sendCommand }
}

export default useTelemetry
