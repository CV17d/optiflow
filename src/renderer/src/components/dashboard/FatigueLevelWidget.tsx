import React from 'react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

export interface FatigueLevelWidgetProps {
  fatigueLevel?: number
  sessionDuration?: string
  nextBreakMinutes?: number
}

export const FatigueLevelWidget: React.FC<FatigueLevelWidgetProps> = ({
  fatigueLevel = 18,
  sessionDuration = '1h 42m',
  nextBreakMinutes = 14
}) => {
  return (
    <Card className="p-6 flex flex-col justify-between gap-4 select-none">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 leading-tight">
            Nivel de Fatiga Ocular
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Modo Protección Inteligente
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

      {/* Contenido Central: Métricas a la izquierda, Medidor/Badge circular a la derecha */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            FATIGA
          </span>
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none mt-1">
            {fatigueLevel}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3">
            SESIÓN CONTINUA
          </span>
          <span className="text-sm font-semibold text-slate-700 mt-0.5">
            {sessionDuration}
          </span>
        </div>

        {/* Círculo indicador de estado Óptimo */}
        <div className="flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-orange-100 flex items-center justify-center p-1">
            <Badge
              variant="solid-orange"
              className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold shadow-md shadow-orange-500/25 p-0"
            >
              OPTIMO
            </Badge>
          </div>
        </div>
      </div>

      {/* Footer: Tiempo para la próxima pausa */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100/80">
        <svg
          className="w-3.5 h-3.5 text-orange-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>
          Próxima pausa en:{' '}
          <strong className="font-semibold text-slate-700">{nextBreakMinutes} min</strong>
        </span>
      </div>
    </Card>
  )
}

export default FatigueLevelWidget
