import React, { useMemo } from 'react'
import eyeImage from '../../assets/eye-square.jpg'

export interface EyeBiometricsWidgetProps {
  ear?: number
  trackingPoints?: number
  className?: string
}

export const EyeBiometricsWidget: React.FC<EyeBiometricsWidgetProps> = ({
  ear = 0.28,
  trackingPoints = 468,
  className = ''
}) => {
  const isBlinking = ear < 0.20

  // Escala reactiva sutil para el HUD según la apertura palpebral
  const hudScale = useMemo(() => {
    if (isBlinking) return 0.96
    return Math.max(0.98, Math.min(1.02, 0.98 + (ear / 0.35) * 0.04))
  }, [ear, isBlinking])

  return (
    <div
      className={`w-full flex flex-col items-center justify-center select-none py-1 ${className}`}
    >
      {/* =================================================================== */}
      {/* 1. CONTENEDOR DEL OJO CON DESVANECIMIENTO RADIAL (SIN BORDES DUROS) */}
      {/* =================================================================== */}
      <div className="relative w-80 h-60 sm:w-96 sm:h-72 md:w-[440px] md:h-[320px] lg:w-[480px] lg:h-[350px] xl:w-[500px] xl:h-[365px] flex items-center justify-center">
        {/* Contenedor con máscara de degradado radial progresivo hacia #F5F5F7 (light) o #000000 (dark) */}
        <div
          className="relative w-full h-full flex items-center justify-center [mask-image:radial-gradient(ellipse_65%_58%_at_50%_50%,black_35%,transparent_72%)] [-webkit-mask-image:radial-gradient(ellipse_65%_58%_at_50%_50%,black_35%,transparent_72%)]"
        >
          {/* Imagen base fotorrealista natural */}
          <img
            src={eyeImage}
            alt="Ojo Biométrico Natural"
            className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-200 ease-out"
            style={{
              transform: isBlinking ? 'scaleY(0.93) scaleX(1.01)' : 'scale(1)',
              filter: isBlinking
                ? 'brightness(0.95) contrast(1.02)'
                : 'brightness(1.0) contrast(1.02)'
            }}
          />

          {/* Overlay suave para asegurar transición perfecta hacia el fondo de la app #F5F5F7 en light y #000000 en dark */}
          <div
            className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_68%_60%_at_50%_50%,transparent_40%,rgba(245,245,247,0.45)_65%,#F5F5F7_80%)] dark:bg-[radial-gradient(ellipse_68%_60%_at_50%_50%,transparent_38%,rgba(0,0,0,0.7)_58%,#000000_75%)]"
          />
        </div>

        {/* =================================================================== */}
        {/* 2. HUD BIOMÉTRICO SUTIL Y FINO EN CIAN (#22D3EE / #06B6D4)          */}
        {/* =================================================================== */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center transition-transform duration-200 ease-out z-10"
          style={{ transform: `scale(${hudScale})` }}
        >
          {/* SVG ultra-estilizado centrado con precisión sobre la pupila (50% 50%) */}
          <svg
            className="w-full h-full"
            viewBox="0 0 360 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="cyanGlowFaint" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* A. Retícula Circular concéntrica fina */}
            <g stroke="#22D3EE" strokeOpacity="0.70" strokeWidth="1" filter="url(#cyanGlowFaint)">
              {/* Arcos concéntricos con segmentos discontinuos */}
              <circle cx="180" cy="130" r="95" strokeWidth="1.2" strokeDasharray="18 8" />
              <circle cx="180" cy="130" r="82" strokeWidth="0.8" strokeDasharray="4 6" strokeOpacity="0.55" />
              <circle cx="180" cy="130" r="56" strokeWidth="0.8" strokeOpacity="0.6" />
              <circle cx="180" cy="130" r="28" strokeWidth="0.7" strokeDasharray="2 3" strokeOpacity="0.65" />
            </g>

            {/* B. Fina Cruz de Precisión (+) interceptada en la pupila (180, 130) */}
            <line
              x1="180"
              y1="40"
              x2="180"
              y2="220"
              stroke="#22D3EE"
              strokeWidth="0.9"
              strokeOpacity="0.75"
              filter="url(#cyanGlowFaint)"
            />
            <line
              x1="80"
              y1="130"
              x2="280"
              y2="130"
              stroke="#22D3EE"
              strokeWidth="1.0"
              strokeOpacity="0.75"
              filter="url(#cyanGlowFaint)"
            />
            {/* Pequeña mira central */}
            <circle cx="180" cy="130" r="2" fill="#22D3EE" />

            {/* C. Escalas Digitales Laterales */}
            <g stroke="#22D3EE" strokeWidth="0.7" strokeOpacity="0.55">
              {/* Escala izquierda */}
              <line x1="86" y1="95" x2="86" y2="165" />
              <line x1="82" y1="105" x2="86" y2="105" />
              <line x1="80" y1="117" x2="86" y2="117" strokeWidth="1" />
              <line x1="78" y1="130" x2="86" y2="130" strokeWidth="1.2" stroke="#67E8F9" />
              <line x1="80" y1="143" x2="86" y2="143" strokeWidth="1" />
              <line x1="82" y1="155" x2="86" y2="155" />

              {/* Escala derecha */}
              <line x1="274" y1="95" x2="274" y2="165" />
              <line x1="274" y1="105" x2="278" y2="105" />
              <line x1="274" y1="117" x2="280" y2="117" strokeWidth="1" />
              <line x1="274" y1="130" x2="282" y2="130" strokeWidth="1.2" stroke="#67E8F9" />
              <line x1="274" y1="143" x2="280" y2="143" strokeWidth="1" />
              <line x1="274" y1="155" x2="278" y2="155" />
            </g>
          </svg>

          {/* D. Línea de Escaneo Láser Horizontal con desvanecimiento a 0 en ambos extremos */}
          <div
            className="absolute left-8 right-8 pointer-events-none z-15 flex flex-col items-center"
            style={{
              animation: 'cyanLaserOscillate 3.6s ease-in-out infinite',
              height: '2px',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.15) 15%, #22D3EE 42%, #FFFFFF 50%, #22D3EE 58%, rgba(34, 211, 238, 0.15) 85%, transparent 100%)',
              boxShadow:
                '0 0 12px 2.5px rgba(34, 211, 238, 0.75)'
            }}
          >
            {/* Sutil estela difusa que también se desvanece suavemente */}
            <div
              className="w-full h-8 -mt-4 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 100% at 50% 50%, rgba(34, 211, 238, 0.18) 0%, transparent 80%)'
              }}
            />
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. ETIQUETA EXTERIOR INDEPENDIENTE (FUERA DEL CONTENEDOR DEL OJO)   */}
      {/* =================================================================== */}
      <div className="mt-4 sm:mt-5 inline-flex items-center justify-center gap-2.5 bg-cyan-500/10 dark:bg-cyan-950/40 border border-cyan-500/25 dark:border-cyan-500/30 rounded-full px-5 py-2 shadow-2xs transition-all duration-200">
        <span
          className={`w-2 h-2 rounded-full ${
            isBlinking ? 'bg-cyan-500 animate-ping' : 'bg-cyan-500 animate-pulse'
          }`}
        />
        <span className="text-xs sm:text-sm font-sans font-bold text-cyan-600 dark:text-cyan-400 tracking-wide">
          TRACKING {trackingPoints} PTS <span className="text-cyan-400 mx-1.5">•</span> EAR{' '}
          <span className="font-extrabold text-cyan-700 dark:text-cyan-300">
            {typeof ear === 'number' ? ear.toFixed(2) : ear}
          </span>
        </span>
      </div>

      {/* Keyframes de oscilación suave del escaneo láser */}
      <style>{`
        @keyframes cyanLaserOscillate {
          0% {
            top: 26%;
            opacity: 0.9;
          }
          50% {
            top: 74%;
            opacity: 1;
          }
          100% {
            top: 26%;
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  )
}

export default EyeBiometricsWidget
