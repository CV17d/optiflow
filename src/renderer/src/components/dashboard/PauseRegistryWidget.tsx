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
        { label: 'App 1', heightPx: 22, color: 'bg-slate-200/60', title: 'Sin registros' },
        { label: 'App 2', heightPx: 16, color: 'bg-slate-200/50', title: 'Sin registros' },
        { label: 'App 3', heightPx: 18, color: 'bg-slate-200/40', title: 'Sin registros' }
      ]
    }

    // Tomar exactamente el Top 3 de aplicaciones más usadas
    return appUsageStats.slice(0, 3).map((stat, idx) => {
      // Normalizar altura de barra entre 18px y 68px según el porcentaje de uso real
      const heightPx = Math.max(18, Math.min(68, Math.round((stat.percentage / 100) * 68)))
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
    <Card className="p-4 flex flex-col justify-between select-none">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
            Registro de Pausas & Contexto
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
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

      {/* Contenido: Métricas a la izquierda y Gráfico Dinámico de Barras con espaciado amplio */}
      <div className="flex items-end justify-between mt-2 gap-2">
        {/* Métricas Reactivas */}
        <div className="flex flex-col shrink-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            ADHERENCIA 20-20-20
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 font-mono">
            {adherence}
          </span>

          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2">
            POSPUESTAS
          </span>
          <span className="text-xs font-semibold text-slate-800 mt-0.5 font-mono">
            {postponed}
          </span>
        </div>

        {/* Gráfico de Barras con el Top 3 de Aplicaciones */}
        <div className="flex items-end justify-end gap-3 h-16 pb-0.5">
          {bars.map((bar, index) => {
            const shortLabel = formatBarLabel(bar.label)
            return (
              <div
                key={`${bar.label}-${index}`}
                className="flex flex-col items-center gap-1.5 w-7"
                title={bar.title}
              >
                <div
                  style={{ height: `${bar.heightPx}px` }}
                  className={`w-3.5 ${bar.color} rounded-t-sm transition-all duration-500 shadow-xs`}
                />
                <span
                  className="text-[9px] text-slate-400 font-medium text-center leading-none truncate max-w-full tracking-tight"
                  title={bar.label}
                >
                  {shortLabel}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

export default PauseRegistryWidget
