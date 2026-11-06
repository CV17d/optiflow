import React, { useState, useRef, useEffect } from 'react'
import DashboardHeader from './DashboardHeader'
import TelemetryWidget from './TelemetryWidget'
import EyeBiometricsWidget from './EyeBiometricsWidget'
import FatigueLevelWidget from './FatigueLevelWidget'
import BlinkRateWidget from './BlinkRateWidget'
import VisualHealthIndexWidget from './VisualHealthIndexWidget'
import PauseRegistryWidget from './PauseRegistryWidget'
import TemporalCorrelationWidget from './TemporalCorrelationWidget'
import useBiometrics from '../../hooks/useBiometrics'
import type { AppUsageStat, BreakStats } from '../../hooks/useTelemetry'

export const Dashboard: React.FC = () => {
  const { biometrics, historyData, sendAction } = useBiometrics()
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true)
  const [appUsageStats, setAppUsageStats] = useState<AppUsageStat[]>([])
  const [breakStats, setBreakStats] = useState<BreakStats>({
    suggested: 6,
    completed: 5,
    postponed: 1,
    adherence: '+84%',
    adherencePercentage: 84
  })
  const pausedFatigueRef = useRef<number>(18)

  // Carga reactiva de estadísticas de aplicaciones y pausas ergonómicas desde SQLite vía IPC
  useEffect(() => {
    let isMounted = true

    const fetchAppUsage = async (): Promise<void> => {
      try {
        if (window.electron?.getAppUsageStats) {
          const stats = await window.electron.getAppUsageStats()
          if (isMounted && stats && stats.length > 0) {
            setAppUsageStats(stats)
            return
          }
        }
        if (window.api?.getAppUsageStats) {
          const stats = await window.api.getAppUsageStats()
          if (isMounted && stats && stats.length > 0) {
            setAppUsageStats(stats)
          }
        }
      } catch (err) {
        console.error('[Dashboard] Error al consultar estadísticas de SQLite vía IPC:', err)
      }
    }

    const fetchBreakStats = async (): Promise<void> => {
      try {
        if (window.electron?.getBreakStats) {
          const stats = await window.electron.getBreakStats()
          if (isMounted && stats) {
            setBreakStats(stats)
            return
          }
        }
        if (window.api?.getBreakStats) {
          const stats = await window.api.getBreakStats()
          if (isMounted && stats) {
            setBreakStats(stats)
          }
        }
      } catch (err) {
        console.error('[Dashboard] Error al consultar estadísticas de pausas vía IPC:', err)
      }
    }

    fetchAppUsage()
    fetchBreakStats()

    const interval = setInterval(() => {
      fetchAppUsage()
      fetchBreakStats()
    }, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Congelar fatiga cuando el monitoreo se encuentra pausado por el usuario
  if (isMonitoring) {
    pausedFatigueRef.current = biometrics.fatigue_level
  }
  const currentFatigue = isMonitoring ? biometrics.fatigue_level : pausedFatigueRef.current

  // Vinculación de telemetría de SQLite: prioriza IPC directo y utiliza historyData inicial como respaldo
  const currentUsageStats =
    appUsageStats.length > 0 ? appUsageStats : historyData?.app_usage_stats || []

  const handleToggleMonitoring = (): void => {
    setIsMonitoring((prev) => {
      const next = !prev
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('toggle-monitoring', next)
      }
      sendAction(next ? 'resume' : 'pause')
      return next
    })
  }

  const handleTriggerBreak = (): void => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('trigger-break')
    }
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col justify-between overflow-hidden gap-2.5 pb-0.5">
      {/* Fila Superior: Controles, Escáner Biométrico y Estado Ocular */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 w-full items-stretch">
        {/* Columna Izquierda: Títulos, acciones y telemetría de aplicaciones */}
        <div className="flex flex-col gap-2.5 justify-between" id="dashboard-col-left">
          <DashboardHeader
            isMonitoring={isMonitoring}
            onToggleMonitoring={handleToggleMonitoring}
            onTriggerBreak={handleTriggerBreak}
          />
          <TelemetryWidget
            activeApp={isMonitoring ? biometrics.active_app : `${biometrics.active_app} (Pausado)`}
            appStatus={isMonitoring ? biometrics.app_status : 'Monitoreo en Pausa'}
            roleDescription={isMonitoring ? biometrics.app_status : 'Monitoreo en Pausa'}
            appIconBase64={isMonitoring ? biometrics.appIconBase64 : undefined}
            appUsageStats={currentUsageStats}
          />
        </div>

        {/* Columna Central: Modelo biométrico 3D (Ojo con retícula HUD) */}
        <div
          className="flex flex-col items-center justify-center"
          id="dashboard-col-center"
        >
          <EyeBiometricsWidget
            ear={biometrics.ear}
            trackingPoints={isMonitoring ? biometrics.tracking_points : 0}
          />
        </div>

        {/* Columna Derecha: Tarjetas de fatiga ocular y frecuencia de parpadeo en tiempo real */}
        <div className="flex flex-col gap-2.5 justify-between" id="dashboard-col-right">
          <FatigueLevelWidget
            fatigueLevel={currentFatigue}
            sessionDuration={biometrics.session_time}
            nextBreakMinutes={biometrics.next_break_minutes}
          />
          <BlinkRateWidget bpm={isMonitoring ? biometrics.bpm : 0} />
        </div>
      </div>

      {/* Fila Inferior: Widgets Reactivos de Salud Visual, Registro de Pausas y Correlación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-1 items-stretch">
        <VisualHealthIndexWidget
          fatigueLevel={currentFatigue}
          averageFatigue={historyData?.average_fatigue}
        />
        <PauseRegistryWidget
          adherence={breakStats.adherence}
          postponed={breakStats.postponed > 0 ? `Mínima (${breakStats.postponed})` : '0'}
          appUsageStats={currentUsageStats}
        />
        <TemporalCorrelationWidget
          ear={biometrics.ear.toFixed(2)}
          averageEar={biometrics.average_ear}
          distance={biometrics.distance_cm}
          fatigueLevel={currentFatigue}
          sessionSeconds={biometrics.elapsed_seconds}
          earHistory={historyData?.historical_ear}
        />
      </div>
    </div>
  )
}

export default Dashboard
