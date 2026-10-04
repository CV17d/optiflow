import React from 'react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

export interface TelemetryWidgetProps {
  activeApp?: string
  roleDescription?: string
}

export const TelemetryWidget: React.FC<TelemetryWidgetProps> = ({
  activeApp = 'VS Code',
  roleDescription = 'Editor Principal'
}) => {
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

      {/* Contenido Principal: Aplicación Activa */}
      <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Icono de VS Code */}
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-sky-600 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M17.5 2.5L7.8 11.2 4 8.5 2 9.8l3.3 2.8L2 15.4l2 1.3 3.8-2.7 9.7 8.7 4.5-2.2V4.7l-4.5-2.2zm0 4.1v12.2l-7.7-6.1 7.7-6.1z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 leading-none">
              {activeApp}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">{roleDescription}</p>
          </div>
        </div>

        {/* Sparkline y Estado de Enfoque */}
        <div className="flex items-center gap-2.5">
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
              Enfoque Profundo
            </span>
          </div>
        </div>
      </div>

      {/* Lista Inferior: Otras aplicaciones en segundo plano */}
      <div className="flex items-center justify-between text-xs text-slate-600 pt-1 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
          <span>
            1. Chrome <span className="text-slate-400">(Fatiga Alta)</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
          <span>
            2. Word <span className="text-slate-400">(Fatiga Media)</span>
          </span>
        </div>
      </div>
    </Card>
  )
}

export default TelemetryWidget
