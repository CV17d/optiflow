import React from 'react'
import Header from '../components/layout/Header'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export const AnalisisErgonomico: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] text-gray-900 flex flex-col font-sans antialiased">
      <Header />
      <main className="flex-1 p-8 pt-2">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col select-none">
          {/* Encabezado de la Sección */}
          <div className="flex flex-col mb-6">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
              Análisis Ergonómico
            </h1>
            <p className="text-sm font-medium text-gray-500">
              Evaluación de Postura, Distancia y Fatiga Visual Acumulada
            </p>
          </div>

          {/* Tarjeta Principal de Estado */}
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
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                        Análisis Ergonómico en Construcción...
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Módulo de telemetría postural y fatiga acumulativa
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning-text">EN DESARROLLO</Badge>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mt-4 max-w-2xl">
                  Este módulo integrará la estimación tridimensional de distancia hacia el monitor, el cálculo del ángulo de inclinación cervical y el diagnóstico de fatiga visual prolongada para mitigar el síndrome de visión por computadora (CVS).
                </p>
              </div>

              {/* Grid de Métricas Previstas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    DISTANCIA ÓPTIMA
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
                    50 - 70 cm
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                    ✓ Rango Saludable
                  </span>
                </div>

                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    INCLINACIÓN CERVICAL
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
                    12° - 15°
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 inline-block">
                    Objetivo ergonómico
                  </span>
                </div>

                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    SIMETRÍA FACIAL
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
                    98.2%
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                    ✓ Alineación frontal
                  </span>
                </div>
              </div>
            </Card>

            {/* Tarjeta Lateral de Recomendaciones */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-tight">
                  Recomendaciones Ergonómicas
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Directrices ISO 9241-5
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-100/70">
                    <span className="text-xs font-bold text-orange-700 block">
                      1. Nivel del borde superior
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      El borde superior de tu pantalla debe coincidir con la altura horizontal de tus ojos.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-bold text-slate-700 block">
                      2. Iluminación ambiental
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Evita reflejos de ventanas frontales o traseras directamente hacia la superficie del panel.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>Estado del Motor:</span>
                <span className="text-emerald-600 font-bold">Activo • MediaPipe 3D</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AnalisisErgonomico
