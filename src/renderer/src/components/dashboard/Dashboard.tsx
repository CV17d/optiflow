import React from 'react'
import DashboardHeader from './DashboardHeader'

export const Dashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-[1600px] mx-auto">
      {/* Columna Izquierda: Títulos, acciones y telemetría de aplicaciones */}
      <div className="flex flex-col gap-6" id="dashboard-col-left">
        <DashboardHeader />
      </div>

      {/* Columna Central: Modelo biométrico 3D (Ojo con retícula HUD) */}
      <div className="flex flex-col items-center justify-center" id="dashboard-col-center">
        {/* Contenido reservado para visualizador central */}
      </div>

      {/* Columna Derecha: Tarjetas de fatiga ocular y frecuencia de parpadeo */}
      <div className="flex flex-col gap-6" id="dashboard-col-right">
        {/* Contenido reservado para columna derecha */}
      </div>
    </div>
  )
}

export default Dashboard
