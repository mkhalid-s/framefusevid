// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog operations
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFile: (defaultName) => ipcRenderer.invoke('dialog:saveFile', defaultName),
  
  // File operations
  getFileInfo: (filePath) => ipcRenderer.invoke('file:getInfo', filePath),
  scanFolder: (folderPath) => ipcRenderer.invoke('folder:scan', folderPath),
  
  // FFmpeg operations
  combine: (options) => ipcRenderer.invoke('ffmpeg:combine', options),
  cancelProcess: () => ipcRenderer.invoke('ffmpeg:cancel'),
  
  // FFmpeg event listeners
  onFFmpegStarted: (callback) => {
    ipcRenderer.on('ffmpeg:started', (event, cmd) => callback(cmd));
  },
  onFFmpegProgress: (callback) => {
    ipcRenderer.on('ffmpeg:progress', (event, progress) => callback(progress));
  },
  removeFFmpegListeners: () => {
    ipcRenderer.removeAllListeners('ffmpeg:started');
    ipcRenderer.removeAllListeners('ffmpeg:progress');
  },
  
  // Shell operations
  openPath: (filePath) => ipcRenderer.invoke('shell:openPath', filePath),
  
  // Store operations
  getStore: (key) => ipcRenderer.invoke('store:get', key),
  setStore: (key, value) => ipcRenderer.invoke('store:set', key, value),
  
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // Platform info
  platform: process.platform
});
