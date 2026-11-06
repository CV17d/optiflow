import React, { useState, useEffect } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import type { UserSettings } from '../../../preload/index.d'

const DEFAULT_SETTINGS: UserSettings = {
  autoStart: false,
  workInterval: 20,
  pauseDuration: 20,
  strictMode: false
}

export const Configuracion: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string>('')

  // Carga de configuración inicial desde Electron vía IPC
  useEffect(() => {
    let isMounted = true

    const loadSettings = async (): Promise<void> => {
      try {
        const stored =
          (await window.electron?.getSettings?.()) || (await window.api?.getSettings?.())
        if (isMounted && stored) {
          setSettings({
            autoStart: !!stored.autoStart,
            workInterval: Number(stored.workInterval) || 20,
            pauseDuration: Number(stored.pauseDuration) || 20,
            strictMode: !!stored.strictMode
          })
        }
      } catch (err) {
        console.error('[Configuracion] Error al cargar configuración:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [])

  // Guardar cambios persistentes en Electron (config.json y SQLite)
  const handleSave = async (): Promise<void> => {
    setIsSaving(true)
    try {
      let saved: UserSettings | undefined
      if (window.electron?.saveSettings) {
        saved = await window.electron.saveSettings(settings)
      } else if (window.api?.saveSettings) {
        saved = await window.api.saveSettings(settings)
      }

      if (saved) {
        setSettings({
          autoStart: !!saved.autoStart,
          workInterval: Number(saved.workInterval) || 20,
          pauseDuration: Number(saved.pauseDuration) || 20,
          strictMode: !!saved.strictMode
        })
      }

      setToastMessage('¡Ajustes guardados y aplicados exitosamente en OptiFlow!')
      setShowSuccessToast(true)
      setTimeout(() => {
        setShowSuccessToast(false)
      }, 4000)
    } catch (err) {
      console.error('[Configuracion] Error al guardar configuración:', err)
      setToastMessage('Error al sincronizar ajustes con Electron')
      setShowSuccessToast(true)
      setTimeout(() => {
        setShowSuccessToast(false)
      }, 4000)
    } finally {
      setIsSaving(false)
    }
  }

  // Componente Switch estilo iOS/Tailwind con paleta naranja OptiFlow
  const ToggleSwitch: React.FC<{
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
  }> = ({ checked, onChange, disabled = false }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
        checked ? 'bg-orange-500' : 'bg-slate-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )

  if (isLoading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto flex flex-col select-none pb-16">
        <div className="h-10 w-64 bg-slate-200 rounded-2xl animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-3xl animate-pulse" />
          <div className="h-96 bg-white rounded-3xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col select-none pb-16 relative">
      {/* Toast Notificación Flotante de Éxito */}
      {showSuccessToast && (
        <div className="fixed top-6 right-8 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Encabezado Superior de la Sección */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
            Configuración
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Preferencias del Sistema, Parámetros de Descanso y Modo Kiosco
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Persistencia Activa (JSON &amp; SQLite)
          </span>

          <Badge variant="solid-orange">PREFERENCIAS</Badge>
        </div>
      </div>

      {/* Maquetación Principal con CSS Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* =================================================================== */}
        {/* COLUMNA IZQUIERDA (2 Columnas): CATEGORÍAS PRINCIPALES               */}
        {/* =================================================================== */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* CATEGORÍA 1: SISTEMA */}
          <Card className="p-7">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
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
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Sistema &amp; Arranque
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Control de inicio y ejecución en segundo plano
                </p>
              </div>
            </div>

            {/* Ajuste: Iniciar automáticamente con Windows */}
            <div className="flex items-center justify-between py-2">
              <div className="max-w-md pr-4">
                <span className="text-sm font-bold text-slate-800 block">
                  Iniciar automáticamente con el sistema
                </span>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Lanza OptiFlow silenciosamente al encender el equipo o iniciar sesión en Windows
                  (openAtLogin).
                </p>
              </div>

              <ToggleSwitch
                checked={settings.autoStart}
                onChange={(val) => setSettings((prev) => ({ ...prev, autoStart: val }))}
              />
            </div>
          </Card>

          {/* CATEGORÍA 2: REGLAS DE PREVENCIÓN */}
          <Card className="p-7">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
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
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Reglas de Prevención Ergonómica
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Frecuencia de descanso y duración de los ciclos
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Ajuste: Intervalo de Trabajo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">
                      Intervalo de Trabajo (Foco Continuo)
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Minutos continuos de trabajo antes de sugerir o forzar una pausa activa.
                    </p>
                  </div>
                  <span className="text-sm font-mono font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-xl">
                    {settings.workInterval} min
                  </span>
                </div>

                {/* Botones de Selección Rápida */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {[20, 30, 45, 60].map((mins) => {
                    const isSelected = settings.workInterval === mins
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setSettings((prev) => ({ ...prev, workInterval: mins }))}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/25'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {mins} min {mins === 20 ? '(20-20-20)' : mins === 45 ? '(Pomodoro)' : ''}
                      </button>
                    )
                  })}
                </div>

                {/* Input Manual Select / Number */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-slate-400">Personalizado:</span>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={settings.workInterval}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        workInterval: Math.max(1, parseInt(e.target.value, 10) || 20)
                      }))
                    }
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-orange-500 bg-white"
                  />
                  <span className="text-xs text-slate-500">minutos (rango: 5 - 180 min)</span>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Ajuste: Duración de Pausa */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">
                      Duración de la Pausa (Descanso Visual)
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Segundos que dura la ventana modal Kiosk para relajar la acomodación ocular.
                    </p>
                  </div>
                  <span className="text-sm font-mono font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-xl">
                    {settings.pauseDuration} seg
                  </span>
                </div>

                {/* Botones de Selección Rápida */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {[
                    { sec: 20, label: '20 seg (20-20-20)' },
                    { sec: 60, label: '60 seg (1 min)' },
                    { sec: 180, label: '180 seg (3 min)' },
                    { sec: 300, label: '300 seg (5 min)' }
                  ].map((item) => {
                    const isSelected = settings.pauseDuration === item.sec
                    return (
                      <button
                        key={item.sec}
                        type="button"
                        onClick={() =>
                          setSettings((prev) => ({ ...prev, pauseDuration: item.sec }))
                        }
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/25'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>

                {/* Input Manual Number */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-slate-400">Personalizado:</span>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    value={settings.pauseDuration}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        pauseDuration: Math.max(5, parseInt(e.target.value, 10) || 20)
                      }))
                    }
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-orange-500 bg-white"
                  />
                  <span className="text-xs text-slate-500">segundos (rango: 5 - 600 seg)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* CATEGORÍA 3: MODO KIOSCO */}
          <Card className="p-7">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
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
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Modo Kiosco de Pantalla Completa
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comportamiento de la ventana modal de interceptación
                </p>
              </div>
            </div>

            {/* Ajuste: Modo Estricto */}
            <div className="flex items-center justify-between py-2">
              <div className="max-w-md pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 block">Modo Estricto</span>
                  {settings.strictMode && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                      Sin Postergación
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Deshabilita el botón de &apos;Posponer 2 min&apos; en la pantalla de pausa. El
                  ordenador quedará bloqueado hasta completar la totalidad de los segundos
                  programados.
                </p>
              </div>

              <ToggleSwitch
                checked={settings.strictMode}
                onChange={(val) => setSettings((prev) => ({ ...prev, strictMode: val }))}
              />
            </div>
          </Card>
        </div>

        {/* =================================================================== */}
        {/* COLUMNA DERECHA (1 Columna): RESUMEN & ACCIONES                      */}
        {/* =================================================================== */}
        <div className="flex flex-col gap-6">
          {/* Tarjeta de Resumen y Guardado */}
          <Card className="p-7 flex flex-col justify-between gap-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Resumen de Configuración
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Estado actual de los parámetros de OptiFlow
              </p>

              {/* Lista Resumen */}
              <div className="mt-5 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Inicio con Windows:</span>
                  <span
                    className={`font-bold ${settings.autoStart ? 'text-emerald-600' : 'text-slate-400'}`}
                  >
                    {settings.autoStart ? 'Habilitado' : 'Deshabilitado'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Intervalo de Trabajo:</span>
                  <span className="font-mono font-bold text-slate-900">
                    Cada {settings.workInterval} min
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Duración de Pausa:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {settings.pauseDuration} seg
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Modo Estricto Kiosk:</span>
                  <span
                    className={`font-bold ${settings.strictMode ? 'text-orange-600' : 'text-slate-500'}`}
                  >
                    {settings.strictMode ? 'Activo (Sin escape)' : 'Permite posponer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón Naranja Prominente de Guardar Cambios */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span>Guardando Ajustes...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-center text-slate-400 block">
                Los ajustes se sincronizan inmediatamente en disco y memoria.
              </span>
            </div>
          </Card>

          {/* Información Técnica del Software */}
          <Card className="p-7">
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Información del Entorno
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">OptiFlow Desktop v1.0.0</p>

            <div className="mt-4 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Arquitectura:</span>
                <span className="font-semibold text-slate-800">Electron 35 + Node 22</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Persistencia:</span>
                <span className="font-semibold text-slate-800">optiflow_settings.json</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Base de Datos:</span>
                <span className="font-semibold text-slate-800">SQLite (user_settings)</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">Motor de Visión:</span>
                <span className="font-semibold text-emerald-600">MediaPipe 3D</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Configuracion
