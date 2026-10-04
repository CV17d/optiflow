import React from 'react'
import Card from '../ui/Card'

export interface PauseRegistryWidgetProps {
  adherence?: string
  postponed?: string
}

const barData = [
  { label: 'Ayer', height: 'h-14', color: 'bg-orange-500' },
  { label: 'Objetivo', height: 'h-8', color: 'bg-orange-200' },
  { label: 'Hoy', height: 'h-16', color: 'bg-orange-500' },
  { label: 'Bara', height: 'h-6', color: 'bg-orange-200/80' }
]

export const PauseRegistryWidget: React.FC<PauseRegistryWidgetProps> = ({
  adherence = '+84%',
  postponed = 'Mínima (2)'
}) => {
  return (
    <Card className="p-6 flex flex-col justify-between select-none">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 leading-tight">
            Registro de Pausas
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hoy vs Sesión Anterior
          </p>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Opciones"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* Contenido: Métricas a la izquierda y Gráfico de Barras a la derecha */}
      <div className="flex items-end justify-between mt-4">
        {/* Métricas */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            ADHERENCIA 20-20-20
          </span>
          <span className="text-2xl font-black text-slate-900 mt-0.5">
            {adherence}
          </span>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3">
            POSPUESTAS
          </span>
          <span className="text-sm font-semibold text-slate-800 mt-0.5">
            {postponed}
          </span>
        </div>

        {/* Gráfico de Barras */}
        <div className="flex items-end gap-2.5 h-20">
          {barData.map((bar) => (
            <div key={bar.label} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-3.5 ${bar.height} ${bar.color} rounded-t-sm transition-all duration-300`}
              />
              <span className="text-[9px] text-slate-400 font-medium text-center leading-none">
                {bar.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default PauseRegistryWidget
