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
  sessionDuration = '0m',
  nextBreakMinutes = 20
}) => {
  const badgeLabel = fatigueLevel > 60 ? 'ALTO' : fatigueLevel > 30 ? 'MODERADO' : 'OPTIMO'

  return (
    <Card className="p-5 flex flex-col justify-between gap-3 select-none">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
            Nivel de Fatiga Ocular
          </h3>
          <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5">
            Modo Protección Inteligente
          </p>
        </div>
        <button
          type="button"
          className="text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 -mr-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Opciones"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* Contenido Central: Métricas a la izquierda, Medidor/Badge circular a la derecha */}
      <div className="flex items-center justify-between gap-4 py-1">
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
            FATIGA
          </span>
          <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none mt-1">
            {fatigueLevel}%
          </span>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mt-3">
            SESIÓN CONTINUA
          </span>
          <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
            {sessionDuration}
          </span>
        </div>

        {/* Círculo indicador de estado Óptimo / Alerta */}
        <div className="flex items-center justify-center">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-orange-100 dark:border-orange-950/60 flex items-center justify-center p-1">
            <Badge
              variant="solid-orange"
              className="w-full h-full rounded-full flex items-center justify-center text-xs sm:text-sm font-extrabold shadow-md shadow-orange-500/25 p-0"
            >
              {badgeLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Footer: Tiempo para la próxima pausa */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 pt-1.5 border-t border-slate-100/80 dark:border-zinc-800">
        <svg
          className="w-4 h-4 text-orange-500 shrink-0"
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
          <strong className="font-bold text-slate-800 dark:text-white">{nextBreakMinutes} min</strong>
        </span>
      </div>
    </Card>
  )
}

export default FatigueLevelWidget
