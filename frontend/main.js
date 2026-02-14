// main.js

import electron from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
const { app, BrowserWindow } = electron;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error Handling
process.on('uncaughtException', (error) => {
    console.error('Unexpected error: ', error);
});
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });
    // Load the Angular app from localhost:4200 for development
    win.loadURL('http://localhost:4200');
    // Load the built Angular app
    // win.loadFile(path.join(__dirname, 'dist', 'flux', 'browser', 'index.html'));
}
// App Lifecycle
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
