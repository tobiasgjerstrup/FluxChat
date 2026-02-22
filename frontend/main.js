import { ipcMain } from 'electron';
// Expose app version to renderer via IPC
ipcMain.handle('get-app-version', () => app.getVersion());
// main.js

import electron from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import updaterPkg from 'electron-updater';
const { autoUpdater } = updaterPkg;
const { app, BrowserWindow, dialog, Menu } = electron;
const appVersion = app.getVersion();

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
        title: `FluxChat v${appVersion}`, // Display version at the top
    });
    // Load the Angular app from localhost:4200 for development
    //win.loadURL('http://localhost:4200');
    win.loadURL('https://tboss.dev');
    // Load the built Angular app
    // win.loadFile(path.join(__dirname, 'dist', 'flux', 'browser', 'index.html'));
    console.log(`Window created. App version: ${appVersion}`);
}
// App Lifecycle
app.whenReady().then(() => {
    console.log(`App ready. Running version: ${appVersion}`);
    createWindow();
    // Auto-updater logic
    console.log('Checking for updates...');
    autoUpdater.checkForUpdatesAndNotify();

    // Build menu with standard roles and custom Help/About
    const template = [
        { role: 'fileMenu' },
        { role: 'editMenu' },
        { role: 'viewMenu' },
        { role: 'windowMenu' },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'About',
                            message: `FluxChat\nVersion: ${app.getVersion()}`,
                            buttons: ['OK'],
                        });
                    },
                },
            ],
        },
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    console.log('App activated. Running version:', appVersion);
});

// Auto-updater events
autoUpdater.on('update-available', () => {
    console.log('Update available. Downloading now...');
    dialog.showMessageBox({
        type: 'info',
        title: 'Update available',
        message: 'A new update is available. Downloading now...',
    });
});

autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded. Restarting to apply update...');
    dialog
        .showMessageBox({
            type: 'info',
            title: 'Update ready',
            message: 'Update downloaded. The app will now restart to apply the update.',
        })
        .then(() => {
            autoUpdater.quitAndInstall();
        });
});
