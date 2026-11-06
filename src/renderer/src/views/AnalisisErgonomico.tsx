import React from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { useTelemetry } from '../hooks/useTelemetry'

export const AnalisisErgonomico: React.FC = () => {
  const { data, isConnected } = useTelemetry()

  // Extracción y normalización de telemetría en tiempo real desde el motor biométrico
  const distVal =
    typeof data.distance === 'number'
      ? data.distance
      : typeof data.distance_cm === 'number'
        ? data.distance_cm
        : parseFloat(String(data.distance_cm || '58.4')) || 58.4

  const postureStatus = data.posture_status || 'Óptima'
  const postureAngle = typeof data.posture_angle === 'number' ? data.posture_angle : 12.0
  const leftEar = typeof data.left_ear === 'number' ? data.left_ear : 0.278
  const rightEar = typeof data.right_ear === 'number' ? data.right_ear : 0.282
  const earSymmetry = typeof data.ear_symmetry === 'number' ? data.ear_symmetry : 98.2
  const avgEar =
    typeof data.average_ear === 'number' ? data.average_ear : Number(((leftEar + rightEar) / 2).toFixed(3))

  // Diagnósticos de distancia
  const isDistOptimal = distVal >= 50 && distVal <= 70
  const isDistTooClose = distVal < 50 && distVal >= 35
  const isDistCritical = distVal < 35
  const isDistTooFar = distVal > 70

  // Cálculo de porcentaje para la barra de progreso de distancia (rango visual 20cm a 90cm)
  const distClamped = Math.max(20, Math.min(90, distVal))
  const distProgressPercent = Math.round(((distClamped - 20) / (90 - 20)) * 100)

  // Diagnóstico de postura
  const isBadPosture = postureStatus === 'Mala Postura'
  const isMildPosture = postureStatus === 'Leve Inclinación'

  // Porcentaje de apertura palpebral para los medidores de ojos (0.0 a 0.40 normalizado)
  const leftEarPercent = Math.min(100, Math.max(8, Math.round((leftEar / 0.36) * 100)))
  const rightEarPercent = Math.min(100, Math.max(8, Math.round((rightEar / 0.36) * 100)))

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col select-none pb-16">
      {/* Encabezado Superior de la Sección */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
            Análisis Ergonómico
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Telemetría Postural 3D, Estimación de Distancia y Simetría Ocular en Tiempo Real
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}
            />
            {isConnected ? 'MediaPipe 3D • Streaming Activo' : 'Conectando con Motor...'}
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-xs font-bold text-orange-700 shadow-2xs">
            <svg
              className="w-3.5 h-3.5 text-orange-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            60 FPS Inferencia
          </span>
        </div>
      </div>

      {/* Grid Principal de Telemetría Reactiva (3 Paneles Clave) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* =================================================================== */}
        {/* PANEL 1: INDICADOR DE DISTANCIA A LA PANTALLA                        */}
        {/* =================================================================== */}
        <Card className="p-7 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                    <line x1="6" y1="7" x2="6" y2="13" />
                    <line x1="18" y1="7" x2="18" y2="13" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Distancia a Pantalla
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Estimación euclidiana (puntos 234 - 454)
                  </p>
                </div>
              </div>

              {/* Badge Dinámico de Estado */}
              {isDistOptimal && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Óptima
                </span>
              )}
              {isDistTooClose && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Muy Cerca
                </span>
              )}
              {isDistCritical && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Riesgo Visual
                </span>
              )}
              {isDistTooFar && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Distante
                </span>
              )}
            </div>

            {/* Métrica Central en Centímetros */}
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-slate-900 font-mono tracking-tight">
                {Math.round(distVal)}
              </span>
              <span className="text-xl font-bold text-slate-400 font-sans">cm</span>
              <span className="ml-auto text-xs text-slate-500 font-medium font-mono">
                Ideal: 50 - 70 cm
              </span>
            </div>

            {/* Barra de Progreso Visual con Escala Graduada */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5 font-mono">
                <span>20 cm (Riesgo)</span>
                <span className="text-emerald-600 font-semibold">50-70 cm (Óptimo)</span>
                <span>90 cm</span>
              </div>

              {/* Riel Multizona */}
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex relative p-0.5">
                {/* Zona Roja (< 35cm) */}
                <div className="h-full bg-red-200 rounded-l-full" style={{ width: '21%' }} />
                {/* Zona Naranja (35-50cm) */}
                <div className="h-full bg-orange-200" style={{ width: '22%' }} />
                {/* Zona Verde Óptima (50-70cm) */}
                <div className="h-full bg-emerald-300" style={{ width: '28%' }} />
                {/* Zona Azul (> 70cm) */}
                <div className="h-full bg-blue-200 rounded-r-full flex-1" />

                {/* Marcador / Cursor Dinámico de la Distancia Actual */}
                <div
                  className="absolute top-0 bottom-0 w-2.5 bg-slate-900 rounded-full shadow-md -ml-1 transition-all duration-300 ease-out border-2 border-white"
                  style={{ left: `${distProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Semáforo de 3 Luces LED */}
            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100">
              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                  isDistCritical
                    ? 'bg-red-50 border-red-200 text-red-800 font-bold'
                    : 'bg-slate-50/60 border-slate-100 text-slate-400'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isDistCritical ? 'bg-red-500 shadow-sm shadow-red-500/50 animate-pulse' : 'bg-slate-300'
                  }`}
                />
                <span className="text-[11px] leading-tight">Riesgo (&lt;35)</span>
              </div>

              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                  isDistTooClose
                    ? 'bg-orange-50 border-orange-200 text-orange-800 font-bold'
                    : 'bg-slate-50/60 border-slate-100 text-slate-400'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isDistTooClose
                      ? 'bg-orange-500 shadow-sm shadow-orange-500/50 animate-pulse'
                      : 'bg-slate-300'
                  }`}
                />
                <span className="text-[11px] leading-tight">Alerta (&lt;50)</span>
              </div>

              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                  isDistOptimal
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                    : 'bg-slate-50/60 border-slate-100 text-slate-400'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isDistOptimal
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse'
                      : 'bg-slate-300'
                  }`}
                />
                <span className="text-[11px] leading-tight">Óptimo (50-70)</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-700">Norma ISO 9241-5:</span> Mantén la pantalla
            a una distancia equivalente a tu brazo extendido para relajar el músculo ciliar.
          </div>
        </Card>

        {/* =================================================================== */}
        {/* PANEL 2: ANÁLISIS DE POSTURA CERVICAL (HEAD POSE / INCLINACIÓN)     */}
        {/* =================================================================== */}
        <Card className="p-7 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" />
                    <path d="M19 11v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Postura Cervical
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Inclinación tridimensional (Pitch &amp; Yaw)
                  </p>
                </div>
              </div>

              {/* Badge Condicional */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                  postureStatus === 'Óptima'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : postureStatus === 'Leve Inclinación'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    postureStatus === 'Óptima'
                      ? 'bg-emerald-500'
                      : postureStatus === 'Leve Inclinación'
                        ? 'bg-amber-500'
                        : 'bg-orange-500 animate-pulse'
                  }`}
                />
                {postureStatus}
              </span>
            </div>

            {/* Diagnóstico Central */}
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                {postureStatus}
              </span>
              <span className="ml-auto text-xs font-mono font-bold text-slate-500">
                ~{Math.round(postureAngle)}° Inclinación
              </span>
            </div>

            {/* Alerta Visual Naranja cuando se detecta Mala Postura */}
            {isBadPosture ? (
              <div className="mt-4 p-4 rounded-2xl bg-orange-50 border border-orange-200 flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-900 block">
                    ¡Flexión Cervical Excesiva Detectada!
                  </span>
                  <p className="text-[11px] text-orange-800/90 mt-0.5 leading-relaxed">
                    Tu cabeza está inclinada hacia abajo o ladeada. Levanta el mentón y ajusta la
                    altura de tu pantalla para evitar sobrecarga en las vértebras C1-C7.
                  </p>
                </div>
              </div>
            ) : isMildPosture ? (
              <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <p className="text-xs text-amber-800 font-medium">
                  Leve ángulo detectado. Mantén la vista alineada con el tercio superior del monitor.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-xs text-emerald-800 font-medium">
                  Excelente alineación frontal. Eje cervical en posición ergonómica neutral.
                </p>
              </div>
            )}

            {/* Medidor Angular de Inclinación */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
                <span>Inclinación Frontal</span>
                <span className="font-mono text-slate-800">{Math.round(postureAngle)}° / 30°</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isBadPosture
                      ? 'bg-gradient-to-r from-orange-500 to-red-500'
                      : isMildPosture
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, (postureAngle / 30) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-700">Impacto Biomecánico:</span> Por cada 15°
            de inclinación hacia abajo, la cabeza ejerce 12 kg de fuerza extra sobre el cuello.
          </div>
        </Card>

        {/* =================================================================== */}
        {/* PANEL 3: SIMETRÍA FACIAL / EAR EN VIVO (OJO IZQ VS OJO DER)          */}
        {/* =================================================================== */}
        <Card className="p-7 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Simetría Facial &amp; EAR
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Apertura bilateral en tiempo real
                  </p>
                </div>
              </div>

              {/* Badge de Balance */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                  earSymmetry >= 90
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${earSymmetry >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                />
                {earSymmetry >= 90 ? 'Equilibrado' : 'Asimétrico'}
              </span>
            </div>

            {/* Métrica Central de Simetría */}
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-slate-900 font-mono tracking-tight">
                {earSymmetry.toFixed(1)}%
              </span>
              <span className="text-sm font-semibold text-slate-400 font-sans">balance</span>
              <span className="ml-auto text-xs text-slate-500 font-mono">
                EAR Prom: {avgEar.toFixed(2)}
              </span>
            </div>

            {/* Gráfico Dinámico: Ojo Izquierdo vs Ojo Derecho */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              {/* Medidor Ojo Izquierdo */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
                  <span>OJO IZQ</span>
                  <span className="font-mono text-orange-600">{leftEar.toFixed(3)}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${leftEarPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {leftEar > 0.18 ? 'Apertura normal' : 'Parpadeo / Cierre'}
                </span>
              </div>

              {/* Medidor Ojo Derecho */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
                  <span>OJO DER</span>
                  <span className="font-mono text-orange-600">{rightEar.toFixed(3)}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${rightEarPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {rightEar > 0.18 ? 'Apertura normal' : 'Parpadeo / Cierre'}
                </span>
              </div>
            </div>

            {/* Diferencial Bilateral */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Diferencial Bilateral (Δ):</span>
              <span className="font-mono font-bold text-slate-800">
                {Math.abs(leftEar - rightEar).toFixed(3)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <span className="font-bold text-slate-700">Diagnóstico Ocular:</span> Una asimetría
            prolongada (&gt;15%) indica fatiga lateralizada por ventanas fuera de tu eje visual.
          </div>
        </Card>
      </div>

      {/* =================================================================== */}
      {/* SECCIÓN INFERIOR: MATRIZ BIOMÉDICA & RECOMENDACIONES ERGONÓMICAS     */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matriz de Telemetría Biomecánica Continua */}
        <Card className="lg:col-span-2 p-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Matriz de Telemetría Biomecánica Continua
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Auditoría en vivo de parámetros biométricos contrastados con el estándar ISO 9241-5
              </p>
            </div>
            <Badge variant="solid-orange">ISO 9241-5</Badge>
          </div>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">PARÁMETRO BIOMÉDICO</th>
                  <th className="py-3 px-3">VALOR ACTUAL</th>
                  <th className="py-3 px-3">ESTÁNDAR SALUDABLE</th>
                  <th className="py-3 px-3 text-right">DIAGNÓSTICO EN VIVO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    Distancia Focal a Pantalla
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {Math.round(distVal)} cm
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono">50 - 70 cm</td>
                  <td className="py-3 px-3 text-right">
                    {isDistOptimal ? (
                      <span className="text-emerald-600 font-bold">✓ Rango Óptimo</span>
                    ) : isDistCritical ? (
                      <span className="text-red-600 font-bold">⚠ Riesgo Visual</span>
                    ) : (
                      <span className="text-orange-600 font-bold">⚠ Fuera de Rango</span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    Inclinación Cervical Sagital
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    ~{Math.round(postureAngle)}° ({postureStatus})
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono">10° - 15°</td>
                  <td className="py-3 px-3 text-right">
                    {postureStatus === 'Óptima' ? (
                      <span className="text-emerald-600 font-bold">✓ Alineación Neutral</span>
                    ) : (
                      <span className="text-orange-600 font-bold">⚠ Carga Cervical</span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    Simetría Palpebral Bilateral
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {earSymmetry.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono">&gt; 85.0%</td>
                  <td className="py-3 px-3 text-right">
                    {earSymmetry >= 85 ? (
                      <span className="text-emerald-600 font-bold">✓ Balance Equilibrado</span>
                    ) : (
                      <span className="text-amber-600 font-bold">⚠ Asimetría Focal</span>
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    Eye Aspect Ratio Medio (EAR)
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {avgEar.toFixed(3)}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono">&gt; 0.180</td>
                  <td className="py-3 px-3 text-right">
                    {avgEar > 0.18 ? (
                      <span className="text-emerald-600 font-bold">✓ Ojos Despejados</span>
                    ) : (
                      <span className="text-red-600 font-bold">⚠ Signos de Somnolencia</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recomendaciones Ergonómicas Activas */}
        <Card className="p-7 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 leading-tight">
              Recomendaciones Activas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">OptiFlow Smart Workplace</p>

            <div className="mt-4 flex flex-col gap-3">
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  isDistTooClose || isDistCritical
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-slate-50/80 border-slate-100'
                }`}
              >
                <span
                  className={`text-xs font-bold block ${
                    isDistTooClose || isDistCritical ? 'text-orange-900' : 'text-slate-800'
                  }`}
                >
                  1. Distancia de Enfoque
                </span>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {isDistTooClose || isDistCritical
                    ? 'Estás demasiado cerca de la pantalla. Aleja tu monitor 10-15 cm para evitar sobreesfuerzo del iris.'
                    : 'Mantén tu distancia actual. Estás en la zona ergonómica confortable.'}
                </p>
              </div>

              <div
                className={`p-3 rounded-2xl border transition-all ${
                  isBadPosture
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-slate-50/80 border-slate-100'
                }`}
              >
                <span
                  className={`text-xs font-bold block ${
                    isBadPosture ? 'text-orange-900' : 'text-slate-800'
                  }`}
                >
                  2. Elevación del Panel
                </span>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {isBadPosture
                    ? 'Eleva el soporte de tu monitor para que la primera línea de texto quede frente a tus ojos sin bajar el mentón.'
                    : 'Tu ángulo de mirada es el idóneo. Evita cruzar las piernas para mantener la simetría lumbar.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Inferencia:</span>
            <span className="text-emerald-600 font-bold">MediaPipe Face Mesh (468 pts)</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AnalisisErgonomico
