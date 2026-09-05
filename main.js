import { app, BrowserWindow, ipcMain } from 'electron';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startWebSocketServer } from './server/websocket-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let wsServer = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 980,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: '#070b14',
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = 'http://localhost:5173';
  const prodUrl = `file://${path.join(__dirname, 'dist/index.html')}`;
  const url = isDev ? devUrl : prodUrl;

  mainWindow.loadURL(url).catch(() => {
    if (!isDev) {
      mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

ipcMain.handle('app:get-platform', () => process.platform);
ipcMain.handle('network:get-local-ip', () => {
  const interfaces = os.networkInterfaces();
  const addresses = Object.values(interfaces).flatMap((entries) => entries || []);
  const privateAddress = addresses.find((entry) => {
    if (entry.family !== 'IPv4' || entry.internal) return false;
    const octets = entry.address.split('.').map(Number);
    return octets[0] === 10
      || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
      || (octets[0] === 192 && octets[1] === 168);
  });
  const localAddress = privateAddress || addresses.find((entry) => entry.family === 'IPv4' && !entry.internal);
  return localAddress?.address || '127.0.0.1';
});
ipcMain.handle('fs:read-file', async (_, filePath) => {
  if (!filePath) {
    return '';
  }

  if (!fs.existsSync(filePath)) {
    return '';
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return content;
});

ipcMain.handle('fs:apply-patch', async (_, payload) => {
  const { filePath, originalCode, suggestedFix } = payload;

  if (!filePath || typeof originalCode !== 'string' || typeof suggestedFix !== 'string') {
    return { ok: false, error: 'Missing filePath, originalCode, or suggestedFix.' };
  }

  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: `File not found: ${filePath}` };
    }

    const currentContent = fs.readFileSync(filePath, 'utf8');
    if (!currentContent.includes(originalCode)) {
      return { ok: false, error: 'The original code was not found in the target file.' };
    }

    const updatedContent = currentContent.replace(originalCode, suggestedFix);
    fs.writeFileSync(filePath, updatedContent, 'utf8');

    if (mainWindow) {
      mainWindow.webContents.send('ws:status', {
        type: 'APPLIED_SUCCESS',
        filePath,
        message: 'Patch applied successfully.',
      });
    }

    wsServer?.broadcast({
      type: 'PATCH_APPLIED',
      filePath,
      message: 'Patch applied successfully.',
    });

    return { ok: true, filePath };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('app:ready', () => ({
  platform: process.platform,
  isDev,
}));

app.whenReady().then(async () => {
  createWindow();
  try {
    let port = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 8080;
    const onMessage = (message, socket) => {
      mainWindow?.webContents.send('ws:alert', message);
      socket.send(JSON.stringify({ type: 'ALERT_RECEIVED', filePath: message.filePath }));
    };

    try {
      wsServer = await startWebSocketServer({ port, onMessage });
    } catch (error) {
      if (process.env.WS_PORT) throw error;
      port = 8081;
      wsServer = await startWebSocketServer({ port, onMessage });
    }

    const notifyRenderer = () => mainWindow?.webContents.send('ws:status', {
      type: 'WS_STARTED',
      port,
      message: `WebSocket listening on ws://0.0.0.0:${port}`,
    });
    if (mainWindow?.webContents.isLoading()) {
      mainWindow.webContents.once('did-finish-load', notifyRenderer);
    } else {
      notifyRenderer();
    }
  } catch (err) {
    console.error('Failed to start WebSocket server:', err && err.stack ? err.stack : err);
    if (mainWindow) {
      mainWindow.webContents.send('ws:status', {
        type: 'WS_ERROR',
        message: err && err.message ? err.message : String(err),
      });
    }
  }
  // Window control IPC handlers
  ipcMain.on('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    if (mainWindow) mainWindow.close();
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (wsServer) {
    wsServer.close();
  }
});
