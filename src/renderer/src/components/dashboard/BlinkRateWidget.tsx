import React, { useMemo } from 'react'
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
  const dynamicStatus = useMemo(() => {
    if (statusText) return statusText
    if (bpm >= 14 && bpm <= 25) return 'Saludable (14 - 25)'
    if (bpm < 14) return 'Tensión Ocular (< 14)'
    return 'Elevado (> 25)'
  }, [bpm, statusText])

  // Normalización del ancho de barra reactiva en tiempo real (escala 0 a 35+ BPM)
  const barWidth = useMemo(() => {
    if (typeof percentage === 'number') return Math.min(100, Math.max(0, percentage))
    return Math.min(Math.max(Math.round((bpm / 35) * 100), 10), 100)
  }, [bpm, percentage])

  return (
    <Card className="p-5 flex flex-col justify-between gap-3 select-none">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
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
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* Contenido: Barra de Progreso Dinámica */}
      <div className="flex flex-col gap-2 mt-1">
        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
          RITMO DE PARPADEO
        </span>
        <div className="w-full h-3 bg-gray-200/80 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Footer: BPM destacado en gran escala */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
          {bpm} <span className="text-sm sm:text-base font-bold text-slate-500">BPM</span>
        </span>
        <span className="text-xs sm:text-sm text-slate-600 font-semibold bg-slate-100/80 px-2.5 py-1 rounded-full">
          {dynamicStatus}
        </span>
      </div>
    </Card>
  )
}

export default BlinkRateWidget
