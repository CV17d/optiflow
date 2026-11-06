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

  // Cálculo reactivo de escala dinámica para el HUD según la apertura palpebral (EAR)
  const hudScale = useMemo(() => {
    if (isBlinking) return 0.95
    return Math.max(0.98, Math.min(1.02, 0.98 + (ear / 0.35) * 0.04))
  }, [ear, isBlinking])

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center relative select-none py-0 ${className}`}
    >
      {/* =================================================================== */}
      {/* 1. CONTENEDOR CIRCULAR SUAVE Y OJO FOTORREALISTA NATURAL            */}
      {/* =================================================================== */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full border border-cyan-400/30 shadow-[0_0_35px_rgba(34,211,238,0.16)] flex items-center justify-center bg-slate-950 overflow-hidden ring-1 ring-cyan-400/20">
        {/* Imagen base fotorrealista en colores biológicos naturales (sin tintes cálidos) */}
        <img
          src={eyeImage}
          alt="Ojo Biométrico Natural"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-transform duration-200 ease-out"
          style={{
            transform: isBlinking ? 'scaleY(0.92) scaleX(1.01)' : 'scale(1)',
            filter: isBlinking
              ? 'brightness(0.94) contrast(1.02)'
              : 'brightness(1.0) contrast(1.02)'
          }}
        />

        {/* Destellos y reflejos de luz especulares húmedos sin tinte de color */}
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            background:
              'radial-gradient(ellipse 65% 50% at 50% 38%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.03) 50%, transparent 80%)'
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            boxShadow: 'inset 0 0 24px 6px rgba(0, 0, 0, 0.35)'
          }}
        />

        {/* =================================================================== */}
        {/* 2. HUD BIOMÉTRICO EN CIAN / TURQUESA (SVG ULTRA-FINO)               */}
        {/* =================================================================== */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center transition-transform duration-200 ease-out z-10"
          style={{ transform: `scale(${hudScale})` }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 360 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Filtro sutil de resplandor para los trazos en cian biométrico */}
              <filter id="cyanHudGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* A. RETÍCULA CIRCULAR SEGMENTADA EXTERIOR (R=140) */}
            <g filter="url(#cyanHudGlow)" stroke="#22D3EE" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.85">
              {/* Cuadrante Superior Derecho */}
              <path d="M 216.2 44.8 A 140 140 0 0 1 315.2 143.8" />
              {/* Cuadrante Inferior Derecho */}
              <path d="M 315.2 216.2 A 140 140 0 0 1 216.2 315.2" />
              {/* Cuadrante Inferior Izquierdo */}
              <path d="M 143.8 315.2 A 140 140 0 0 1 44.8 216.2" />
              {/* Cuadrante Superior Izquierdo */}
              <path d="M 44.8 143.8 A 140 140 0 0 1 143.8 44.8" />

              {/* Acentos Polares Superior e Inferior (R=152) */}
              <path d="M 132.0 36.5 A 152 152 0 0 1 228.0 36.5" strokeWidth="1.8" stroke="#67E8F9" />
              <path d="M 228.0 323.5 A 152 152 0 0 1 132.0 323.5" strokeWidth="1.8" stroke="#67E8F9" />
            </g>

            {/* Marcadores cardinales en los 4 polos */}
            <line x1="180" y1="26" x2="180" y2="38" stroke="#67E8F9" strokeWidth="1.5" strokeOpacity="0.85" />
            <line x1="180" y1="322" x2="180" y2="334" stroke="#67E8F9" strokeWidth="1.5" strokeOpacity="0.85" />
            <line x1="26" y1="180" x2="38" y2="180" stroke="#67E8F9" strokeWidth="1.5" strokeOpacity="0.85" />
            <line x1="322" y1="180" x2="334" y2="180" stroke="#67E8F9" strokeWidth="1.5" strokeOpacity="0.85" />

            {/* B. ANILLOS CONCÉNTRICOS DISCONTINUOS DELGADOS */}
            <circle
              cx="180"
              cy="180"
              r="122"
              stroke="#06B6D4"
              strokeWidth="0.8"
              strokeDasharray="3 5"
              strokeOpacity="0.65"
            />
            <circle
              cx="180"
              cy="180"
              r="84"
              stroke="#22D3EE"
              strokeWidth="0.8"
              strokeOpacity="0.6"
            />
            <circle
              cx="180"
              cy="180"
              r="46"
              stroke="#67E8F9"
              strokeWidth="0.8"
              strokeDasharray="2 3"
              strokeOpacity="0.7"
            />

            {/* C. ESCALAS DIGITALES VERTICALES Y GRÁFICOS DE CALIBRACIÓN */}
            {/* Escala Digital Lateral Izquierda */}
            <g stroke="#22D3EE" strokeWidth="0.7" strokeOpacity="0.55">
              <line x1="68" y1="130" x2="68" y2="230" />
              <line x1="62" y1="140" x2="68" y2="140" />
              <line x1="64" y1="150" x2="68" y2="150" />
              <line x1="60" y1="160" x2="68" y2="160" strokeWidth="1.1" />
              <line x1="64" y1="170" x2="68" y2="170" />
              <line x1="58" y1="180" x2="68" y2="180" strokeWidth="1.4" stroke="#67E8F9" />
              <line x1="64" y1="190" x2="68" y2="190" />
              <line x1="60" y1="200" x2="68" y2="200" strokeWidth="1.1" />
              <line x1="64" y1="210" x2="68" y2="210" />
              <line x1="62" y1="220" x2="68" y2="220" />

              {/* Pequeña rejilla lateral de calibración izquierda */}
              <path d="M 104 148 A 82 82 0 0 0 104 212" strokeDasharray="2 2" strokeOpacity="0.4" />
              <path d="M 94 143 A 94 94 0 0 0 94 217" strokeDasharray="2 2" strokeOpacity="0.4" />
            </g>

            {/* Escala Digital Lateral Derecha */}
            <g stroke="#22D3EE" strokeWidth="0.7" strokeOpacity="0.55">
              <line x1="292" y1="130" x2="292" y2="230" />
              <line x1="292" y1="140" x2="298" y2="140" />
              <line x1="292" y1="150" x2="296" y2="150" />
              <line x1="292" y1="160" x2="300" y2="160" strokeWidth="1.1" />
              <line x1="292" y1="170" x2="296" y2="170" />
              <line x1="292" y1="180" x2="302" y2="180" strokeWidth="1.4" stroke="#67E8F9" />
              <line x1="292" y1="190" x2="296" y2="190" />
              <line x1="292" y1="200" x2="300" y2="200" strokeWidth="1.1" />
              <line x1="292" y1="210" x2="296" y2="210" />
              <line x1="292" y1="220" x2="298" y2="220" />

              {/* Pequeña rejilla lateral de calibración derecha */}
              <path d="M 256 148 A 82 82 0 0 1 256 212" strokeDasharray="2 2" strokeOpacity="0.4" />
              <path d="M 266 143 A 94 94 0 0 1 266 217" strokeDasharray="2 2" strokeOpacity="0.4" />
            </g>

            {/* D. FINA CRUZ DE PRECISIÓN (+) QUE SE INTERCEPTA EN LA PUPILA */}
            {/* Eje Vertical */}
            <line
              x1="180"
              y1="28"
              x2="180"
              y2="332"
              stroke="#22D3EE"
              strokeWidth="0.9"
              strokeOpacity="0.75"
              filter="url(#cyanHudGlow)"
            />
            {/* Tick marks del eje vertical */}
            <g stroke="#67E8F9" strokeWidth="0.8" strokeOpacity="0.65">
              <line x1="176" y1="70" x2="184" y2="70" />
              <line x1="176" y1="100" x2="184" y2="100" />
              <line x1="176" y1="130" x2="184" y2="130" />
              <line x1="176" y1="230" x2="184" y2="230" />
              <line x1="176" y1="260" x2="184" y2="260" />
              <line x1="176" y1="290" x2="184" y2="290" />
            </g>

            {/* Eje Horizontal */}
            <line
              x1="28"
              y1="180"
              x2="332"
              y2="180"
              stroke="#22D3EE"
              strokeWidth="1.1"
              strokeOpacity="0.8"
              filter="url(#cyanHudGlow)"
            />
            {/* Tick marks del eje horizontal */}
            <g stroke="#67E8F9" strokeWidth="0.8" strokeOpacity="0.65">
              <line x1="80" y1="176" x2="80" y2="184" />
              <line x1="110" y1="176" x2="110" y2="184" />
              <line x1="140" y1="176" x2="140" y2="184" />
              <line x1="220" y1="176" x2="220" y2="184" />
              <line x1="250" y1="176" x2="250" y2="184" />
              <line x1="280" y1="176" x2="280" y2="184" />
            </g>

            {/* Punto de mira central en la pupila */}
            <circle cx="180" cy="180" r="2.5" fill="#22D3EE" filter="url(#cyanHudGlow)" />
            <circle cx="180" cy="180" r="1.2" fill="#FFFFFF" />
          </svg>
        </div>

        {/* LÍNEA DE ESCANEO LÁSER HORIZONTAL EN CIAN BRILLANTE */}
        <div
          className="absolute left-3 right-3 pointer-events-none z-15 flex flex-col items-center"
          style={{
            animation: 'cyanLaserOscillate 3.4s ease-in-out infinite',
            height: '2px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.2) 12%, #22D3EE 42%, #FFFFFF 50%, #22D3EE 58%, rgba(34, 211, 238, 0.2) 88%, transparent 100%)',
            boxShadow:
              '0 0 12px 2.5px rgba(34, 211, 238, 0.85), 0 0 24px 5px rgba(6, 182, 212, 0.4)'
          }}
        >
          {/* Sutil estela descendente translúcida en cian */}
          <div className="w-full h-10 -mt-5 bg-gradient-to-b from-cyan-400/10 via-cyan-400/15 to-transparent pointer-events-none" />
        </div>

        {/* =================================================================== */}
        {/* 3. ETIQUETA INFERIOR FLOTANTE DE TRACKING EN CIAN TRANSLÚCIDO       */}
        {/* =================================================================== */}
        <div className="absolute bottom-2.5 bg-cyan-950/30 backdrop-blur-md border border-cyan-400/35 rounded-full px-3.5 py-0.5 flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-500/10 select-none z-20 transition-all duration-200">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBlinking ? 'bg-cyan-300 animate-ping' : 'bg-cyan-400 animate-pulse'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] font-sans font-bold text-cyan-300 tracking-wider">
            TRACKING {trackingPoints} PTS <span className="text-cyan-500/60 mx-1">•</span> EAR{' '}
            <span className="text-cyan-100 font-extrabold">
              {typeof ear === 'number' ? ear.toFixed(2) : ear}
            </span>
          </span>
        </div>
      </div>

      {/* Keyframes de animación del escaneo láser cian */}
      <style>{`
        @keyframes cyanLaserOscillate {
          0% {
            top: 24%;
            opacity: 0.9;
          }
          50% {
            top: 76%;
            opacity: 1;
          }
          100% {
            top: 24%;
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  )
}

export default EyeBiometricsWidget
