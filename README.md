# Bernie's Chain Watcher

Bernie's Chain Watcher is a powerful chain tracking tool designed specifically for members of the **39th Street Killers**. Using the Torn public API, it provides real-time chain monitoring, timely notifications, and strategic target suggestions to help maintain your chains effectively.

## Features

- **Real-Time Chain Monitoring**
  - Automatic polling every 10 seconds via Torn API
  - Live countdown timer for active chains
  - Manual refresh option available

- **Smart Notifications**
  - Alerts when chain timer reaches 2.5 minutes
  - Notifications every 10 seconds until chain is restored
  - Clickable notifications that redirect to the app
  - Push notifications via OneSignal (Web/PWA)
  - System notifications (Desktop app)

- **Intelligent Target Selection**
  - Automatically displays 10 available targets
  - Targets selected from a pool of 1,000 level 1 players
  - All targets inactive for 30+ days
  - Hospital status verification
  - "Pull Next 10" feature for additional targets

- **Multi-Platform Support**
  - Progressive Web App (PWA) for desktop and mobile
  - Standalone desktop application (Electron)
  - Web browser access

## Quick Start Guide

### Web Version
1. Visit [www.bernieschainwatcher.com](https://www.bernieschainwatcher.com)
2. Allow push notifications when prompted
3. Start monitoring your chains

### PWA Installation
1. Visit [www.bernieschainwatcher.com](https://www.bernieschainwatcher.com)
2. Click the browser's "Install" or "Add to Home Screen" button
3. Allow push notifications when prompted

### Desktop Application
1. Download the pre-compiled application from the `/dist` folder
2. Install and launch the application
3. System notifications are enabled by default

## Important Notes

- Web browser version requires the window to remain open for notifications
- PWA and desktop versions recommended for uninterrupted monitoring
- Push notifications are essential for optimal functionality
- Desktop app uses system notifications instead of OneSignal

## Technical Details

- **Frontend**: JavaScript
- **Desktop Framework**: Electron
- **Notification Service**: OneSignal (Web/PWA)
- **API Integration**: Torn Public API
- **Update Frequency**: 10-second intervals
- **Target Database**: 1,000 pre-selected level 1 players

## Recommendations

For the best experience, we recommend:
1. Using either the PWA or desktop version instead of the web browser version
2. Enabling notifications when prompted
3. Keeping the application running during active chains

## Installation Options

Choose the installation method that best suits your needs:

1. **Web Browser**
   - Pros: Instant access, no installation required
   - Cons: Requires browser to remain open

2. **Progressive Web App**
   - Pros: Desktop/mobile integration, push notifications
   - Cons: Requires modern browser support

3. **Desktop Application**
   - Pros: System notifications, standalone application
   - Cons: Requires installation

## Support

For issues, suggestions, or contributions, please:
1. Create an issue in this repository
2. Include your Torn ID and detailed description of the problem
3. Specify which version of the application you're using

## Disclaimer

This tool is designed exclusively for members of the 39th Street Killers and uses only public API features in compliance with Torn's terms of service.

---
*Bernie's Chain Watcher is not affiliated with Torn. All Torn-related content and materials are property of their respective owners.*
