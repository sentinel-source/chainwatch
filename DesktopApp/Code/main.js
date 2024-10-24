const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
let tray = null;
let mainWindow = null;
let contextMenu = null;

// Define icon path
const iconPath = path.join(__dirname, 'src/assets/images/web-app-manifest-512x512.png');

// Enforce single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // If we don't get the lock, quit the app
    app.quit();
} else {
    // Someone tried to open a second instance, focus our window instead
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.show();
            mainWindow.focus();
        }
    });

    function createWindow() {
        mainWindow = new BrowserWindow({
            width: 400,
            height: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            icon: iconPath
        });

        mainWindow.loadFile('src/index.html');

        mainWindow.on('close', function (event) {
            if (!app.isQuitting) {
                event.preventDefault();
                mainWindow.hide();
            }
            return false;
        });
    }

    function createTray() {
        tray = new Tray(iconPath);
        
        contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show App',
                click: function() {
                    mainWindow.show();
                }
            },
            {
                label: 'Chain Status',
                sublabel: 'No active chain',
                enabled: false,
                id: 'chainStatus'
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                click: function() {
                    app.isQuitting = true;
                    app.quit();
                }
            }
        ]);

        tray.setToolTip('Chain Watcher');
        tray.setContextMenu(contextMenu);

        tray.on('double-click', () => {
            mainWindow.show();
        });
    }

    // Handle chain status updates from renderer
    ipcMain.on('update-chain-status', (event, status) => {
        if (contextMenu) {
            const menuItem = contextMenu.getMenuItemById('chainStatus');
            if (menuItem) {
                menuItem.sublabel = status;
                tray.setContextMenu(contextMenu);
            }
        }
    });

    app.whenReady().then(() => {
        createWindow();
        createTray();
    });

    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe')
    });
}
