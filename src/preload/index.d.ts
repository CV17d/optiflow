import { ElectronAPI } from '@electron-toolkit/preload'

export interface AppUsageStat {
  app: string
  count: number
  percentage: number
}

export interface BreakStats {
  suggested: number
  completed: number
  postponed: number
  adherence: string
  adherencePercentage: number
}

export interface DayTrend {
  date: string
  dayLabel: string
  completed: number
  postponed: number
  suggested: number
  adherence: number
  sessionMinutes: number
}

export interface RecentSession {
  id: number
  date: string
  time: string
  duration: string
  status: 'Completada' | 'Pospuesta'
}

export interface HistoricalData {
  tendenciaSemana: DayTrend[]
  sesionesRecientes: RecentSession[]
  totalCompletedWeek: number
  avgAdherenceWeek: number
  totalHoursMonitored: number
}

export interface UserSettings {
  autoStart: boolean
  workInterval: number
  pauseDuration: number
  strictMode: boolean
}

export interface CustomElectronAPI extends ElectronAPI {
  getAppUsageStats?: () => Promise<AppUsageStat[]>
  getBreakStats?: () => Promise<BreakStats>
  getHistoricalData?: () => Promise<HistoricalData>
  getSettings?: () => Promise<UserSettings>
  saveSettings?: (settings: Partial<UserSettings>) => Promise<UserSettings>
}

export interface CustomAPI {
  getAppUsageStats?: () => Promise<AppUsageStat[]>
  getBreakStats?: () => Promise<BreakStats>
  getHistoricalData?: () => Promise<HistoricalData>
  getSettings?: () => Promise<UserSettings>
  saveSettings?: (settings: Partial<UserSettings>) => Promise<UserSettings>
}

declare global {
  interface Window {
    electron: CustomElectronAPI
    api: CustomAPI
  }
}
