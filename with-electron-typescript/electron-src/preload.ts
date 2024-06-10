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
  onFolderSelected: (
    callback: (event: IpcRendererEvent, folderPath: string) => void
  ) => ipcRenderer.on("folder-selected", callback),
  validateChange: (change: FileMetadata) =>
    ipcRenderer.send("validate-change", change),
  applyChanges: () => ipcRenderer.send("apply-changes"),
  undo: () => ipcRenderer.send("undo"),
  onProposedChanges: (
    callback: (event: IpcRendererEvent, changes: FileMetadata[]) => void
  ) => ipcRenderer.on("proposed-changes", callback),
  stopOnFolderSelected: (
    callback: (event: Electron.IpcRendererEvent, folderPath: string) => void
  ) => ipcRenderer.removeListener("folder-selected", callback),
});
