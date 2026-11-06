import React from 'react'
import Header from '../components/layout/Header'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export const CalibracionPrivacidad: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] text-gray-900 flex flex-col font-sans antialiased">
      <Header />
      <main className="flex-1 p-8 pt-2">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col select-none">
          {/* Encabezado de la Sección */}
          <div className="flex flex-col mb-6">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
              Calibración & Privacidad
            </h1>
            <p className="text-sm font-medium text-gray-500">
              Ajuste Biométrico Personalizado y Verificación de Procesamiento Local
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
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                        Calibración & Privacidad en Construcción...
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ajuste anatómico de EAR y auditoría Local-First
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning-text">EN DESARROLLO</Badge>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mt-4 max-w-2xl">
                  Personaliza los umbrales de apertura anatómica ocular (EAR), calibra la distancia de tu estación de trabajo y valida que todas las imágenes capturadas por tu cámara web sean procesadas en memoria volátil sin persistir imágenes ni enviarlas a internet.
                </p>
              </div>

              {/* Panel de Umbrales de Calibración */}
              <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Umbral de Parpadeo (EAR)
                    </span>
                    <span className="text-xs text-slate-400">
                      Umbral anatómico configurado para clasificar parpadeos y descanso
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200/60">
                    0.18 EAR
                  </span>
                </div>

                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Ventana Deslizante de Frecuencia (BPM)
                    </span>
                    <span className="text-xs text-slate-400">
                      Memoria temporal de parpadeos para amortiguar ráfagas transitorias
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200">
                    15.0 seg
                  </span>
                </div>
              </div>
            </Card>

            {/* Tarjeta Lateral de Privacidad Garantizada */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  Garantía de Privacidad
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Arquitectura 100% Local-First
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800">
                    <span className="font-bold block mb-1">✓ Inferencia On-Device</span>
                    MediaPipe corre localmente en tu CPU/GPU. No se envía telemetría biométrica a ningún servidor externo.
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <span className="font-bold block mb-1 text-slate-800">✓ Sin almacenamiento de imágenes</span>
                    Los fotogramas se leen únicamente en memoria RAM volátil para extraer las coordenadas matemáticas y se descartan inmediatamente.
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>Modo de red:</span>
                <span className="text-emerald-600 font-bold">Offline / Aire</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CalibracionPrivacidad
