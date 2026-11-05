import React from 'react'
import DashboardHeader from './DashboardHeader'
import TelemetryWidget from './TelemetryWidget'
import EyeBiometricsWidget from './EyeBiometricsWidget'
import FatigueLevelWidget from './FatigueLevelWidget'
import BlinkRateWidget from './BlinkRateWidget'
import VisualHealthIndexWidget from './VisualHealthIndexWidget'
import PauseRegistryWidget from './PauseRegistryWidget'
import TemporalCorrelationWidget from './TemporalCorrelationWidget'
import useBiometrics from '../../hooks/useBiometrics'

export const Dashboard: React.FC = () => {
  const { biometrics, historyData } = useBiometrics()

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col">
      {/* Fila Superior: Controles, Escáner Biométrico y Estado Ocular */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Columna Izquierda: Títulos, acciones y telemetría de aplicaciones */}
        <div className="flex flex-col gap-6" id="dashboard-col-left">
          <DashboardHeader />
          <TelemetryWidget
            activeApp={biometrics.active_app}
            appStatus={biometrics.app_status}
            roleDescription={biometrics.app_status}
            appUsageStats={historyData?.app_usage_stats}
          />
        </div>

        {/* Columna Central: Modelo biométrico 3D (Ojo con retícula HUD) */}
        <div
          className="flex flex-col items-center justify-center"
          id="dashboard-col-center"
        >
          <EyeBiometricsWidget
            ear={biometrics.ear}
            trackingPoints={biometrics.tracking_points}
          />
        </div>

        {/* Columna Derecha: Tarjetas de fatiga ocular y frecuencia de parpadeo en tiempo real */}
        <div className="flex flex-col gap-6" id="dashboard-col-right">
          <FatigueLevelWidget
            fatigueLevel={biometrics.fatigue_level}
            sessionDuration={biometrics.session_time}
            nextBreakMinutes={biometrics.next_break_minutes}
          />
          <BlinkRateWidget bpm={biometrics.bpm} />
        </div>
      </div>

      {/* Fila Inferior: Widgets de Salud Visual, Registro de Pausas y Correlación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <VisualHealthIndexWidget
          averageFatigue={historyData?.average_fatigue}
        />
        <PauseRegistryWidget
          appUsageStats={historyData?.app_usage_stats}
        />
        <TemporalCorrelationWidget
          ear={biometrics.ear.toFixed(2)}
          earHistory={historyData?.historical_ear}
        />
      </div>
    </div>
  )
}

export default Dashboard
