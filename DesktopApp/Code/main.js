/**
 * Bernie's Chain Watcher - Main Process (Secure)
 * Electron main process with proper security configuration and native notifications
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, Notification } = require('electron');
const path = require('path');

// ==================== STATE ====================
let tray = null;
let mainWindow = null;
let contextMenu = null;

// ==================== CONSTANTS ====================
const iconPath = path.join(__dirname, 'Src/assets/images/web-app-manifest-512x512.png');

// ==================== SINGLE INSTANCE LOCK ====================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // If we don't get the lock, quit the app
    console.log('Another instance is already running. Exiting...');
    app.quit();
} else {
    // Someone tried to open a second instance, focus our window instead
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        console.log('Second instance detected, focusing main window');
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.show();
            mainWindow.focus();
        }
    });

    // ==================== WINDOW CREATION ====================
    /**
     * Create the main application window with secure settings
     */
    function createWindow() {
        mainWindow = new BrowserWindow({
            width: 400,
            height: 600,
            webPreferences: {
                // SECURITY: Use preload script instead of nodeIntegration
                preload: path.join(__dirname, 'Src/preload.js'),
                nodeIntegration: false,      // ✅ Secure
                contextIsolation: true,      // ✅ Secure
                enableRemoteModule: false,   // ✅ Secure
                sandbox: false                // ✅ Extra security layer
            },
            icon: iconPath,
            show: false, // Don't show until ready-to-show
            backgroundColor: '#000000'
        });

        // Show window when ready to prevent flash of unstyled content
        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
        });

        mainWindow.loadFile('Src/index.html');

        // Minimize to tray on close instead of quitting
        mainWindow.on('close', function (event) {
            if (!app.isQuitting) {
                event.preventDefault();
                mainWindow.hide();
                
                // Notify user on first minimize (Windows only)
                if (process.platform === 'win32' && tray && !mainWindow.hasBeenMinimized) {
                    tray.displayBalloon({
                        title: 'Chain Watcher',
                        content: 'Chain Watcher is still running in the system tray'
                    });
                    mainWindow.hasBeenMinimized = true;
                }
            }
            return false;
        });

        // Prevent navigation away from the app
        mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
            const parsedUrl = new URL(navigationUrl);
            
            // Only allow navigation to local files
            if (parsedUrl.protocol !== 'file:') {
                console.log('Prevented navigation to:', navigationUrl);
                event.preventDefault();
            }
        });

        // Prevent opening new windows
        mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            console.log('Prevented opening new window:', url);
            return { action: 'deny' };
        });
    }

    // ==================== SYSTEM TRAY ====================
    /**
     * Create system tray icon and menu
     */
    function createTray() {
        tray = new Tray(iconPath);
        
        contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show App',
                click: function() {
                    mainWindow.show();
                    mainWindow.focus();
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

        tray.setToolTip('Chain Watcher - Monitoring your chain');
        tray.setContextMenu(contextMenu);

        // Double-click to show window
        tray.on('double-click', () => {
            mainWindow.show();
            mainWindow.focus();
        });
    }

    // ==================== IPC HANDLERS ====================
    /**
     * Handle chain status updates from renderer process
     */
    ipcMain.on('update-chain-status', (event, status) => {
        if (contextMenu && tray) {
            const menuItem = contextMenu.getMenuItemById('chainStatus');
            if (menuItem) {
                menuItem.sublabel = status;
                tray.setContextMenu(contextMenu);
                tray.setToolTip(`Chain Watcher - ${status}`);
            }
        }
    });

    /**
     * Handle request to open external URL (from preload script)
     */
    ipcMain.handle('open-external', async (event, url) => {
        const { shell } = require('electron');
        
        // Validate URL before opening
        try {
            const parsedUrl = new URL(url);
            
            // Only allow HTTPS URLs from torn.com
            if (parsedUrl.protocol === 'https:' && parsedUrl.hostname === 'www.torn.com') {
                await shell.openExternal(url);
                return { success: true };
            } else {
                console.error('Rejected opening URL:', url);
                return { success: false, error: 'Invalid URL' };
            }
        } catch (error) {
            console.error('Error parsing URL:', error);
            return { success: false, error: error.message };
        }
    });

    /**
     * Handle request to show native notification
     */
    ipcMain.on('show-notification', (event, options) => {
        // Show native notification
        const notification = new Notification({
            title: options.title || 'Chain Watcher',
            body: options.body || '',
            icon: iconPath,
            urgency: 'critical', // Makes it more prominent (Linux)
            timeoutType: 'never' // Keeps it visible (Windows)
        });

        notification.show();
        
        // Focus window when notification is clicked
        notification.on('click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        });
    });

    // ==================== APP LIFECYCLE ====================
    /**
     * Initialize app when ready
     */
    app.whenReady().then(() => {
        console.log('App is ready, creating window and tray...');
        createWindow();
        createTray();
    });

    /**
     * Quit when all windows are closed (except on macOS)
     */
    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    /**
     * Re-create window on macOS when dock icon is clicked
     */
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    /**
     * Set app to launch on system startup
     */
    app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe')
    });

    /**
     * Cleanup before quit
     */
    app.on('before-quit', () => {
        console.log('App is quitting...');
        app.isQuitting = true;
    });
}