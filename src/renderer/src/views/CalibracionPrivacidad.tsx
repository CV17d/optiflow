import React, { useRef, useEffect, useMemo } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { useBiometrics } from '../hooks/useBiometrics'

// Topología anatómica canónica de MediaPipe Face Mesh (468 puntos)
const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
]

const LEFT_EYE = [
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362
]

const RIGHT_EYE = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33
]

const LEFT_EYEBROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46]
const RIGHT_EYEBROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276]
const NOSE_BRIDGE = [168, 6, 197, 195, 5, 4, 1, 19, 94, 2]
const LIPS_OUTER = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 61
]

export const CalibracionPrivacidad: React.FC = () => {
  const {
    biometrics,
    calibrationState,
    startCalibration,
    saveCalibration,
    resetCalibration,
    isConnected
  } = useBiometrics()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Determinar la fase actual del Stepper
  const currentStep = useMemo(() => {
    if (calibrationState.result) return 3
    if (calibrationState.isActive) return 2
    return 1
  }, [calibrationState.result, calibrationState.isActive])

  // Instrucción dinámica que cambia cada 4 segundos durante el escaneo de 15s
  const elapsed = 15 - calibrationState.remainingSeconds
  const activeInstruction = useMemo(() => {
    if (elapsed < 4) {
      return {
        text: 'Mire fijamente al centro de la pantalla...',
        phase: 'Fase 1 / 4 • Enfoque Central',
        tip: 'Mantén los ojos abiertos de forma natural'
      }
    } else if (elapsed < 8) {
      return {
        text: 'Gire el rostro levemente a la derecha...',
        phase: 'Fase 2 / 4 • Rango Angular Derecho',
        tip: 'Un giro suave de unos 15 grados es suficiente'
      }
    } else if (elapsed < 12) {
      return {
        text: 'Gire levemente a la izquierda...',
        phase: 'Fase 3 / 4 • Rango Angular Izquierdo',
        tip: 'Alinea los contornos anatómicos laterales'
      }
    } else {
      return {
        text: 'Parpadee con naturalidad...',
        phase: 'Fase 4 / 4 • Calibración de EAR Mínimo',
        tip: 'Registrando la oclusión palpebral completa'
      }
    }
  }, [elapsed])

  // Renderizado reactivo en el Canvas 2D
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const render = (): void => {
      const w = canvas.width
      const h = canvas.height

      // Fondo oscuro cyber-HUD
      ctx.fillStyle = '#060B14'
      ctx.fillRect(0, 0, w, h)

      // Rejilla HUD sutil
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)'
      ctx.lineWidth = 1
      const gridSize = 32
      ctx.beginPath()
      for (let x = 0; x < w; x += gridSize) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
      }
      ctx.stroke()

      // Cruz reticular central
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(w / 2 - 20, h / 2)
      ctx.lineTo(w / 2 + 20, h / 2)
      ctx.moveTo(w / 2, h / 2 - 20)
      ctx.lineTo(w / 2, h / 2 + 20)
      ctx.stroke()

      const mesh = calibrationState.faceMesh

      if (mesh && mesh.length > 0) {
        // Función auxiliar para trazar trayectorias continuas
        const drawContour = (indices: number[], color: string, lineWidth: number): void => {
          ctx.strokeStyle = color
          ctx.lineWidth = lineWidth
          ctx.shadowColor = color
          ctx.shadowBlur = 6
          ctx.beginPath()
          let started = false
          for (const idx of indices) {
            if (idx < mesh.length) {
              const [nx, ny] = mesh[idx]
              const px = (1 - nx) * w // Reflejo en espejo para naturalidad
              const py = ny * h
              if (!started) {
                ctx.moveTo(px, py)
                started = true
              } else {
                ctx.lineTo(px, py)
              }
            }
          }
          ctx.stroke()
          ctx.shadowBlur = 0
        }

        // Trazado de contornos anatómicos principales
        drawContour(FACE_OVAL, 'rgba(0, 240, 255, 0.45)', 1.2)
        drawContour(LEFT_EYE, '#00F0FF', 2.0)
        drawContour(RIGHT_EYE, '#00F0FF', 2.0)
        drawContour(LEFT_EYEBROW, 'rgba(0, 240, 255, 0.6)', 1.2)
        drawContour(RIGHT_EYEBROW, 'rgba(0, 240, 255, 0.6)', 1.2)
        drawContour(NOSE_BRIDGE, 'rgba(0, 240, 255, 0.5)', 1.2)
        drawContour(LIPS_OUTER, 'rgba(0, 240, 255, 0.55)', 1.2)

        // Puntos de la malla facial (468 nodos brillantes)
        ctx.fillStyle = '#22D3EE'
        ctx.shadowColor = '#00F0FF'
        ctx.shadowBlur = 3
        for (let i = 0; i < mesh.length; i += 1) {
          const [nx, ny] = mesh[i]
          const px = (1 - nx) * w
          const py = ny * h
          ctx.beginPath()
          ctx.arc(px, py, 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.shadowBlur = 0
      } else {
        // Guía de encuadre en modo de espera
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([8, 8])
        ctx.beginPath()
        ctx.ellipse(w / 2, h / 2, w * 0.2, h * 0.32, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        // Texto informativo en Canvas
        ctx.fillStyle = 'rgba(0, 240, 255, 0.7)'
        ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.textAlign = 'center'
        ctx.fillText('POSICIONE SU ROSTRO EN EL CENTRO PARA EL ESCANEO', w / 2, h / 2 + 10)
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [calibrationState.faceMesh])

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col select-none pb-12">
      {/* Encabezado Principal */}
          <div className="flex flex-col mb-6">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
              Calibración Anatómica & Privacidad
            </h1>
            <p className="text-sm font-medium text-gray-500">
              Ajuste Personalizado de Umbral Ocular (EAR) con Malla Facial en Tiempo Real (MediaPipe 468 Pts)
            </p>
          </div>

          {/* Stepper de Progreso Superior */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`rounded-2xl p-4 border transition-all duration-300 flex items-center gap-3.5 ${
                currentStep === 1
                  ? 'bg-white border-orange-500/50 shadow-md shadow-orange-500/5 ring-1 ring-orange-500/20'
                  : currentStep > 1
                    ? 'bg-white/80 border-emerald-400 text-slate-700'
                    : 'bg-white/50 border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  currentStep === 1
                    ? 'bg-orange-500 text-white'
                    : currentStep > 1
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fase 1
                </span>
                <span className="text-sm font-bold text-slate-800">
                  Standby y Preparación
                </span>
              </div>
            </div>

            <div
              className={`rounded-2xl p-4 border transition-all duration-300 flex items-center gap-3.5 ${
                currentStep === 2
                  ? 'bg-white border-cyan-500/60 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : currentStep > 2
                    ? 'bg-white/80 border-emerald-400 text-slate-700'
                    : 'bg-white/50 border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  currentStep === 2
                    ? 'bg-cyan-500 text-white animate-pulse'
                    : currentStep > 2
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fase 2
                </span>
                <span className="text-sm font-bold text-slate-800">
                  Escaneo Facial Activo (15s)
                </span>
              </div>
            </div>

            <div
              className={`rounded-2xl p-4 border transition-all duration-300 flex items-center gap-3.5 ${
                currentStep === 3
                  ? 'bg-white border-orange-500/60 shadow-md shadow-orange-500/10 ring-1 ring-orange-500/20'
                  : 'bg-white/50 border-slate-200 opacity-60'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  currentStep === 3
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                3
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fase 3
                </span>
                <span className="text-sm font-bold text-slate-800">
                  Umbral & Guardado
                </span>
              </div>
            </div>
          </div>

          {/* Grilla Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda: Escáner Canvas y Controles (Col-Span 2) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Contenedor Visual del Escáner Biométrico (Canvas HUD) */}
              <div className="bg-[#060B14] rounded-3xl border border-cyan-500/30 overflow-hidden relative shadow-2xl flex flex-col">
                {/* Barra de Estado Superior del HUD */}
                <div className="h-11 px-5 bg-slate-900/80 border-b border-cyan-500/20 flex items-center justify-between text-xs font-mono select-none">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                    <span className="font-bold tracking-wider">OPTIFLOW BIOMETRIC HUD</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">468 FACIAL MESH LANDMARKS</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-400">
                      EAR LIVE:{' '}
                      <span className="text-cyan-300 font-bold">
                        {calibrationState.isActive
                          ? calibrationState.currentEar.toFixed(3)
                          : biometrics.ear.toFixed(2)}
                      </span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        calibrationState.isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {calibrationState.isActive ? 'SCANNING' : 'STANDBY'}
                    </span>
                  </div>
                </div>

                {/* Área de Renderizado Canvas */}
                <div className="relative w-full aspect-[16/10] max-h-[460px] overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={400}
                    className="w-full h-full object-contain"
                  />

                  {/* Rejilla de Fondo Sci-Fi */}
                  <div className="absolute inset-0 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

                  {/* Esquinas Reticulares HUD */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none" />

                  {/* Animación Láser de Escaneo (Scanline) */}
                  {calibrationState.isActive && (
                    <div
                      className="absolute left-0 right-0 pointer-events-none z-10 flex flex-col"
                      style={{
                        animation: 'scanlineMove 3s ease-in-out infinite',
                        height: '2px',
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(0, 240, 255, 0.4) 15%, #00F0FF 50%, rgba(0, 240, 255, 0.4) 85%, transparent 100%)',
                        boxShadow:
                          '0 0 16px 3px rgba(0, 240, 255, 0.8), 0 0 32px 8px rgba(0, 240, 255, 0.4)'
                      }}
                    >
                      <div className="w-full h-20 -mt-10 bg-gradient-to-b from-cyan-500/10 via-cyan-400/20 to-transparent pointer-events-none" />
                    </div>
                  )}

                  {/* Banner de Instrucciones Dinámicas en Escaneo */}
                  {calibrationState.isActive && (
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 flex items-center justify-between text-white shadow-xl">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                          <svg
                            className="w-5 h-5 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                            {activeInstruction.phase}
                          </span>
                          <p className="text-base font-bold text-white leading-tight">
                            {activeInstruction.text}
                          </p>
                          <span className="text-xs text-slate-400">
                            {activeInstruction.tip}
                          </span>
                        </div>
                      </div>

                      {/* Contador Regresivo */}
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-mono font-bold text-cyan-300">
                          {calibrationState.remainingSeconds.toFixed(1)}s
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Restante
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Barra de Progreso Inferior del Escaneo */}
                {calibrationState.isActive && (
                  <div className="w-full h-2 bg-slate-900 border-t border-cyan-500/20 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-150"
                      style={{ width: `${calibrationState.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Panel de Controles y Acciones según la Fase */}
              <Card className="p-6">
                {currentStep === 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col gap-1 max-w-xl">
                      <h3 className="text-lg font-bold text-slate-900">
                        Iniciar Calibración Biomecánica
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Durante 15 segundos el motor registrará los valores extremos de tu Eye Aspect Ratio (ojos abiertos vs. parpadeos completos) para calcular el punto óptimo de corte anatómico.
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-medium">
                          Umbral Activo Actual:
                        </span>
                        <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                          {biometrics.ear_threshold.toFixed(2)} EAR
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={startCalibration}
                      disabled={!isConnected}
                      className="shrink-0 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition-all duration-200 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>Iniciar Escaneo Facial</span>
                    </button>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Escaneo Biométrico en Progreso
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sigue las indicaciones en pantalla. El sistema adaptará los coeficientes al finalizar.
                      </p>
                    </div>
                    <button
                      onClick={resetCalibration}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {currentStep === 3 && calibrationState.result && (
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <h3 className="text-lg font-bold text-slate-900">
                            Calibración Completada Exitosamente
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Se calcularon los límites anatómicos de tu apertura ocular a partir de las coordenadas MediaPipe.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={startCalibration}
                          className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Repetir Escaneo
                        </button>
                        <button
                          onClick={() => saveCalibration(calibrationState.result!.threshold)}
                          disabled={calibrationState.isSaved}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-80"
                        >
                          {calibrationState.isSaved ? (
                            <>
                              <span>✓ Guardado en Perfil</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                              </svg>
                              <span>Guardar Perfil Biométrico</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Resumen Métrico del Resultado */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 flex flex-col">
                        <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">
                          Nuevo Umbral Ocular
                        </span>
                        <span className="text-3xl font-mono font-bold text-orange-600 my-1">
                          {calibrationState.result.threshold.toFixed(3)}
                        </span>
                        <span className="text-[11px] text-orange-600/80">
                          Punto de corte EAR personalizado
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          EAR Mínimo (Ojos Cerrados)
                        </span>
                        <span className="text-3xl font-mono font-bold text-slate-800 my-1">
                          {calibrationState.result.minEar.toFixed(3)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Oclusión palpebral registrada
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          EAR Máximo (Ojos Abiertos)
                        </span>
                        <span className="text-3xl font-mono font-bold text-slate-800 my-1">
                          {calibrationState.result.maxEar.toFixed(3)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Apertura natural máxima
                        </span>
                      </div>
                    </div>

                    {/* Mensaje de Confirmación */}
                    {calibrationState.isSaved && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                          ✓
                        </div>
                        <div>
                          <span className="font-bold block text-emerald-900">
                            Perfil Anatómico Guardado y Aplicado
                          </span>
                          OptiFlow ha reconfigurado su heurística matemática. A partir de ahora, la tasa de parpadeos y la fatiga ocular responderán a tu fisonomía personalizada.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Columna Derecha: Auditoría de Privacidad y Parámetros Técnicos */}
            <div className="flex flex-col gap-6">
              <Card className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base text-slate-900 leading-tight">
                      Garantía de Privacidad
                    </h3>
                    <Badge variant="success-outline">LOCAL-FIRST</Badge>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-5">
                    OptiFlow garantiza que ningún fotograma, captura o video sale jamás de tu equipo.
                  </p>

                  <div className="flex flex-col gap-3.5">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900">
                      <span className="font-bold block mb-1">
                        ✓ Inferencia On-Device (CPU/GPU)
                      </span>
                      MediaPipe Face Mesh procesa los 468 puntos biométricos de forma aislada en tu procesador local.
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <span className="font-bold block mb-1 text-slate-900">
                        ✓ Sin Almacenamiento de Video
                      </span>
                      Los frames se analizan en memoria RAM volátil para calcular los vectores geométricos e inmediatamente se sobreescriben.
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <span className="font-bold block mb-1 text-slate-900">
                        ✓ Cifrado de Configuración Local
                      </span>
                      Los umbrales anatómicos calculados se conservan exclusivamente en tu archivo local{' '}
                      <code className="font-mono text-[11px] bg-slate-200/60 px-1 py-0.5 rounded">
                        calibration_config.json
                      </code>
                      .
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span>Modo de red del motor:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Offline Estricto
                  </span>
                </div>
              </Card>

              {/* Tarjeta de Fundamento Técnico del EAR */}
              <Card className="p-6">
                <h3 className="font-bold text-base text-slate-900 leading-tight mb-2">
                  Fundamento Matemático
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  El Eye Aspect Ratio (EAR) evalúa la relación entre distancias verticales y horizontales de los párpados:
                </p>

                <div className="bg-slate-900 text-cyan-400 font-mono text-xs p-3.5 rounded-xl border border-slate-800 text-center select-all">
                  EAR = (||p2 - p6|| + ||p3 - p5||) / (2 · ||p1 - p4||)
                </div>

                <div className="mt-4 flex flex-col gap-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Ojo abierto (reposo):</span>
                    <span className="font-mono font-bold text-emerald-600">&gt; 0.20 EAR</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Parpadeo voluntario:</span>
                    <span className="font-mono font-bold text-orange-600">&lt; {biometrics.ear_threshold.toFixed(2)} EAR</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ventana de amortiguación:</span>
                    <span className="font-mono font-bold text-slate-700">15 segundos</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

      {/* Keyframes de la animación de Scanline */}
      <style>{`
        @keyframes scanlineMove {
          0% {
            top: 4%;
            opacity: 0.85;
          }
          50% {
            top: 92%;
            opacity: 1;
          }
          100% {
            top: 4%;
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  )
}

export default CalibracionPrivacidad
