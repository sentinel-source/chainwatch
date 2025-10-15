/**
 * Preload Script - Secure bridge between main and renderer processes
 * This file runs in a privileged context and exposes safe APIs to the renderer
 */

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs').promises;

/**
 * Expose protected methods that allow the renderer process to use
 * ipcRenderer and Node.js features without giving full access
 */
contextBridge.exposeInMainWorld('electronAPI', {
    /**
     * Send chain status update to main process
     * @param {string} status - Chain status text
     */
    updateChainStatus: (status) => {
        ipcRenderer.send('update-chain-status', status);
    },

    /**
     * Open external URL in default browser (securely)
     * @param {string} url - URL to open
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    openExternal: async (url) => {
        return await ipcRenderer.invoke('open-external', url);
    },

    /**
     * Show native desktop notification
     * @param {Object} options - Notification options
     * @param {string} options.title - Notification title
     * @param {string} options.body - Notification body text
     */
    showNotification: (options) => {
        ipcRenderer.send('show-notification', options);
    },

    /**
     * Get path to resources directory
     * @param {...string} pathSegments - Path segments to join
     * @returns {string} Full path
     */
    getResourcePath: (...pathSegments) => {
        return path.join(__dirname, ...pathSegments);
    },

    /**
     * Read file from the app directory
     * @param {string} filePath - Relative path to file
     * @param {Object} options - Read options (e.g., {encoding: 'utf8'})
     * @returns {Promise<string|Buffer>} File contents
     */
    readFile: async (filePath, options = {}) => {
        try {
            // Sanitize path to prevent directory traversal
            const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
            const fullPath = path.join(__dirname, safePath);
            
            // Ensure the file is within the app directory
            if (!fullPath.startsWith(__dirname)) {
                throw new Error('Access denied: Path is outside app directory');
            }
            
            return await fs.readFile(fullPath, options);
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    },

    /**
     * Platform information
     */
    platform: process.platform,

    /**
     * Get dirname for the preload script location
     */
    dirname: __dirname
});