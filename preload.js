import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: () => ipcRenderer.invoke('app:get-platform'),
  getLocalIp: () => ipcRenderer.invoke('network:get-local-ip'),
  ready: () => ipcRenderer.invoke('app:ready'),
  readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  applyPatch: (payload) => ipcRenderer.invoke('fs:apply-patch', payload),
  onWebSocketAlert: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('ws:alert', listener);
    return () => ipcRenderer.removeListener('ws:alert', listener);
  },
  onWebSocketStatus: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('ws:status', listener);
    return () => ipcRenderer.removeListener('ws:status', listener);
  },
  windowControls: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
});
