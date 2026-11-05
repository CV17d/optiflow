import { useState, useEffect, useMemo } from 'react'
import { useTelemetry, HistoryData, TelemetryData } from './useTelemetry'

export interface BiometricsState {
  fatigue_level: number
  bpm: number
  ear: number
  session_time: string
  next_break_minutes: number
  active_app: string
  app_status: string
  tracking_points: number
}

export interface UseBiometricsReturn {
  biometrics: BiometricsState
  telemetry: TelemetryData
  historyData: HistoryData | null
  isConnected: boolean
  error: string | null
  sendAction: (action: 'pause' | 'resume') => void
}

/**
 * Hook reactivo que conecta con el WebSocket del motor biométrico OptiFlow,
 * proporcionando métricas en tiempo real y contador de sesión continuo.
 */
export function useBiometrics(url: string = 'ws://localhost:8765'): UseBiometricsReturn {
  const { data: telemetry, historyData, isConnected, error, sendCommand } = useTelemetry(url)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)

  // Temporizador dinámico para calcular tiempo de sesión en pantalla
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Formato legible de sesión continua (ej. '12m' o '1h 24m')
  const sessionTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }, [elapsedSeconds])

  // Cálculo de cuenta regresiva para la regla 20-20-20 (pausa cada 20 minutos)
  const nextBreakMinutes = useMemo(() => {
    const remainder = 20 - (Math.floor(elapsedSeconds / 60) % 20)
    return Math.max(1, remainder)
  }, [elapsedSeconds])

  const biometrics: BiometricsState = useMemo(() => {
    return {
      fatigue_level: typeof telemetry.fatigue_level === 'number' ? Math.round(telemetry.fatigue_level) : 18,
      bpm: typeof telemetry.blink_rate === 'number' ? telemetry.blink_rate : 16,
      ear: typeof telemetry.ear === 'number' ? Number(telemetry.ear.toFixed(2)) : 0.28,
      session_time: sessionTime,
      next_break_minutes: nextBreakMinutes,
      active_app: telemetry.active_app || 'VS Code',
      app_status: telemetry.app_status || 'Enfoque Profundo',
      tracking_points: isConnected ? 468 : 0
    }
  }, [telemetry, sessionTime, nextBreakMinutes, isConnected])

  const sendAction = (action: 'pause' | 'resume'): void => {
    sendCommand({ action })
  }

  return {
    biometrics,
    telemetry,
    historyData,
    isConnected,
    error,
    sendAction
  }
}

export default useBiometrics
