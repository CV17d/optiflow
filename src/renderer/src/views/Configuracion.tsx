import React from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export const Configuracion: React.FC = () => {
  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col select-none pb-12">
      {/* Encabezado de la Sección */}
          <div className="flex flex-col mb-6">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
              Configuración
            </h1>
            <p className="text-sm font-medium text-gray-500">
              Preferencias del Sistema, Modo Kiosco y Notificaciones Nativas
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
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                        Configuración en Construcción...
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Parámetros de ejecución, notificaciones e inicio automático
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning-text">EN DESARROLLO</Badge>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mt-4 max-w-2xl">
                  Ajusta la frecuencia de los ciclos de descanso, habilita o deshabilita el modo Kiosco obligatorio de pantalla completa y configura el inicio minimizado en la bandeja del sistema (System Tray).
                </p>
              </div>

              {/* Ajustes de Preferencias */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Modo Kiosco de Pausa Activa
                    </span>
                    <span className="text-xs text-slate-400">
                      Bloquea temporalmente el ordenador al cumplirse el ciclo 20-20-20
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                    Habilitado
                  </span>
                </div>

                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Notificaciones Nativas de Windows
                    </span>
                    <span className="text-xs text-slate-400">
                      Dispara alertas emergentes del sistema antes de iniciar la interrupción
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                    Habilitado
                  </span>
                </div>
              </div>
            </Card>

            {/* Tarjeta Lateral de Información del Software */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  Información de la Versión
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  OptiFlow Desktop v1.0.0
                </p>

                <div className="mt-5 flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400">Arquitectura:</span>
                    <span className="font-semibold text-slate-800">Electron + Python</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400">Base de Datos:</span>
                    <span className="font-semibold text-slate-800">SQLite (Local-First)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-400">Canal IPC:</span>
                    <span className="font-semibold text-emerald-600">Conectado</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-400">Telemetría Win32:</span>
                    <span className="font-semibold text-emerald-600">Activa</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>Estado general:</span>
                <span className="text-emerald-600 font-bold">Producción Local</span>
              </div>
            </Card>
          </div>
    </div>
  )
}

export default Configuracion
