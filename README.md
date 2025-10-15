# Bernie's Chain Watcher

Bernie's Chain Watcher is a desktop chain tracking application designed specifically for members of the **39th Street Killers**. Using the Torn public API, it provides real-time chain monitoring, native OS notifications, and strategic target suggestions to help maintain your chains effectively.

## Features

### 🔔 **Smart Notifications**
- Native OS notifications (Windows Action Center, macOS Notification Center)
- Alerts when chain timer reaches 2.5 minutes
- Repeat notifications every 10 seconds until chain is restored
- Clickable notifications that bring the app to focus
- System tray integration for background monitoring

### ⏱️ **Real-Time Chain Monitoring**
- Automatic polling every 10 seconds via Torn API
- Drift-free countdown timer synchronized with Torn servers
- Live chain count display
- Manual refresh option available
- System tray status updates

### 🎯 **Intelligent Target Selection**
- Automatically displays 10 available targets when chain drops below 2.5 minutes
- Targets selected from a pool of 1,000 level 1 players
- All targets inactive for 30+ days
- Real-time hospital status verification
- "Pull Next Targets" feature for additional options
- Direct links to Torn profiles (click to open in browser)

### 🔒 **Security & Performance**
- Secure Electron architecture with context isolation
- Protected IPC communication between processes
- Efficient API rate limiting (90 calls per minute)
- Automatic rate limit management with countdown display
- No memory leaks - proper resource cleanup

## Installation

### Prerequisites
- Windows, macOS, or Linux operating system
- Active Torn account with API access

### Quick Start

1. **Download** the latest release from the `/dist` folder or [Releases page](../../releases)
2. **Run** the executable (no installation required - portable app)
3. **Enter** your Torn API key when prompted
4. **Start monitoring** - the app will begin tracking your faction's chain automatically

### Obtaining Your Torn API Key

1. Visit your [Torn Preferences](https://www.torn.com/preferences.php#tab=api)
2. Create a new API key (if you don't have one)
3. Copy the key and paste it into Chain Watcher
4. Your key is stored locally and encrypted

## Usage

### First Launch
- The app will prompt you for your Torn API key
- Once entered, the app immediately begins monitoring your faction's chain
- The app minimizes to the system tray - it continues running in the background

### System Tray
- **Double-click** the tray icon to show/hide the app window
- **Right-click** for menu options:
  - View current chain status
  - Show app window
  - Quit application

### Notifications
- When your chain drops to 2.5 minutes remaining, you'll receive a notification
- Click the notification to bring the app to focus
- Notifications repeat every 10 seconds until the chain is extended

### Target List
- Appears automatically when chain time is critical
- Click any target's link to open their Torn profile in your default browser
- Use "Pull Next Targets" to fetch a new batch of 10 available targets
- Targets are verified in real-time for availability

## Configuration

### API Call Management
- The app automatically manages API calls to stay within Torn's rate limits
- Maximum 90 calls per minute
- When limit is approached, the app pauses and displays a countdown
- Call counter visible in the app interface

### Auto-Start
- The app is configured to start automatically on system boot
- To disable: Remove from your system's startup applications

### Data Storage
- API key: Stored in browser localStorage (encrypted)
- Target database: `data.json` file in the app directory
- No cloud storage - all data remains on your device

## Technical Details

- **Framework**: Electron 28.x
- **Language**: JavaScript (ES6+)
- **Architecture**: Secure IPC with context isolation
- **API Integration**: Torn Public API (read-only)
- **Update Frequency**: 10-second polling interval
- **Target Pool**: 1,000 pre-selected level 1 players
- **Notification System**: Native OS notifications
- **Security**: 
  - Context isolation enabled
  - Node integration disabled
  - Sandboxed renderer process
  - URL validation for external links

## Building from Source

### Requirements
- Node.js 14.x or higher
- npm or yarn

### Build Instructions

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Build portable executable
npm run build
```

The built application will be in the `dist/` folder.

## Troubleshooting

### Notifications Not Showing
- **Windows**: Check Windows notification settings and ensure "Focus Assist" is not blocking
- **macOS**: System Preferences → Notifications → Allow notifications from Chain Watcher
- **Linux**: Ensure your notification daemon is running

### API Key Issues
- Ensure your API key has not expired
- Verify the key is entered correctly (no extra spaces)
- Check your Torn account has API access enabled

### App Not Starting
- Check if another instance is already running (only one instance allowed)
- Look in system tray - the app may be running in the background
- Check console logs for error messages

### Chain Data Not Updating
- Verify your internet connection
- Check if Torn API is accessible
- Ensure you haven't hit the API rate limit

## Support

For issues, suggestions, or contributions:
1. Check existing [Issues](../../issues) to see if your problem is already reported
2. Create a new issue with:
   - Your operating system and version
   - Detailed description of the problem
   - Steps to reproduce
   - Any error messages or console logs

## Changelog

### Version 2.0.0 (Latest)
- ✨ Rebuilt with secure Electron architecture
- ✨ Native OS notifications
- ✨ Fixed timer drift issue
- ✨ Improved API rate limiting
- ✨ Better error handling
- ✨ Memory leak prevention
- 🔒 Enhanced security (context isolation, sandboxing)

## Disclaimer

**Important**: This tool is designed for members of the 39th Street Killers and uses only public API features in compliance with Torn's terms of service. 

- This is an unofficial tool and is not affiliated with, endorsed by, or connected to Torn or its developers
- Use at your own risk
- The developers are not responsible for any account issues that may arise from use
- Always follow Torn's terms of service and API usage guidelines

## License

ISC License - See LICENSE file for details

---

**Bernie's Chain Watcher** - Keeping your chains alive, one notification at a time 🔗

*All Torn-related content and materials are property of their respective owners.*