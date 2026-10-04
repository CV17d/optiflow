import { useState, useEffect, useRef } from 'react'

export interface TelemetryData {
  fatigue_level: number
  blink_rate: number
  active_app: string
}

export interface UseTelemetryReturn {
  data: TelemetryData
  isConnected: boolean
  error: string | null
}

const DEFAULT_TELEMETRY: TelemetryData = {
  fatigue_level: 18,
  blink_rate: 18,
  active_app: 'VS Code'
}

export function useTelemetry(url: string = 'ws://localhost:8765'): UseTelemetryReturn {
  const [data, setData] = useState<TelemetryData>(DEFAULT_TELEMETRY)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let isMounted = true

    function connect() {
      try {
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          if (!isMounted) return
          setIsConnected(true)
          setError(null)
        }

        ws.onmessage = (event: MessageEvent) => {
          if (!isMounted) return
          try {
            const parsed = JSON.parse(event.data) as TelemetryData
            setData((prev) => ({
              ...prev,
              ...parsed
            }))
          } catch (err) {
            console.error('Error al parsear telemetría WebSocket:', err)
          }
        }

        ws.onerror = () => {
          if (!isMounted) return
          setError('Error en la conexión con el motor de telemetría')
        }

        ws.onclose = () => {
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

  return { data, isConnected, error }
}

export default useTelemetry
