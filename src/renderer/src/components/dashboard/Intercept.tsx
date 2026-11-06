import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { UserSettings } from '../../../../preload/index.d'
import { OptiFlowIsotype } from '../layout/Logo'

const DEFAULT_BREAK_SECONDS = 20

export const Intercept: React.FC = () => {
  const { t } = useTranslation()
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_BREAK_SECONDS)
  const [totalSeconds, setTotalSeconds] = useState<number>(DEFAULT_BREAK_SECONDS)
  const [strictMode, setStrictMode] = useState<boolean>(false)
  const isDestroyingRef = useRef<boolean>(false)

  // Cargar configuración de usuario (duración de la pausa y modo estricto)
  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      try {
        const s: UserSettings | undefined =
          (await window.electron?.getSettings?.()) || (await window.api?.getSettings?.())
        if (s) {
          const duration = Math.max(5, s.pauseDuration || DEFAULT_BREAK_SECONDS)
          setTotalSeconds(duration)
          setTimeLeft(duration)
          setStrictMode(!!s.strictMode)
        }
      } catch (err) {
        console.error('[Intercept] Error cargando ajustes:', err)
      }
    }
    loadSettings()
  }, [])

  const handleEndBreak = (): void => {
    if (isDestroyingRef.current) return
    isDestroyingRef.current = true
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('end-break')
    } else {
      console.log('[Intercept] Autodestrucción de ventana solicitada (end-break)')
    }
  }

  const handlePostponeBreak = (): void => {
    if (strictMode || isDestroyingRef.current) return
    isDestroyingRef.current = true
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('postpone-break')
    } else {
      console.log('[Intercept] Pausa activa pospuesta (postpone-break)')
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleEndBreak()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Geometría para el progreso circular SVG
  const radius = 96
  const circumference = 2 * Math.PI * radius
  const progressRatio = totalSeconds > 0 ? timeLeft / totalSeconds : 1
  // En cuenta regresiva el arco se reduce o mantiene con el tiempo restante
  const strokeDashoffset = circumference * (1 - progressRatio)

  const formattedSeconds = String(timeLeft).padStart(2, '0')

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8F9FA] dark:bg-black text-slate-800 dark:text-white flex flex-col justify-between p-8 sm:p-12 select-none relative font-sans antialiased">
      {/* Barra Superior (Encabezado) */}
      <header className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Identidad de la Pausa */}
        <div className="flex items-center gap-3">
          <OptiFlowIsotype className="w-11 h-11" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-white">
                Opti<span className="text-orange-500 font-semibold">Flow</span>
              </span>
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/50 px-2 py-0.5 rounded-full tracking-wider uppercase">
                INTERCEPT
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400 mt-1 leading-tight">
              {t('intercept.headerSubtitle', 'Sesión de Trabajo Temporalmente Suspendida')}
            </h2>
          </div>
        </div>

        {/* Badge de Pausa Activa Obligatoria */}
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-200 tracking-wide uppercase">
            {t('intercept.badgeActiveBreak', 'PAUSA ACTIVA OBLIGATORIA')}
          </span>
          <span className="text-xs text-slate-400 dark:text-zinc-400 font-normal ml-1">
            {t('intercept.rule202020', 'Regla 20-20-20')}
          </span>
        </div>
      </header>

      {/* Contenido Central: Hero, Título y Temporizador Circular */}
      <main className="flex-1 flex flex-col items-center justify-center my-auto py-2">
        {/* Tag Superior */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800/50 shadow-2xs mb-3">
          <svg
            className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          </svg>
          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 tracking-wider uppercase">
            {t('intercept.tagHealth', 'PROTECCIÓN DE SALUD OCULAR & POSTURAL')}
          </span>
        </div>

        {/* Título Principal y Descripción */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center">
          {t('intercept.title', 'Pausa Activa Ocular')}
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm mt-2 text-center max-w-md leading-relaxed">
          {t('intercept.desc', 'Aparta la mirada del monitor para relajar el músculo ciliar y rehidratar la superficie ocular.')}
        </p>

        {/* Temporizador Circular Central */}
        <div className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center my-6">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
            {/* Pista de fondo */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="#FDE6D2"
              className="dark:stroke-zinc-800"
              strokeWidth="12"
            />
            {/* Pista de progreso circular en naranja vivo */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="#F97316"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Núcleo Interior Cálido */}
          <div className="absolute w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-[#FFF5EE] to-[#FDEBD9]/70 dark:from-zinc-900 dark:to-zinc-900/90 flex flex-col items-center justify-center text-center shadow-inner">
            <span className="text-[10px] sm:text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none mb-1">
              {t('intercept.timeLeft', 'TIEMPO RESTANTE')}
            </span>
            <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-mono my-0.5">
              00:{formattedSeconds}
            </span>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 text-xs font-semibold mt-1">
              <svg
                className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              </svg>
              <span>{t('intercept.lookAway', 'Fija vista a > 6 metros')}</span>
            </div>
          </div>
        </div>

        {/* Sección Inferior de Instrucciones */}
        <div className="w-full max-w-4xl mx-auto mt-2">
          <span className="block text-center text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-zinc-400 tracking-widest uppercase mb-3">
            {t('intercept.instructionsTitle', 'INSTRUCCIONES OBLIGATORIAS DE LA PAUSA')}
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Tarjeta 1: Enfoque a Distancia (Activa) */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border-2 border-orange-400 dark:border-orange-500 shadow-sm relative text-left">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  {t('intercept.step1Badge', 'EN CURSO')}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2.5">
                {t('intercept.step1Title', 'Enfoque a Distancia')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                {t('intercept.step1Desc', 'Mira a través de una ventana o hacia el objeto más alejado de la habitación para relajar el cristalino.')}
              </p>
            </div>

            {/* Tarjeta 2: Parpadeo Consciente */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-2xs relative text-left">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700">
                  2
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-400 font-medium">
                  {t('intercept.step2Badge', 'Paso Siguiente')}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2.5">
                {t('intercept.step2Title', 'Parpadeo Consciente')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                {t('intercept.step2Desc', 'Parpadea profundamente 5 veces de forma suave para restaurar la película lagrimal y humectar la córnea.')}
              </p>
            </div>

            {/* Tarjeta 3: Distensión Cervical */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-800 shadow-2xs relative text-left">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700">
                  3
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-400 font-medium">
                  {t('intercept.step3Badge', 'Postura')}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2.5">
                {t('intercept.step3Title', 'Distensión Cervical')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                {t('intercept.step3Desc', 'Rueda los hombros suavemente hacia atrás y baja la barbilla para liberar la tensión acumulada del cuello.')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Pie de Página (Footer) */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-zinc-400 gap-2 pt-2">
        <div className="flex items-center gap-2">
          <svg
            className="w-3.5 h-3.5 text-orange-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>{t('intercept.footerNotice', 'Pantalla bloqueada para garantizar tu ergonomía y descanso visual.')}</span>
        </div>

        <div className="flex items-center gap-2 text-right">
          <span>{t('intercept.footerAutoUnlock', 'Se desbloqueará automáticamente al finalizar el conteo')}</span>
          <span>•</span>
          {strictMode ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/90 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 text-[11px] font-bold border border-orange-200 dark:border-orange-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
              {t('intercept.strictActive', 'Modo Estricto Activo (Postergación Bloqueada)')}
            </span>
          ) : (
            <button
              type="button"
              onClick={handlePostponeBreak}
              className="text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white underline-offset-2 hover:underline cursor-pointer transition-colors"
            >
              {t('intercept.postponeButton', 'Posponer 2 min (Emergencia)')}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

export default Intercept
