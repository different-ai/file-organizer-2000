const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const next = require('next');

let mainWindow;
const nextApp = next({ dev: process.env.NODE_ENV !== 'production', dir: path.join(__dirname, '../') });
const nextHandler = nextApp.getRequestHandler();

async function createWindow() {
  const isDev = (await import('electron-is-dev')).default;
  await nextApp.prepare();

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '../public/big-logo.png'),
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  const server = createServer((req, res) => {
    nextHandler(req, res);
  });

  let port = process.env.PORT || 3000;
  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    mainWindow.loadURL(url);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      port += 1;
      server.listen(port, () => {
        const url = `http://localhost:${port}`;
        mainWindow.loadURL(url);
      });
    } else {
      console.error('Server error:', err);
      throw err;
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow).catch(err => {
  console.error('Failed to create window:', err);
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

ipcMain.on('watch-folder', (event, folderPath) => {
  fs.watch(folderPath, (eventType, filename) => {
    if (eventType === 'rename' && filename) {
      event.sender.send('new-file', filename);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});