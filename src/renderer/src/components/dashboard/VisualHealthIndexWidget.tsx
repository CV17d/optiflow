import React from 'react'
import Card from '../ui/Card'

export interface VisualHealthIndexWidgetProps {
  status?: string
  degradation?: string
  score?: number
}

export const VisualHealthIndexWidget: React.FC<VisualHealthIndexWidgetProps> = ({
  status = 'Excelente',
  degradation = 'Baja',
  score = 92
}) => {
  return (
    <Card className="p-6 flex flex-col justify-between select-none">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 leading-tight">
            Índice de Salud Visual
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Score Ergonómico</p>
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

      {/* Contenido: Bloques de estado y medidor circular */}
      <div className="flex justify-between items-center mt-4">
        {/* Bloque Izquierdo */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            ESTADO
          </span>
          <span className="text-sm font-bold text-slate-800 mt-0.5">
            {status}
          </span>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3">
            DEGRADACIÓN
          </span>
          <span className="text-sm font-bold text-slate-800 mt-0.5">
            {degradation}
          </span>
        </div>

        {/* Medidor Circular */}
        <div className="border-4 border-dashed border-orange-500 rounded-full w-24 h-24 flex flex-col items-center justify-center p-2 shadow-xs bg-orange-50/20">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight text-center leading-none">
            HEALTH SCORE
          </span>
          <span className="text-sm font-black text-slate-900 mt-1">
            {score}
            <span className="text-xs font-semibold text-slate-400">/100</span>
          </span>
        </div>
      </div>
    </Card>
  )
}

export default VisualHealthIndexWidget
