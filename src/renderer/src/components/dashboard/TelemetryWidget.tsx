import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AppWindow } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import type { AppUsageStat } from '../../hooks/useTelemetry'

export interface TelemetryWidgetProps {
  activeApp?: string
  appStatus?: string
  active_app?: string
  app_status?: string
  roleDescription?: string
  appIconBase64?: string
  activeAppPath?: string
  appUsageStats?: AppUsageStat[]
}

export const TelemetryWidget: React.FC<TelemetryWidgetProps> = ({
  activeApp,
  appStatus,
  active_app,
  app_status,
  roleDescription,
  appIconBase64,
  activeAppPath,
  appUsageStats
}) => {
  const { t } = useTranslation()
  const [iconData, setIconData] = useState<string | null>(appIconBase64 || null)

  const currentApp = activeApp || active_app || t('dashboard.telemetry.searching', 'Buscando...')
  const currentStatus =
    appStatus || app_status || roleDescription || t('dashboard.telemetry.deepFocus', 'Enfoque Profundo')

  // Escuchar cambios en la ruta de la app activa para extraer el icono nativo vía IPC con fallback
  useEffect(() => {
    let isMounted = true

    const fetchIcon = async (): Promise<void> => {
      const target = activeAppPath || activeApp || active_app

      if (!target) {
        if (isMounted) setIconData(appIconBase64 || null)
        return
      }

      try {
        let result: string | null = null
        if (window.api?.invoke) {
          result = (await window.api.invoke('get-app-icon', target)) as string | null
        } else if (window.api?.getAppIcon) {
          result = await window.api.getAppIcon(target)
        } else if (window.electron?.getAppIcon) {
          result = await window.electron.getAppIcon(target)
        } else if (window.electron?.ipcRenderer?.invoke) {
          result = (await window.electron.ipcRenderer.invoke('get-app-icon', target)) as string | null
        }

        if (isMounted) {
          setIconData(result || appIconBase64 || null)
        }
      } catch {
        if (isMounted) {
          setIconData(appIconBase64 || null)
        }
      }
    }

    fetchIcon()

    return () => {
      isMounted = false
    }
  }, [activeAppPath, activeApp, active_app, appIconBase64])

  const secondaryApps =
    appUsageStats && appUsageStats.length > 0
      ? (appUsageStats.filter((item) => item.app !== currentApp).length > 0
          ? appUsageStats.filter((item) => item.app !== currentApp)
          : appUsageStats
        ).slice(0, 2)
      : []

  return (
    <Card className="p-5 flex flex-col justify-between gap-3.5 select-none">
      {/* Cabecera del Widget */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-slate-400 dark:text-zinc-400">
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
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
              {t('dashboard.telemetry.title', 'Contexto de Software')}
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5">
              {t('dashboard.telemetry.subtitle', 'Telemetría de Apps')}
            </p>
          </div>
        </div>
        <Badge variant="warning-text" className="text-xs font-bold">
          {t('dashboard.telemetry.badgeActive', 'ACTIVA')}
        </Badge>
      </div>

      {/* Contenido Principal: Aplicación Activa y Estado del Sistema */}
      <div className="bg-slate-50/80 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 rounded-2xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Icono Nativo del Sistema Operativo con fallback elegante SVG */}
          <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 shadow-xs flex items-center justify-center shrink-0 overflow-hidden p-0.5">
            {iconData ? (
              <img
                src={iconData}
                alt="App Icon"
                className="w-8 h-8 object-contain rounded-md"
              />
            ) : (
              <AppWindow className="w-6 h-6 text-orange-500 dark:text-orange-400" />
            )}
          </div>
          <div className="min-w-0">
            <h4
              className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight truncate"
              title={currentApp}
            >
              {currentApp}
            </h4>
            <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5 truncate">
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
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="62" cy="6" r="2.5" fill="#F97316" />
          </svg>
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              {currentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Lista Inferior: Estadísticas reales de apps desde SQLite vía IPC */}
      {secondaryApps.length > 0 ? (
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300 pt-0.5 px-0.5">
          {secondaryApps.map((item, index) => (
            <div key={item.app} className="flex items-center gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  index === 0 ? 'bg-orange-500' : 'bg-slate-300 dark:bg-zinc-600'
                }`}
              />
              <span className="truncate max-w-[140px]" title={item.app}>
                {index + 1}. {item.app}{' '}
                <span className="text-slate-400 dark:text-zinc-400 font-medium">({item.percentage}%)</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-400 dark:text-zinc-500 italic pt-0.5 px-0.5">
          {t('dashboard.telemetry.waitingTelemetry', 'Esperando telemetría de ventanas activas...')}
        </div>
      )}
    </Card>
  )
}

export default TelemetryWidget
