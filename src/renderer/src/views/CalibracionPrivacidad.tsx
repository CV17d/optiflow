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
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Carga reactiva de los fotogramas JPEG Base64 provenientes del motor de visión
  useEffect(() => {
    if (!imageRef.current) {
      imageRef.current = new Image()
    }
    if (calibrationState.imageB64) {
      imageRef.current.src = `data:image/jpeg;base64,${calibrationState.imageB64}`
    }
  }, [calibrationState.imageB64])

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
        text: 'Mire fijamente al centro del óvalo...',
        phase: 'Fase 1 / 4 • Enfoque Central',
        tip: 'Mantén los ojos abiertos de forma relajada y natural'
      }
    } else if (elapsed < 8) {
      return {
        text: 'Gire el rostro levemente a la derecha...',
        phase: 'Fase 2 / 4 • Calibración Angular Derecha',
        tip: 'Un giro suave de unos 15° para capturar el perfil'
      }
    } else if (elapsed < 12) {
      return {
        text: 'Gire levemente a la izquierda...',
        phase: 'Fase 3 / 4 • Calibración Angular Izquierda',
        tip: 'Alinea los contornos anatómicos laterales'
      }
    } else {
      return {
        text: 'Parpadee con naturalidad...',
        phase: 'Fase 4 / 4 • Registro de Oclusión (EAR Mínimo)',
        tip: 'Detectando la contracción palpebral máxima'
      }
    }
  }, [elapsed])

  // Renderizado dinámico continuo sobre el Canvas 2D
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const render = (): void => {
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      // 1. Dibujar el feed de video real proveniente de la cámara (si existe)
      if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
        ctx.drawImage(imageRef.current, 0, 0, w, h)
        // Capa translúcida cálida para integrar el video con la estética naranja
        ctx.fillStyle = 'rgba(28, 14, 5, 0.18)'
        ctx.fillRect(0, 0, w, h)
      } else {
        // Fondo degradado carbón-ámbar cálido en modo de espera
        const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.45)
        bgGrad.addColorStop(0, '#261408')
        bgGrad.addColorStop(1, '#0F0804')
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, w, h)
      }

      // Rejilla HUD sutil en tonos naranja cálido
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.08)'
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

      // Cruz reticular central en tono naranja
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(w / 2 - 20, h / 2)
      ctx.lineTo(w / 2 + 20, h / 2)
      ctx.moveTo(w / 2, h / 2 - 20)
      ctx.lineTo(w / 2, h / 2 + 20)
      ctx.stroke()

      const mesh = calibrationState.faceMesh

      if (mesh && mesh.length > 0) {
        // 2. Conexiones anatómicas principales de MediaPipe en naranja OptiFlow
        const drawContour = (indices: number[], color: string, lineWidth: number): void => {
          ctx.strokeStyle = color
          ctx.lineWidth = lineWidth
          ctx.shadowColor = '#FF8A00'
          ctx.shadowBlur = 8
          ctx.beginPath()
          let started = false
          for (const idx of indices) {
            if (idx < mesh.length) {
              const [nx, ny] = mesh[idx]
              // Coordenada horizontal espejada (1 - nx) para coincidir con el fotograma espejado
              const px = (1 - nx) * w
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

        // Trazado de contornos en paleta naranja estricta
        drawContour(FACE_OVAL, 'rgba(249, 115, 22, 0.65)', 1.6)
        drawContour(LEFT_EYE, '#F97316', 2.2)
        drawContour(RIGHT_EYE, '#F97316', 2.2)
        drawContour(LEFT_EYEBROW, 'rgba(251, 146, 60, 0.85)', 1.5)
        drawContour(RIGHT_EYEBROW, 'rgba(251, 146, 60, 0.85)', 1.5)
        drawContour(NOSE_BRIDGE, 'rgba(251, 146, 60, 0.75)', 1.5)
        drawContour(LIPS_OUTER, 'rgba(249, 115, 22, 0.8)', 1.6)

        // 3. Puntos de la malla facial (468 nodos brillantes en naranja)
        ctx.fillStyle = '#EA580C'
        ctx.shadowColor = '#FF8A00'
        ctx.shadowBlur = 5
        for (let i = 0; i < mesh.length; i += 1) {
          const [nx, ny] = mesh[i]
          const px = (1 - nx) * w
          const py = ny * h
          ctx.beginPath()
          ctx.arc(px, py, 1.25, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.shadowBlur = 0
      } else {
        // Guía de encuadre ovalada en reposo con resplandor naranja
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)'
        ctx.lineWidth = 1.8
        ctx.setLineDash([8, 8])
        ctx.beginPath()
        ctx.ellipse(w / 2, h / 2, w * 0.22, h * 0.35, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = 'rgba(251, 146, 60, 0.9)'
        ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace'
        ctx.textAlign = 'center'
        ctx.fillText('ALINEA TU ROSTRO CON EL ÓVALO', w / 2, h / 2 + 10)
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [calibrationState.faceMesh])

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center justify-center select-none pb-16">
      {/* Encabezado Principal Centrado */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-bold mb-3 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping inline-block" />
          <span>ESCÁNER ANATÓMICO 3D</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Calibración Ocular & Privacidad
        </h1>
        <p className="text-sm font-medium text-slate-500 max-w-xl">
          Ajuste anatómico de Eye Aspect Ratio (EAR) sobre tu feed de video en tiempo real, procesado 100% de manera local.
        </p>
      </div>

      {/* Stepper de Fases en Paleta Naranja */}
      <div className="w-full max-w-[780px] mb-6 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div
          className={`rounded-2xl p-3.5 border transition-all duration-300 flex items-center gap-3 ${
            currentStep === 1
              ? 'bg-white border-orange-500/70 shadow-md shadow-orange-500/10 ring-1 ring-orange-500/20'
              : currentStep > 1
                ? 'bg-orange-50/70 border-orange-300 text-slate-800'
                : 'bg-white/60 border-slate-200 opacity-60'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
              currentStep === 1
                ? 'bg-orange-500 text-white'
                : currentStep > 1
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-400'
            }`}
          >
            {currentStep > 1 ? '✓' : '1'}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
              Fase 1
            </span>
            <span className="text-xs font-bold text-slate-800">
              Standby & Guía
            </span>
          </div>
        </div>

        <div
          className={`rounded-2xl p-3.5 border transition-all duration-300 flex items-center gap-3 ${
            currentStep === 2
              ? 'bg-white border-orange-500 shadow-lg shadow-orange-500/15 ring-2 ring-orange-500/30'
              : currentStep > 2
                ? 'bg-orange-50/70 border-orange-300 text-slate-800'
                : 'bg-white/60 border-slate-200 opacity-60'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
              currentStep === 2
                ? 'bg-orange-500 text-white animate-pulse'
                : currentStep > 2
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-400'
            }`}
          >
            {currentStep > 2 ? '✓' : '2'}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
              Fase 2
            </span>
            <span className="text-xs font-bold text-slate-800">
              Escaneo Facial (15s)
            </span>
          </div>
        </div>

        <div
          className={`rounded-2xl p-3.5 border transition-all duration-300 flex items-center gap-3 ${
            currentStep === 3
              ? 'bg-white border-orange-500 shadow-md shadow-orange-500/10 ring-1 ring-orange-500/20'
              : 'bg-white/60 border-slate-200 opacity-60'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
              currentStep === 3
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            3
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
              Fase 3
            </span>
            <span className="text-xs font-bold text-slate-800">
              Umbral & Guardado
            </span>
          </div>
        </div>
      </div>

      {/* ÁREA CENTRAL PROTAGONISTA: ESCÁNER OVALADO CON BORDES DIFUMINADOS */}
      <div className="w-full flex flex-col items-center justify-center relative my-4">
        {/* Resplandor ambiental de fondo naranja */}
        <div className="absolute w-[440px] h-[560px] bg-gradient-to-tr from-orange-500/20 via-orange-400/25 to-amber-500/15 rounded-[50%] blur-3xl pointer-events-none" />

        {/* Anillo exterior decorativo de órbita HUD */}
        <div className="w-[430px] h-[550px] sm:w-[460px] sm:h-[590px] rounded-[50%] border-2 border-dashed border-orange-400/40 pointer-events-none absolute flex items-center justify-center">
          {/* Marcadores de retícula en los 4 polos */}
          <div className="absolute top-0 w-3 h-1 bg-orange-500 rounded-full" />
          <div className="absolute bottom-0 w-3 h-1 bg-orange-500 rounded-full" />
          <div className="absolute left-0 w-1 h-3 bg-orange-500 rounded-full" />
          <div className="absolute right-0 w-1 h-3 bg-orange-500 rounded-full" />
        </div>

        {/* CONTENEDOR OVALADO CON MÁSCARA DIFUMINADA */}
        <div
          className="relative w-[400px] h-[520px] sm:w-[430px] sm:h-[560px] overflow-hidden flex items-center justify-center"
          style={{
            maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, black 50%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, black 50%, transparent 100%)'
          }}
        >
          {/* Canvas con el feed de video y la malla MediaPipe renderizada encima */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full h-full object-cover"
          />

          {/* Animación Láser de Escaneo (Scanline) Naranja */}
          {calibrationState.isActive && (
            <div
              className="absolute left-0 right-0 pointer-events-none z-10 flex flex-col items-center"
              style={{
                animation: 'scanlineMove 2.8s ease-in-out infinite',
                height: '3px',
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.3) 15%, #F97316 50%, rgba(249, 115, 22, 0.3) 85%, transparent 100%)',
                boxShadow:
                  '0 0 18px 4px rgba(249, 115, 22, 0.95), 0 0 36px 8px rgba(234, 88, 12, 0.5)'
              }}
            >
              <div className="w-full h-24 -mt-12 bg-gradient-to-b from-orange-500/15 via-orange-500/25 to-transparent pointer-events-none" />
            </div>
          )}

          {/* Banner Flotante de Instrucción Dinámica en Escaneo Activo */}
          {calibrationState.isActive && (
            <div className="absolute bottom-6 left-6 right-6 bg-slate-950/85 backdrop-blur-md border border-orange-500/60 rounded-2xl p-4 flex items-center justify-between text-white shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/25 border border-orange-400/60 flex items-center justify-center text-orange-400 shrink-0">
                  <svg
                    className="w-5 h-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold block">
                    {activeInstruction.phase}
                  </span>
                  <p className="text-sm font-bold text-white leading-tight">
                    {activeInstruction.text}
                  </p>
                  <span className="text-[11px] text-slate-300">
                    {activeInstruction.tip}
                  </span>
                </div>
              </div>

              {/* Contador Regresivo */}
              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="text-2xl font-mono font-bold text-orange-400">
                  {calibrationState.remainingSeconds.toFixed(1)}s
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                  Restante
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Píldora de Telemetría Flotante Superior */}
        <div className="absolute top-2 bg-slate-950/80 backdrop-blur-md border border-orange-500/40 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-lg select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-orange-400 tracking-wider">
              OPTIFLOW HUD
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-slate-300">
            EAR LIVE:{' '}
            <span className="text-orange-400 font-bold">
              {calibrationState.isActive
                ? calibrationState.currentEar.toFixed(3)
                : biometrics.ear.toFixed(2)}
            </span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-orange-300 font-semibold">
            {calibrationState.isActive ? '468 PUNTOS ACTIVOS' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Barra de Progreso Naranja durante el Escaneo */}
      {calibrationState.isActive && (
        <div className="w-full max-w-[440px] h-2.5 bg-slate-200 rounded-full overflow-hidden mb-6 border border-orange-200">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-150 rounded-full shadow-sm shadow-orange-500/40"
            style={{ width: `${calibrationState.progress}%` }}
          />
        </div>
      )}

      {/* PANEL DE ACCIONES Y CONTROLES CENTRADOS */}
      <div className="w-full max-w-[780px] flex flex-col gap-5 mt-2">
        <Card className="p-6 border-orange-100 shadow-md shadow-orange-500/5">
          {currentStep === 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-slate-900">
                  Calibración Anatómica Ocular
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
                  Durante 15 segundos el motor registrará los valores extremos de tu apertura palpebral (ojos abiertos vs. parpadeos completos) para sintonizar el umbral de fatiga y descanso con tu fisonomía ocular.
                </p>
                <div className="mt-2 flex items-center justify-center sm:justify-start gap-3">
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
                className="shrink-0 px-8 py-4 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-sm tracking-wide">Iniciar Escaneo Facial</span>
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
                  Mantén tu rostro encuadrado dentro del óvalo difuminado y sigue las instrucciones.
                </p>
              </div>
              <button
                onClick={resetCalibration}
                className="px-4 py-2 border border-orange-200 hover:bg-orange-50 text-orange-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}

          {currentStep === 3 && calibrationState.result && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-orange-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Calibración Completada Exitosamente
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Se calcularon los límites anatómicos de tu apertura ocular a partir de los 468 puntos de MediaPipe.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={startCalibration}
                    className="px-4 py-2.5 border border-orange-200 hover:bg-orange-50 text-orange-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Repetir Escaneo
                  </button>
                  <button
                    onClick={() => saveCalibration(calibrationState.result!.threshold)}
                    disabled={calibrationState.isSaved}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-90"
                  >
                    {calibrationState.isSaved ? (
                      <span>✓ Guardado en Perfil</span>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
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

              {/* Tarjetas Métricas del Resultado en Naranja */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-4 flex flex-col">
                  <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">
                    Nuevo Umbral Ocular
                  </span>
                  <span className="text-3xl font-mono font-bold text-orange-600 my-1">
                    {calibrationState.result.threshold.toFixed(3)}
                  </span>
                  <span className="text-[11px] text-orange-700/80">
                    Punto de corte personalizado
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    EAR Mínimo (Ojos Cerrados)
                  </span>
                  <span className="text-3xl font-mono font-bold text-slate-800 my-1">
                    {calibrationState.result.minEar.toFixed(3)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Oclusión palpebral registrada
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
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
                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold block text-orange-950">
                      Perfil Anatómico Guardado y Sincronizado
                    </span>
                    OptiFlow ha reconfigurado su heurística matemática. A partir de este momento, las alertas de fatiga visual y la tasa de parpadeo se ajustan a tu fisonomía personalizada.
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* SECCIÓN INFERIOR: PRIVACIDAD Y FUNDAMENTO MATEMÁTICO EN PALETA NARANJA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border-orange-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-slate-900">
                  Garantía de Privacidad
                </h4>
                <Badge variant="solid-orange">100% LOCAL-FIRST</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Tu video nunca sale de este equipo. Los fotogramas se procesan exclusivamente en memoria RAM volátil para calcular los vectores geométricos e inmediatamente se sobreescriben.
              </p>
              <div className="text-[11px] text-orange-700 bg-orange-50/70 p-2.5 rounded-xl border border-orange-200/60 font-medium">
                ✓ Inferencia On-Device en CPU/GPU local sin transmisiones a internet ni persistencia de imágenes en disco.
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Modo del motor:</span>
              <span className="text-orange-600 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Offline Estricto
              </span>
            </div>
          </Card>

          <Card className="p-5 border-orange-100">
            <h4 className="font-bold text-sm text-slate-900 mb-2">
              Fundamento Matemático (EAR)
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              El Eye Aspect Ratio calcula la relación geométrica entre los párpados superior e inferior frente al ancho horizontal:
            </p>
            <div className="bg-slate-900 text-orange-400 font-mono text-xs p-3 rounded-xl border border-orange-500/20 text-center select-all">
              EAR = (||p2 - p6|| + ||p3 - p5||) / (2 · ||p1 - p4||)
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
              <span>Umbral calibrado:</span>
              <span className="font-mono font-bold text-orange-600">
                {biometrics.ear_threshold.toFixed(2)} EAR
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Keyframes de la animación de Scanline Naranja */}
      <style>{`
        @keyframes scanlineMove {
          0% {
            top: 6%;
            opacity: 0.9;
          }
          50% {
            top: 90%;
            opacity: 1;
          }
          100% {
            top: 6%;
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  )
}

export default CalibracionPrivacidad
