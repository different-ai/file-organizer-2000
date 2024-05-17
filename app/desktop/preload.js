const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('electron', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  watchFolder: (folderPath) => ipcRenderer.send('watch-folder', folderPath),
  onNewFile: (callback) => ipcRenderer.on('new-file', (event, filename) => callback(filename)),
});