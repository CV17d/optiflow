import React, { useMemo } from 'react'
import Card from '../ui/Card'
import type { AppUsageStat } from '../../hooks/useTelemetry'

export interface PauseRegistryWidgetProps {
  adherence?: string
  postponed?: string
  appUsageStats?: AppUsageStat[]
}

/**
 * Formatea etiquetas del eje X para evitar colisiones y superposiciones de texto.
 */
function formatBarLabel(rawLabel: string): string {
  const label = rawLabel.trim()
  if (label.length <= 4) return label

  const lower = label.toLowerCase()
  if (lower.includes('edge')) return 'Edge'
  if (lower.includes('electron')) return 'Elec'
  if (lower.includes('chrome')) return 'Chr'
  if (lower.includes('code') || lower.includes('visual')) return 'Code'
  if (lower.includes('cursor')) return 'Curs'
  if (lower.includes('word')) return 'Word'
  if (lower.includes('slack')) return 'Slk'

  return `${label.slice(0, 3)}.`
}

export const PauseRegistryWidget: React.FC<PauseRegistryWidgetProps> = ({
  adherence = '+84%',
  postponed = 'Mínima (2)',
  appUsageStats = []
}) => {
  // Gráfico de barras dinamizado con el TOP 3 de aplicaciones más usadas devueltas por la telemetría
  const bars = useMemo(() => {
    if (!appUsageStats || appUsageStats.length === 0) {
      return [
        { label: 'App 1', heightPx: 26, color: 'bg-slate-200/60 dark:bg-zinc-800', title: 'Sin registros' },
        { label: 'App 2', heightPx: 18, color: 'bg-slate-200/50 dark:bg-zinc-800/80', title: 'Sin registros' },
        { label: 'App 3', heightPx: 22, color: 'bg-slate-200/40 dark:bg-zinc-800/60', title: 'Sin registros' }
      ]
    }

    // Tomar exactamente el Top 3 de aplicaciones más usadas
    return appUsageStats.slice(0, 3).map((stat, idx) => {
      // Normalizar altura de barra entre 20px y 72px según el porcentaje de uso real
      const heightPx = Math.max(20, Math.min(72, Math.round((stat.percentage / 100) * 72)))
      const color = idx === 0 ? 'bg-orange-500' : idx === 1 ? 'bg-orange-400' : 'bg-orange-300'
      return {
        label: stat.app,
        heightPx,
        color,
        title: `${stat.app}: ${stat.percentage}% (${stat.count} registros)`
      }
    })
  }, [appUsageStats])

  return (
    <Card className="p-5 flex flex-col justify-between select-none">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
            Registro de Pausas & Contexto
          </h3>
          <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5">
            Hoy vs Sesión Anterior
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

      {/* Contenido: Métricas a la izquierda y Gráfico Dinámico de Barras con espaciado amplio */}
      <div className="flex items-end justify-between mt-3 gap-3">
        {/* Métricas Reactivas */}
        <div className="flex flex-col shrink-0">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
            ADHERENCIA 20-20-20
          </span>
          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {adherence}
          </span>

          <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mt-3">
            POSPUESTAS
          </span>
          <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-200 mt-0.5 font-mono">
            {postponed}
          </span>
        </div>

        {/* Gráfico Dinámico de Barras */}
        <div className="flex items-end gap-3 pb-0.5">
          {bars.map((bar, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5" title={bar.title}>
              <div
                className={`w-7 sm:w-8 ${bar.color} rounded-t-lg transition-all duration-500 ease-out`}
                style={{ height: `${bar.heightPx}px` }}
              />
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400">
                {formatBarLabel(bar.label)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default PauseRegistryWidget
