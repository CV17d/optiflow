import React from 'react'
import Card from '../ui/Card'

export interface BlinkRateWidgetProps {
  bpm?: number
  statusText?: string
  percentage?: number
}

export const BlinkRateWidget: React.FC<BlinkRateWidgetProps> = ({
  bpm = 18,
  statusText,
  percentage
}) => {
  const dynamicStatus =
    statusText ??
    (bpm >= 14 && bpm <= 20
      ? 'Saludable (14 - 20)'
      : bpm < 14
        ? 'Tensión Ocular (< 14)'
        : 'Elevado (> 20)')

  const barWidth = percentage ?? Math.min(Math.max(Math.round((bpm / 25) * 100), 15), 100)
  return (
    <Card className="p-6 flex flex-col justify-between gap-4 select-none">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 leading-tight">
            Tasa de Parpadeo
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Frecuencia Ocular Dinámica
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

      {/* Contenido: Barra de Progreso */}
      <div className="flex flex-col gap-2 mt-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          RITMO DE PARPADEO
        </span>
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-sm font-bold text-slate-900">
          {bpm} BPM
        </span>
        <span className="text-xs text-slate-500 font-medium">
          {dynamicStatus}
        </span>
      </div>
    </Card>
  )
}

export default BlinkRateWidget
