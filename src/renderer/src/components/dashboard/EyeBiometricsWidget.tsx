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

  // Cálculo reactivo de escala dinámica para el HUD y pupila según el nivel de EAR
  const hudScale = useMemo(() => {
    if (isBlinking) return 0.94
    // Escala sutil entre 0.98 y 1.03 según apertura palpebral
    return Math.max(0.97, Math.min(1.03, 0.97 + (ear / 0.35) * 0.06))
  }, [ear, isBlinking])

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center relative select-none py-0 ${className}`}
    >
      {/* =================================================================== */}
      {/* FASE 1: CONTENEDOR CIRCULAR SUAVE Y OJO FOTORREALISTA               */}
      {/* =================================================================== */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full border-2 border-orange-500/35 shadow-[0_0_40px_rgba(249,115,22,0.22)] flex items-center justify-center bg-slate-950 overflow-hidden ring-1 ring-orange-400/20">
        {/* Imagen base fotorrealista de alta resolución del ojo humano */}
        <img
          src={eyeImage}
          alt="Ojo Biométrico Fotorrealista"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-transform duration-200 ease-out"
          style={{
            transform: isBlinking ? 'scaleY(0.90) scaleX(1.02)' : 'scale(1)',
            filter: isBlinking
              ? 'brightness(0.92) contrast(1.05)'
              : 'brightness(1.0) contrast(1.03)'
          }}
        />

        {/* Capa de destellos y reflejos de luz especulares húmedos */}
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 50% 40%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 45%, transparent 75%)'
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{
            boxShadow: 'inset 0 0 25px 8px rgba(0, 0, 0, 0.45)'
          }}
        />

        {/* =================================================================== */}
        {/* FASE 2: HUD NARANJA BIOMÉTRICO E INTERACTIVO (SVG / CANVAS)         */}
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
              {/* Filtro de resplandor para los trazos naranja flúor del HUD */}
              <filter id="orangeHudGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. RETÍCULA CIRCULAR EXTERIOR SEGMENTADA (R=140) */}
            <g filter="url(#orangeHudGlow)">
              {/* Cuadrante Superior Derecho */}
              <path
                d="M 216.2 44.8 A 140 140 0 0 1 315.2 143.8"
                stroke="#F97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Cuadrante Inferior Derecho */}
              <path
                d="M 315.2 216.2 A 140 140 0 0 1 216.2 315.2"
                stroke="#F97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Cuadrante Inferior Izquierdo */}
              <path
                d="M 143.8 315.2 A 140 140 0 0 1 44.8 216.2"
                stroke="#F97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Cuadrante Superior Izquierdo */}
              <path
                d="M 44.8 143.8 A 140 140 0 0 1 143.8 44.8"
                stroke="#F97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Arcos de Acento en los Polos Superior e Inferior (R=152) */}
              <path
                d="M 128.0 37.2 A 152 152 0 0 1 232.0 37.2"
                stroke="#FF8A00"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M 232.0 322.8 A 152 152 0 0 1 128.0 322.8"
                stroke="#FF8A00"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </g>

            {/* Marcadores de Polo Superior, Inferior, Izquierdo y Derecho */}
            <line x1="180" y1="24" x2="180" y2="40" stroke="#FF8A00" strokeWidth="2.5" />
            <line x1="180" y1="320" x2="180" y2="336" stroke="#FF8A00" strokeWidth="2.5" />
            <line x1="24" y1="180" x2="40" y2="180" stroke="#FF8A00" strokeWidth="2.5" />
            <line x1="320" y1="180" x2="336" y2="180" stroke="#FF8A00" strokeWidth="2.5" />

            {/* 2. ANILLO CONCÉNTRICO MEDIO DISCONTINUO (R=122) */}
            <circle
              cx="180"
              cy="180"
              r="122"
              stroke="#EA580C"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              strokeOpacity="0.85"
            />

            {/* 3. ANILLOS ALREDEDOR DEL IRIS Y PUPILA */}
            <circle
              cx="180"
              cy="180"
              r="82"
              stroke="#F97316"
              strokeWidth="1.2"
              strokeOpacity="0.75"
            />
            <circle
              cx="180"
              cy="180"
              r="45"
              stroke="#FF8A00"
              strokeWidth="1.2"
              strokeDasharray="2 3"
              strokeOpacity="0.8"
            />

            {/* 4. INDICADOR DE CALIDAD / ESCALAS LATERALES (REJILLAS POLARES) */}
            {/* Rejilla Lateral Izquierda */}
            <g stroke="#F97316" strokeWidth="0.8" strokeOpacity="0.65">
              <path d="M 105.7 145.3 A 82 82 0 0 0 105.7 214.7" />
              <path d="M 96.6 141.1 A 92 92 0 0 0 96.6 218.9" />
              <path d="M 87.5 136.9 A 102 102 0 0 0 87.5 223.1" />
              <path d="M 78.5 132.6 A 112 112 0 0 0 78.5 227.4" />
              <path d="M 69.4 128.4 A 122 122 0 0 0 69.4 231.6" />

              {/* Radios de la rejilla izquierda */}
              <line x1="105.7" y1="145.3" x2="69.4" y2="128.4" />
              <line x1="91.1" y1="156.4" x2="52.3" y2="148.5" />
              <line x1="98.3" y1="172.9" x2="58.5" y2="169.4" />
              <line x1="98.3" y1="187.1" x2="58.5" y2="190.6" />
              <line x1="91.1" y1="203.6" x2="52.3" y2="211.5" />
              <line x1="105.7" y1="214.7" x2="69.4" y2="231.6" />
            </g>

            {/* Rejilla Lateral Derecha */}
            <g stroke="#F97316" strokeWidth="0.8" strokeOpacity="0.65">
              <path d="M 254.3 145.3 A 82 82 0 0 1 254.3 214.7" />
              <path d="M 263.4 141.1 A 92 92 0 0 1 263.4 218.9" />
              <path d="M 272.5 136.9 A 102 102 0 0 1 272.5 223.1" />
              <path d="M 281.5 132.6 A 112 112 0 0 1 281.5 227.4" />
              <path d="M 290.6 128.4 A 122 122 0 0 1 290.6 231.6" />

              {/* Radios de la rejilla derecha */}
              <line x1="254.3" y1="145.3" x2="290.6" y2="128.4" />
              <line x1="268.9" y1="156.4" x2="307.7" y2="148.5" />
              <line x1="261.7" y1="172.9" x2="301.5" y2="169.4" />
              <line x1="261.7" y1="187.1" x2="301.5" y2="190.6" />
              <line x1="268.9" y1="203.6" x2="307.7" y2="211.5" />
              <line x1="254.3" y1="214.7" x2="290.6" y2="231.6" />
            </g>

            {/* 5. LÍNEAS DE CRUZAMIENTO (+) CENTRADAS EN LA PUPILA */}
            {/* Eje Vertical con Marcas de Graduación */}
            <line
              x1="180"
              y1="24"
              x2="180"
              y2="336"
              stroke="#FF8A00"
              strokeWidth="1.5"
              strokeOpacity="0.85"
              filter="url(#orangeHudGlow)"
            />
            {/* Tick marks verticales */}
            <g stroke="#FF8A00" strokeWidth="1.2" strokeOpacity="0.75">
              <line x1="175" y1="60" x2="185" y2="60" />
              <line x1="175" y1="90" x2="185" y2="90" />
              <line x1="175" y1="120" x2="185" y2="120" />
              <line x1="175" y1="240" x2="185" y2="240" />
              <line x1="175" y1="270" x2="185" y2="270" />
              <line x1="175" y1="300" x2="185" y2="300" />
            </g>

            {/* Eje Horizontal con Resplandor Focal */}
            <line
              x1="20"
              y1="180"
              x2="340"
              y2="180"
              stroke="#FF8A00"
              strokeWidth="2.2"
              filter="url(#orangeHudGlow)"
            />
            {/* Tick marks horizontales */}
            <g stroke="#FF8A00" strokeWidth="1.2" strokeOpacity="0.75">
              <line x1="60" y1="175" x2="60" y2="185" />
              <line x1="90" y1="175" x2="90" y2="185" />
              <line x1="120" y1="175" x2="120" y2="185" />
              <line x1="240" y1="175" x2="240" y2="185" />
              <line x1="270" y1="175" x2="270" y2="185" />
              <line x1="300" y1="175" x2="300" y2="185" />
            </g>

            {/* Retícula Central en la Pupila */}
            <circle cx="180" cy="180" r="3.5" fill="#FFFFFF" filter="url(#orangeHudGlow)" />
            <circle cx="180" cy="180" r="1.5" fill="#FF8A00" />
          </svg>
        </div>

        {/* EFECTO DE ESCANEO LÁSER HORIZONTAL (ANIMACIÓN LÁSER NARANJA FLÚOR) */}
        <div
          className="absolute left-2 right-2 pointer-events-none z-15 flex flex-col items-center"
          style={{
            animation: 'laserScanMove 3.6s ease-in-out infinite',
            height: '2.5px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.25) 15%, #FF8A00 45%, #FFFFFF 50%, #FF8A00 55%, rgba(249, 115, 22, 0.25) 85%, transparent 100%)',
            boxShadow:
              '0 0 14px 3px rgba(255, 138, 0, 0.95), 0 0 28px 6px rgba(234, 88, 12, 0.5)'
          }}
        >
          {/* Cortina / Halo de escaneo translúcido */}
          <div className="w-full h-12 -mt-6 bg-gradient-to-b from-orange-500/10 via-orange-500/20 to-transparent pointer-events-none" />
        </div>

        {/* =================================================================== */}
        {/* FASE 3: ETIQUETA FLOTANTE ENCAPSULADA DE DATOS DE TRACKING DINÁMICOS */}
        {/* =================================================================== */}
        <div className="absolute bottom-2.5 bg-orange-50/85 backdrop-blur-md border border-orange-200/90 rounded-full px-3.5 py-1 flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/15 select-none z-20 transition-all duration-200">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBlinking ? 'bg-amber-500 animate-ping' : 'bg-orange-500 animate-pulse'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-orange-900 tracking-wider">
            TRACKING {trackingPoints} PTS <span className="text-orange-400 mx-1">•</span> EAR{' '}
            <span className="text-orange-600 font-black">
              {typeof ear === 'number' ? ear.toFixed(2) : ear}
            </span>
          </span>
        </div>
      </div>

      {/* Keyframes de animación del escaneo láser */}
      <style>{`
        @keyframes laserScanMove {
          0% {
            top: 22%;
            opacity: 0.95;
          }
          50% {
            top: 78%;
            opacity: 1;
          }
          100% {
            top: 22%;
            opacity: 0.95;
          }
        }
      `}</style>
    </div>
  )
}

export default EyeBiometricsWidget
