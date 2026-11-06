import { useState, useEffect, useMemo } from 'react'
import {
  useTelemetry,
  HistoryData,
  TelemetryData,
  CalibrationState,
  CalibrationResult
} from './useTelemetry'

export type { CalibrationState, CalibrationResult }

export interface BiometricsState {
  fatigue_level: number
  bpm: number
  ear: number
  average_ear: number
  left_ear: number
  right_ear: number
  ear_symmetry: number
  distance: number
  distance_cm: string
  posture_status: string
  posture_angle: number
  session_time: string
  elapsed_seconds: number
  next_break_minutes: number
  active_app: string
  app_status: string
  appIconBase64?: string
  tracking_points: number
  ear_threshold: number
}

export interface UseBiometricsReturn {
  biometrics: BiometricsState
  telemetry: TelemetryData
  historyData: HistoryData | null
  calibrationState: CalibrationState
  isConnected: boolean
  error: string | null
  sendAction: (action: 'pause' | 'resume') => void
  startCalibration: () => void
  saveCalibration: (threshold: number) => void
  resetCalibration: () => void
}

/**
 * Hook reactivo que conecta con el WebSocket del motor biométrico OptiFlow,
 * proporcionando métricas en tiempo real y contador de sesión continuo.
 */
export function useBiometrics(url: string = 'ws://localhost:8765'): UseBiometricsReturn {
  const {
    data: telemetry,
    historyData,
    calibrationState,
    isConnected,
    error,
    sendCommand,
    startCalibration,
    saveCalibration,
    resetCalibration
  } = useTelemetry(url)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [workIntervalMinutes, setWorkIntervalMinutes] = useState<number>(20)

  // Cargar configuración de usuario para personalizar intervalo de trabajo
  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      try {
        const s =
          (await window.electron?.getSettings?.()) || (await window.api?.getSettings?.())
        if (s && typeof s.workInterval === 'number') {
          setWorkIntervalMinutes(Math.max(1, s.workInterval))
        }
      } catch {
        // Usar 20 min por defecto
      }
    }
    loadSettings()
  }, [])

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

  // Cálculo de cuenta regresiva dinámica según el workInterval configurado por el usuario
  const nextBreakMinutes = useMemo(() => {
    const interval = Math.max(1, workIntervalMinutes)
    const remainder = interval - (Math.floor(elapsedSeconds / 60) % interval)
    return Math.max(1, remainder)
  }, [elapsedSeconds, workIntervalMinutes])

  const biometrics: BiometricsState = useMemo(() => {
    const avgEar =
      typeof telemetry.average_ear === 'number'
        ? Number(telemetry.average_ear.toFixed(2))
        : historyData?.average_ear
          ? Number(historyData.average_ear.toFixed(2))
          : 0.26

    const numDist =
      typeof telemetry.distance === 'number'
        ? telemetry.distance
        : typeof telemetry.distance_cm === 'number'
          ? telemetry.distance_cm
          : parseFloat(String(telemetry.distance_cm || '58.4')) || 58.4

    const strDistCm =
      typeof telemetry.distance_cm === 'string'
        ? telemetry.distance_cm
        : `${numDist} cm`

    return {
      fatigue_level: typeof telemetry.fatigue_level === 'number' ? Math.round(telemetry.fatigue_level) : 18,
      bpm: typeof telemetry.blink_rate === 'number' ? telemetry.blink_rate : 16,
      ear: typeof telemetry.ear === 'number' ? Number(telemetry.ear.toFixed(2)) : 0.28,
      average_ear: avgEar,
      left_ear: typeof telemetry.left_ear === 'number' ? Number(telemetry.left_ear.toFixed(2)) : 0.27,
      right_ear: typeof telemetry.right_ear === 'number' ? Number(telemetry.right_ear.toFixed(2)) : 0.27,
      ear_symmetry: typeof telemetry.ear_symmetry === 'number' ? Number(telemetry.ear_symmetry.toFixed(1)) : 98.2,
      distance: numDist,
      distance_cm: strDistCm,
      posture_status: telemetry.posture_status || 'Óptima',
      posture_angle: typeof telemetry.posture_angle === 'number' ? telemetry.posture_angle : 12.0,
      session_time: sessionTime,
      elapsed_seconds: elapsedSeconds,
      next_break_minutes: nextBreakMinutes,
      active_app: telemetry.active_app || 'VS Code',
      app_status: telemetry.app_status || 'Enfoque Profundo',
      appIconBase64: telemetry.appIconBase64 || telemetry.app_icon_base64 || '',
      tracking_points: isConnected ? 468 : 0,
      ear_threshold: typeof telemetry.ear_threshold === 'number' ? telemetry.ear_threshold : 0.18
    }
  }, [telemetry, historyData, sessionTime, elapsedSeconds, nextBreakMinutes, isConnected])

  const sendAction = (action: 'pause' | 'resume'): void => {
    sendCommand({ action })
  }

  return {
    biometrics,
    telemetry,
    historyData,
    calibrationState,
    isConnected,
    error,
    sendAction,
    startCalibration,
    saveCalibration,
    resetCalibration
  }
}

export default useBiometrics
