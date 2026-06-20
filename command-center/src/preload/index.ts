import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  tracker: {
    read: (): Promise<string | null> => ipcRenderer.invoke('tracker:read'),
    write: (json: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('tracker:write', json),
    getPath: (): Promise<string> => ipcRenderer.invoke('tracker:path'),
    getFileInfo: (): Promise<{
      exists: boolean
      size: number
      lastModified: string
      watcherActive: boolean
    }> => ipcRenderer.invoke('tracker:fileInfo'),
    onUpdated: (cb: (json: string) => void): (() => void) => {
      const handler = (_event: any, json: string) => cb(json)
      ipcRenderer.on('tracker:updated', handler)
      return () => ipcRenderer.removeListener('tracker:updated', handler)
    }
  },
  window: {
    close: () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize')
  }
})
