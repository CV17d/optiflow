import { ElectronAPI } from '@electron-toolkit/preload'

export interface AppUsageStat {
  app: string
  count: number
  percentage: number
}

export interface CustomElectronAPI extends ElectronAPI {
  getAppUsageStats?: () => Promise<AppUsageStat[]>
}

export interface CustomAPI {
  getAppUsageStats?: () => Promise<AppUsageStat[]>
}

declare global {
  interface Window {
    electron: CustomElectronAPI
    api: CustomAPI
  }
}
