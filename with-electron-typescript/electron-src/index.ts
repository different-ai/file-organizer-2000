// electron-src/index.ts
import { app, BrowserWindow, ipcMain, dialog, IpcMainEvent } from "electron";
import isDev from "electron-is-dev";
import { join } from "path";
import { format } from "url";
import { processFiles } from "./processFiles";
import { FileMetadata } from "./preload";
import fs from "fs";
import prepareNext from "electron-next";

let mainWindow: BrowserWindow | null;
let selectedFolderPath = "";
export let destinationFolderPath = "";

export const CONFIG_FOLDER_NAME = ".fileorganizer2000";

async function createWindow() {
  await prepareNext("./renderer");
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
    },
  });

  const url = isDev
    ? "http://localhost:8000"
    : format({
        pathname: join(__dirname, "../renderer/out/index.html"),
        protocol: "file:",
        slashes: true,
      });
  mainWindow.loadURL(url);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on("process-files", async (event: IpcMainEvent) => {
  const result = await processFiles(selectedFolderPath, destinationFolderPath);
  event.reply("proposed-changes", result);
});

ipcMain.on("select-folder", async (event: IpcMainEvent) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openDirectory"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    selectedFolderPath = result.filePaths[0];
    event.reply("folder-selected", selectedFolderPath);
    // const allMetadata = await processFiles(
    //   selectedFolderPath,
    //   destinationFolderPath
    // );
    // // allMetadata.forEach((metadata) => {
    // event.reply("proposed-change", metadata);
    // });
    // event.reply("processing-completed");
  }
});

ipcMain.on("select-destination-folder", async (event: IpcMainEvent) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openDirectory"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    destinationFolderPath = result.filePaths[0];
    event.reply("destination-folder-selected", destinationFolderPath);
  }
});

function applyChangesToFileSystem(changes: FileMetadata[]) {
  changes.forEach((change) => {
    const oldPath = join(change.originalFolder, change.originalName);
    const newFilePath = join(destinationFolderPath, change.newName);
    fs.copyFileSync(oldPath, newFilePath);
  });
}

function readMetadataFile() {
  const metadataPath = join(
    selectedFolderPath,
    CONFIG_FOLDER_NAME,
    "metadata.json"
  );
  console.log(`Reading metadata from: ${metadataPath}`);
  const metadata = readMetadataFromFile(metadataPath);
  console.log("Metadata", metadata);
  if (mainWindow) {
    console.log("Sending proposed changes to renderer");
    mainWindow.webContents.send("proposed-changes", metadata);
  }
}

function readMetadataFromFile(filePath: string): FileMetadata[] {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Metadata file does not exist at path: ${filePath}`);
      return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    if (!data) {
      console.warn(`Metadata file is empty at path: ${filePath}`);
      return [];
    }
    const metadataEntries = data
      .split("\n")
      .filter((entry) => entry.trim() !== "");
    return metadataEntries.map((entry) => JSON.parse(entry));
  } catch (error) {
    console.error("Error reading metadata file:", error);
    return [];
  }
}

function writeMetadataToFile(filePath: string, metadata: FileMetadata[]) {
  const configFolderPath = join(selectedFolderPath, CONFIG_FOLDER_NAME);
  console.log(configFolderPath);
  if (!fs.existsSync(configFolderPath)) {
    console.log(`Creating config folder at path: ${configFolderPath}`);
    fs.mkdirSync(configFolderPath);
  }
  const jsonString = metadata.map((entry) => JSON.stringify(entry)).join("\n");
  fs.writeFileSync(filePath, jsonString, "utf-8");
}

function undoChangesInFileSystem(changes: FileMetadata[]) {
  changes.forEach((change) => {
    const currentPath = join(change.newFolder, change.newName);
    const originalPath = join(change.originalFolder, change.originalName);
    fs.renameSync(currentPath, originalPath);
  });
}
