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

export interface CustomElectronAPI extends ElectronAPI {
  getAppUsageStats?: () => Promise<AppUsageStat[]>
  getBreakStats?: () => Promise<BreakStats>
}

export interface CustomAPI {
  getAppUsageStats?: () => Promise<AppUsageStat[]>
  getBreakStats?: () => Promise<BreakStats>
}

declare global {
  interface Window {
    electron: CustomElectronAPI
    api: CustomAPI
  }
}
