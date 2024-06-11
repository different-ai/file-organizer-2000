// electron-src/preload.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

export interface FileMetadata {
  newName: string;
  newFolder: string;
  metadata: {
    content: string;
  };
  shouldCreateNewFolder: boolean;
  moved: boolean;
  originalFolder: string;
  originalName: string;
}


contextBridge.exposeInMainWorld("electron", {
  selectFolder: () => ipcRenderer.send("select-folder"),
  onFolderSelected: (callback: (event: any, folderPath: string) => void) =>
    ipcRenderer.on("folder-selected", callback),
  stopOnFolderSelected: () => ipcRenderer.removeAllListeners("folder-selected"),

  selectDestinationFolder: () => ipcRenderer.send("select-destination-folder"),
  onDestinationFolderSelected: (
    callback: (event: any, folderPath: string) => void
  ) => ipcRenderer.on("destination-folder-selected", callback),
  stopOnDestinationFolderSelected: () =>
    ipcRenderer.removeAllListeners("destination-folder-selected"),

  processFiles: (sourceFolder: string, destinationFolder: string) =>
    ipcRenderer.send("process-files", sourceFolder, destinationFolder),
});
