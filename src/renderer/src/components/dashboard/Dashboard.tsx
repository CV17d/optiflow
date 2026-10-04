import React from 'react'
import DashboardHeader from './DashboardHeader'
import TelemetryWidget from './TelemetryWidget'
import EyeBiometricsWidget from './EyeBiometricsWidget'
import FatigueLevelWidget from './FatigueLevelWidget'
import BlinkRateWidget from './BlinkRateWidget'
import VisualHealthIndexWidget from './VisualHealthIndexWidget'
import PauseRegistryWidget from './PauseRegistryWidget'
import TemporalCorrelationWidget from './TemporalCorrelationWidget'
import useTelemetry from '../../hooks/useTelemetry'

export const Dashboard: React.FC = () => {
  const { data: telemetry } = useTelemetry()

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col">
      {/* Fila Superior: Controles, Escáner Biométrico y Estado Ocular */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Columna Izquierda: Títulos, acciones y telemetría de aplicaciones */}
        <div className="flex flex-col gap-6" id="dashboard-col-left">
          <DashboardHeader />
          <TelemetryWidget activeApp={telemetry.active_app} />
        </div>

        {/* Columna Central: Modelo biométrico 3D (Ojo con retícula HUD) */}
        <div
          className="flex flex-col items-center justify-center"
          id="dashboard-col-center"
        >
          <EyeBiometricsWidget />
        </div>

        {/* Columna Derecha: Tarjetas de fatiga ocular y frecuencia de parpadeo */}
        <div className="flex flex-col gap-6" id="dashboard-col-right">
          <FatigueLevelWidget fatigueLevel={telemetry.fatigue_level} />
          <BlinkRateWidget bpm={telemetry.blink_rate} />
        </div>
      </div>

      {/* Fila Inferior: Widgets de Salud Visual, Registro de Pausas y Correlación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <VisualHealthIndexWidget />
        <PauseRegistryWidget />
        <TemporalCorrelationWidget />
      </div>
    </div>
  )
}

export default Dashboard
