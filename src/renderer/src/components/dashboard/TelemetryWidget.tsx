import React from 'react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import type { AppUsageStat } from '../../hooks/useTelemetry'

export interface TelemetryWidgetProps {
  activeApp?: string
  appStatus?: string
  active_app?: string
  app_status?: string
  roleDescription?: string
  appUsageStats?: AppUsageStat[]
}

export const TelemetryWidget: React.FC<TelemetryWidgetProps> = ({
  activeApp,
  appStatus,
  active_app,
  app_status,
  roleDescription,
  appUsageStats
}) => {
  const currentApp = activeApp || active_app || 'Buscando...'
  const currentStatus = appStatus || app_status || roleDescription || 'Enfoque Profundo'

  const secondaryApps =
    appUsageStats && appUsageStats.length > 0
      ? (appUsageStats.filter((item) => item.app !== currentApp).length > 0
          ? appUsageStats.filter((item) => item.app !== currentApp)
          : appUsageStats
        ).slice(0, 2)
      : []

  return (
    <Card className="p-6 flex flex-col gap-4 select-none">
      {/* Cabecera del Widget */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 text-slate-400">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Contexto de Software
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Telemetría de Apps</p>
          </div>
        </div>
        <Badge variant="warning-text">ACTIVA</Badge>
      </div>

      {/* Contenido Principal: Aplicación Activa y Estado del Sistema */}
      <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Icono de Ventana del Sistema */}
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-orange-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div className="min-w-0">
            <h4
              className="font-bold text-sm text-slate-900 leading-none truncate"
              title={currentApp}
            >
              {currentApp}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {currentStatus}
            </p>
          </div>
        </div>

        {/* Sparkline y Estado de Enfoque Dinámico */}
        <div className="flex items-center gap-2.5 shrink-0">
          <svg className="w-16 h-7 hidden sm:block" viewBox="0 0 64 24" fill="none">
            <path
              d="M2 18C12 18 16 22 24 16C32 10 38 18 46 8C52 2 58 10 62 6"
              stroke="#F97316"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="62" cy="6" r="2.5" fill="#F97316" />
          </svg>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">
              {currentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Lista Inferior: Estadísticas reales de apps desde SQLite vía IPC */}
      {secondaryApps.length > 0 ? (
        <div className="flex items-center justify-between text-xs text-slate-600 pt-1 px-1">
          {secondaryApps.map((item, index) => (
            <div key={item.app} className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  index === 0 ? 'bg-orange-400' : 'bg-slate-300'
                }`}
              />
              <span className="truncate max-w-[130px]" title={item.app}>
                {index + 1}. {item.app}{' '}
                <span className="text-slate-400 font-medium">({item.percentage}%)</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  )
}

export default TelemetryWidget
