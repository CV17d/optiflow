import React, { useState, useEffect, useCallback } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import type { HistoricalData, DayTrend, RecentSession } from '../../../preload/index.d'

export const HistorialPausas: React.FC = () => {
  const [data, setData] = useState<HistoricalData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const fetchHistoricalData = useCallback(async (isManualRefresh = false): Promise<void> => {
    if (isManualRefresh) {
      setIsRefreshing(true)
    }
    try {
      if (window.electron?.getHistoricalData) {
        const res = await window.electron.getHistoricalData()
        if (res) {
          setData(res)
          setIsLoading(false)
          setIsRefreshing(false)
          return
        }
      }
      if (window.api?.getHistoricalData) {
        const res = await window.api.getHistoricalData()
        if (res) {
          setData(res)
          setIsLoading(false)
          setIsRefreshing(false)
          return
        }
      }
    } catch (err) {
      console.error('[HistorialPausas] Error consultando datos históricos de SQLite vía IPC:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const load = async (): Promise<void> => {
      try {
        if (window.electron?.getHistoricalData) {
          const res = await window.electron.getHistoricalData()
          if (isMounted && res) {
            setData(res)
            setIsLoading(false)
            return
          }
        }
        if (window.api?.getHistoricalData) {
          const res = await window.api.getHistoricalData()
          if (isMounted && res) {
            setData(res)
            setIsLoading(false)
            return
          }
        }
      } catch (err) {
        console.error('[HistorialPausas] Error al cargar historial inicial:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()

    // Sincronización periódica automática cada 6 segundos para reflejar nuevas pausas en tiempo real
    const interval = setInterval(() => {
      if (isMounted) {
        fetchHistoricalData(false)
      }
    }, 6000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [fetchHistoricalData])

  const handleManualRefresh = (): void => {
    fetchHistoricalData(true)
  }

  // Formato de fecha corta DD/MM para las etiquetas del gráfico
  const formatShortDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`
    }
    return dateStr
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col select-none pb-16">
      {/* Encabezado Superior de la Sección */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
            Historial y Pausas
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Registro Cronológico, Adherencia y Auditoría de Descanso Ocular
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SQLite Local (optiflow_local.db)
          </span>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-300 text-xs font-bold text-slate-700 hover:text-orange-600 shadow-2xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            title="Sincronizar datos de SQLite"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : 'text-slate-500'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Estado de Carga (Skeletons) */}
      {isLoading && !data && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-36 bg-white rounded-3xl p-6 border border-slate-100/80 animate-pulse flex flex-col justify-between" />
            <div className="h-36 bg-white rounded-3xl p-6 border border-slate-100/80 animate-pulse flex flex-col justify-between" />
            <div className="h-36 bg-white rounded-3xl p-6 border border-slate-100/80 animate-pulse flex flex-col justify-between" />
          </div>
          <div className="h-80 bg-white rounded-3xl p-8 border border-slate-100/80 animate-pulse" />
          <div className="h-96 bg-white rounded-3xl p-8 border border-slate-100/80 animate-pulse" />
        </div>
      )}

      {/* Contenido Principal con Datos Reales */}
      {data && (
        <div className="flex flex-col gap-8">
          {/* Tarjetas Superiores (3 KPIs en Card) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI 1: Pausas Completadas (Semana) */}
            <Card className="p-6 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  PAUSAS COMPLETADAS (SEMANA)
                </span>
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
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>

              <div>
                <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight block">
                  {data.totalCompletedWeek}
                </span>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-semibold">
                  <svg
                    className="w-4 h-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  <span>Micro-descansos oculares ejecutados</span>
                </div>
              </div>
            </Card>

            {/* KPI 2: Tasa de Adherencia Promedio (%) */}
            <Card className="p-6 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  TASA DE ADHERENCIA PROMEDIO
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
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
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {data.avgAdherenceWeek}%
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      data.avgAdherenceWeek >= 80
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : data.avgAdherenceWeek >= 65
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {data.avgAdherenceWeek >= 80
                      ? 'Excelente'
                      : data.avgAdherenceWeek >= 65
                        ? 'Bueno'
                        : 'Atención'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
                  <svg
                    className="w-4 h-4 text-emerald-600 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                  <span>Protocolo regla 20-20-20 respetado</span>
                </div>
              </div>
            </Card>

            {/* KPI 3: Horas Totales Monitoreadas */}
            <Card className="p-6 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  HORAS TOTALES MONITOREADAS
                </span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
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
              </div>

              <div>
                <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight block">
                  {data.totalHoursMonitored} h
                </span>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Jornada acumulada frente al monitor</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Gráfico de Adherencia de 7 Días */}
          <Card className="p-8 flex flex-col justify-between">
            {/* Cabecera del Gráfico */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    Tendencia de Adherencia (Últimos 7 Días)
                  </h2>
                  <Badge variant="solid-orange">SEMANAL</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Porcentaje de pausas completadas vs. sugeridas por jornada de trabajo
                </p>
              </div>

              {/* Leyenda del Gráfico */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded-md bg-gradient-to-t from-orange-500 to-amber-400 shadow-2xs" />
                  <span>Adherencia Lograda</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-5 border-b-2 border-dashed border-slate-300" />
                  <span>Meta 80% (20-20-20)</span>
                </div>
              </div>
            </div>

            {/* Contenedor del Gráfico de Barras */}
            <div className="relative pt-6 pb-2">
              {/* Línea Guía de Meta 80% */}
              <div
                className="absolute left-0 right-0 border-b border-dashed border-slate-200 pointer-events-none flex justify-end pr-2 z-0"
                style={{ bottom: 'calc(80% * 0.72 + 56px)' }}
              >
                <span className="text-[10px] font-bold text-slate-400 bg-white/90 px-1 rounded -translate-y-2">
                  Meta 80%
                </span>
              </div>

              {/* Columnas de Barras (7 Días) */}
              <div className="grid grid-cols-7 gap-3 sm:gap-6 items-end h-64 relative z-10">
                {data.tendenciaSemana.map((day: DayTrend, idx: number) => {
                  const adherenceVal = Math.max(0, Math.min(100, day.adherence))
                  const barHeightPercent = Math.max(8, adherenceVal)
                  const isGoalMet = adherenceVal >= 80

                  return (
                    <div
                      key={day.date || idx}
                      className="group relative flex flex-col items-center h-full justify-end"
                    >
                      {/* Tooltip Dinámico Flotante */}
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none absolute -top-16 z-30 flex flex-col items-center">
                        <div className="bg-slate-900 text-white rounded-xl py-1.5 px-3 shadow-xl text-center whitespace-nowrap text-xs">
                          <span className="font-bold text-amber-400 block font-mono">
                            {adherenceVal}% Adherencia
                          </span>
                          <span className="text-[10px] text-slate-300 block">
                            {day.completed} completadas • {day.postponed} pospuestas
                          </span>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                      </div>

                      {/* Porcentaje numérico sobre la barra */}
                      <span className="text-[11px] font-extrabold font-mono text-slate-600 mb-2 group-hover:text-orange-600 transition-colors">
                        {adherenceVal}%
                      </span>

                      {/* Riel exterior de la barra */}
                      <div className="w-full max-w-[48px] h-[160px] bg-slate-100/80 group-hover:bg-slate-200/60 rounded-2xl p-1 flex items-end justify-center transition-colors">
                        {/* Barra de progreso coloreada en gradiente naranja */}
                        <div
                          style={{ height: `${barHeightPercent}%` }}
                          className={`w-full rounded-xl transition-all duration-700 ease-out shadow-xs group-hover:brightness-110 ${
                            isGoalMet
                              ? 'bg-gradient-to-t from-orange-500 to-amber-400'
                              : adherenceVal >= 50
                                ? 'bg-gradient-to-t from-orange-400 to-amber-300'
                                : 'bg-gradient-to-t from-amber-400 to-orange-300'
                          }`}
                        />
                      </div>

                      {/* Etiquetas Inferiores del Eje X */}
                      <div className="flex flex-col items-center mt-3 text-center">
                        <span className="text-xs font-bold text-slate-800 leading-tight">
                          {day.dayLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {formatShortDate(day.date)}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 mt-0.5 font-mono">
                          {day.completed}/{day.suggested}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Tabla / Lista de Registros Recientes de Sesiones */}
          <Card className="p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    Registro Cronológico de Sesiones
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {data.sesionesRecientes.length} registros
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Auditoría detallada de las pausas ergonómicas almacenadas en SQLite
                </p>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Almacenamiento Local:</span>
                <span className="font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                  optiflow_local.db • break_logs
                </span>
              </div>
            </div>

            {/* Tabla Estilizada */}
            {data.sesionesRecientes.length > 0 ? (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">FECHA</th>
                      <th className="py-3 px-4">HORA</th>
                      <th className="py-3 px-4">DURACIÓN</th>
                      <th className="py-3 px-4">INTERVENCIÓN</th>
                      <th className="py-3 px-4 text-right">ESTADO FINAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 text-xs">
                    {data.sesionesRecientes.map((session: RecentSession) => {
                      const isCompleted = session.status === 'Completada'

                      return (
                        <tr
                          key={session.id}
                          className="hover:bg-orange-50/20 transition-colors group"
                        >
                          {/* ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-400 group-hover:text-slate-600">
                            #{session.id}
                          </td>

                          {/* FECHA */}
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {session.date}
                          </td>

                          {/* HORA */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {session.time}
                          </td>

                          {/* DURACIÓN */}
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            <span className="inline-flex items-center gap-1">
                              <svg
                                className="w-3.5 h-3.5 text-slate-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {session.duration}
                            </span>
                          </td>

                          {/* INTERVENCIÓN */}
                          <td className="py-3.5 px-4 text-slate-600">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                              Regla 20-20-20 (Descanso Ocular)
                            </span>
                          </td>

                          {/* ESTADO FINAL */}
                          <td className="py-3.5 px-4 text-right">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Completada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                Pospuesta (+2 min)
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Sin registros de pausas todavía
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Las pausas se registrarán automáticamente a medida que completes o pospongas descansos ergonómicos con OptiFlow.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default HistorialPausas
