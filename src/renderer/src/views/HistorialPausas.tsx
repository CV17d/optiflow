import React from 'react'
import Header from '../components/layout/Header'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export const HistorialPausas: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] text-gray-900 flex flex-col font-sans antialiased">
      <Header />
      <main className="flex-1 p-8 pt-2">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col select-none">
          {/* Encabezado de la Sección */}
          <div className="flex flex-col mb-6">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
              Historial y Pausas
            </h1>
            <p className="text-sm font-medium text-gray-500">
              Registro Cronológico, Adherencia y Auditoría de Descanso
            </p>
          </div>

          {/* Tarjeta Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-8 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                      <svg
                        className="w-5 h-5"
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
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                        Historial y Pausas en Construcción...
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Persistencia de eventos y tendencias ergonómicas
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning-text">EN DESARROLLO</Badge>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mt-4 max-w-2xl">
                  En esta vista podrás examinar el cumplimiento de la regla 20-20-20 a lo largo del tiempo, contrastar pausas ejecutadas contra pausas pospuestas y exportar reportes detallados de bienestar ocupacional almacenados de forma privada en SQLite.
                </p>
              </div>

              {/* Métricas Resumen */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    PAUSAS HOY
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
                    8 / 9
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                    +88.8% Adherencia
                  </span>
                </div>

                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    TIEMPO DESCANSADO
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
                    180 seg
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 inline-block">
                    Micro-descansos oculares
                  </span>
                </div>

                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    PAUSAS POSPUESTAS
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
                    1
                  </span>
                  <span className="text-[11px] text-amber-600 font-semibold mt-1 inline-block">
                    Modo Emergencia
                  </span>
                </div>
              </div>
            </Card>

            {/* Tarjeta Lateral de Registro de Sesiones */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  Registro Reciente de Sesiones
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Eventos almacenados en SQLite
                </p>

                <div className="mt-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800 block">Pausa Activa (20s)</span>
                      <span className="text-[10px] text-slate-400">Completada con éxito</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600 font-bold">18:20</span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800 block">Pausa Activa (20s)</span>
                      <span className="text-[10px] text-slate-400">Completada con éxito</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600 font-bold">18:00</span>
                  </div>

                  <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800 block">Pausa Pospuesta</span>
                      <span className="text-[10px] text-slate-400">+2 min (Emergencia)</span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-600 font-bold">17:40</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>Almacenamiento:</span>
                <span className="text-slate-700 font-bold">optiflow_local.db</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HistorialPausas
