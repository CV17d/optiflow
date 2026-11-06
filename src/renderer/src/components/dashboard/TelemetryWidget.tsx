import React from 'react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import type { AppUsageStat } from '../../hooks/useTelemetry'
import { getAppIcon } from '../../utils/appIcons'

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
    <Card className="p-4 flex flex-col justify-between gap-3 select-none">
      {/* Cabecera del Widget */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 text-slate-400">
            <svg
              className="w-4 h-4"
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
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
              Contexto de Software
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Telemetría de Apps</p>
          </div>
        </div>
        <Badge variant="warning-text">ACTIVA</Badge>
      </div>

      {/* Contenido Principal: Aplicación Activa y Estado del Sistema */}
      <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icono Real Inteligente de la Aplicación */}
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
            {getAppIcon(currentApp, 'w-5 h-5')}
          </div>
          <div className="min-w-0">
            <h4
              className="font-bold text-xs sm:text-sm text-slate-900 leading-none truncate"
              title={currentApp}
            >
              {currentApp}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              {currentStatus}
            </p>
          </div>
        </div>

        {/* Sparkline y Estado de Enfoque Dinámico */}
        <div className="flex items-center gap-2 shrink-0">
          <svg className="w-14 h-6 hidden sm:block" viewBox="0 0 64 24" fill="none">
            <path
              d="M2 18C12 18 16 22 24 16C32 10 38 18 46 8C52 2 58 10 62 6"
              stroke="#F97316"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="62" cy="6" r="2.5" fill="#F97316" />
          </svg>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-700 whitespace-nowrap">
              {currentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Lista Inferior: Estadísticas reales de apps desde SQLite vía IPC */}
      {secondaryApps.length > 0 ? (
        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5 px-0.5">
          {secondaryApps.map((item, index) => (
            <div key={item.app} className="flex items-center gap-1.5 min-w-0">
              <span className="shrink-0 flex items-center">
                {getAppIcon(item.app, 'w-3.5 h-3.5')}
              </span>
              <span className="truncate max-w-[120px]" title={item.app}>
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
