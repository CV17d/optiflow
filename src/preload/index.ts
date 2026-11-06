import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getAppUsageStats: (): Promise<unknown> => ipcRenderer.invoke('get-app-usage-stats'),
  getBreakStats: (): Promise<unknown> => ipcRenderer.invoke('get-break-stats'),
  getHistoricalData: (): Promise<unknown> => ipcRenderer.invoke('get-historical-data'),
  getSettings: (): Promise<unknown> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: unknown): Promise<unknown> => ipcRenderer.invoke('save-settings', settings)
}

const extendedElectron = {
  ...electronAPI,
  getAppUsageStats: (): Promise<unknown> => ipcRenderer.invoke('get-app-usage-stats'),
  getBreakStats: (): Promise<unknown> => ipcRenderer.invoke('get-break-stats'),
  getHistoricalData: (): Promise<unknown> => ipcRenderer.invoke('get-historical-data'),
  getSettings: (): Promise<unknown> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: unknown): Promise<unknown> => ipcRenderer.invoke('save-settings', settings)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', extendedElectron)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = extendedElectron
  // @ts-ignore (define in dts)
  window.api = api
}
