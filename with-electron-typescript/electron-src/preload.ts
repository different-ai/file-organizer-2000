/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { contextBridge, ipcRenderer } from "electron";
import { IpcRendererEvent } from "electron/main";

// We are using the context bridge to securely expose NodeAPIs.
// Please note that many Node APIs grant access to local system resources.
// Be very cautious about which globals and APIs you expose to untrusted remote content.
contextBridge.exposeInMainWorld("electron", {
  selectFolder: () => ipcRenderer.send("select-folder"),
  onFolderSelected: (handler: (event: IpcRendererEvent, folderPath: string) => void) =>
    ipcRenderer.on("folder-selected", handler),
  onNewFile: (handler: (event: IpcRendererEvent, file: any) => void) =>
    ipcRenderer.on("new-file", handler),
  stopOnNewFile: (handler: (event: IpcRendererEvent, file: any) => void) =>
    ipcRenderer.removeListener("new-file", handler),
});
