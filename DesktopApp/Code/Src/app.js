/**
 * Bernie's Chain Watcher - Desktop Application (Secure Version)
 * Refactored with secure Electron architecture and native notifications
 */

// ==================== DOM ELEMENTS ====================
const chainInfoDiv = document.getElementById('chain-info');
const targetsUl = document.getElementById('targets');
const refreshBtn = document.getElementById('refresh-btn');
const apiCallCounterDiv = document.getElementById('api-call-counter');
const apiCallTimerDiv = document.getElementById('api-call-timer');
const refreshCountdownDiv = document.getElementById('refreshCountdownDiv');

// ==================== STATE MANAGEMENT ====================
const state = {
    // Target management
    allTargets: [],
    displayedTargets: [],
    checkedTargetIds: new Set(),
    
    // API management
    apiKey: null,
    apiCallCount: 0,
    firstCallTime: null,
    isPaused: false,
    
    // Chain tracking
    chainEndTime: null,
    currentChainCount: 0,
    targetsFetched: false,
    lastNotificationTime: 0,
    
    // Intervals
    fetchIntervalId: null,
    countdownIntervalId: null,
    refreshCountdownIntervalId: null,
    pauseCountdownIntervalId: null
};

// ==================== CONSTANTS ====================
const CONFIG = {
    API_CALL_LIMIT: 90,
    REFRESH_INTERVAL: 10, // seconds
    RATE_LIMIT_WINDOW: 60, // seconds
    CHAIN_WARNING_THRESHOLD: 150, // 2.5 minutes in seconds
    NOTIFICATION_COOLDOWN: 10000, // 10 seconds in milliseconds
    TARGET_FETCH_COUNT: 10,
    MAX_TARGET_ATTEMPTS: 50,
    API_REQUEST_DELAY: 100, // milliseconds between requests
    FACTION_ID: 19
};

// ==================== WARNING UI ELEMENT ====================
const warningDiv = document.createElement('div');
warningDiv.style.color = "yellow";
warningDiv.style.fontSize = "24px";
warningDiv.style.fontWeight = "bold";
warningDiv.style.textAlign = "center";
warningDiv.style.marginBottom = "10px";

// Pull Next Targets button
const pullNextBtn = document.createElement('button');
pullNextBtn.textContent = "Pull Next Targets";
pullNextBtn.classList.add('btn');

// ==================== INITIALIZATION ====================
/**
 * Initialize the application
 */
function init() {
    console.log('Initializing Chain Watcher...');
    
    setupApiKeyHandling();
    setupEventListeners();
    loadAllTargets();
    
    if (state.apiKey) {
        startApplication();
    }
    
    console.log('Chain Watcher initialized');
}

/**
 * Start the main application loop
 */
function startApplication() {
    fetchChainData();
    startFetchInterval();
    startRefreshCountdown();
}

// ==================== API KEY MANAGEMENT ====================
/**
 * Setup API key input, storage, and UI handling
 */
function setupApiKeyHandling() {
    const apiKeyContainer = document.getElementById('api-key-container');
    const savedApiKeyContainer = document.getElementById('saved-api-key-container');
    const savedApiKeySpan = document.getElementById('saved-api-key');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const clearApiKeyBtn = document.getElementById('clear-api-key-btn');
    const appContentElements = document.querySelectorAll('.app-content');
    
    /**
     * Toggle visibility of app content sections
     */
    const toggleAppContent = (show) => {
        appContentElements.forEach(el => {
            el.style.display = show ? 'block' : 'none';
        });
    };

    // Initially hide all app content
    toggleAppContent(false);

    // Check for stored API key
    const storedApiKey = localStorage.getItem('apiKey');

    if (storedApiKey) {
        state.apiKey = storedApiKey;
        apiKeyContainer.style.display = 'none';
        savedApiKeyContainer.style.display = 'block';
        savedApiKeySpan.textContent = storedApiKey;
        toggleAppContent(true);
    } else {
        apiKeyContainer.style.display = 'block';
        savedApiKeyContainer.style.display = 'none';
        toggleAppContent(false);
    }

    // Save API key handler
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('apiKey', apiKey);
            location.reload();
        } else {
            showError("Please enter a valid API key.");
        }
    });

    // Clear API key handler
    clearApiKeyBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your API key?')) {
            localStorage.removeItem('apiKey');
            location.reload();
        }
    });
}

// ==================== EVENT LISTENERS ====================
/**
 * Setup all event listeners
 */
function setupEventListeners() {
    refreshBtn.addEventListener('click', () => {
        console.log('Manual refresh triggered');
        fetchChainData();
    });
    
    pullNextBtn.addEventListener('click', () => {
        console.log('Pull next targets triggered');
        fetchTargets();
    });
    
    window.addEventListener('beforeunload', cleanup);
}

// ==================== INTERVAL MANAGEMENT ====================
/**
 * Start the automatic fetch interval
 */
function startFetchInterval() {
    clearInterval(state.fetchIntervalId);
    
    state.fetchIntervalId = setInterval(() => {
        if (!state.isPaused) {
            fetchChainData();
        }
    }, CONFIG.REFRESH_INTERVAL * 1000);
}

/**
 * Start the refresh countdown display
 */
function startRefreshCountdown() {
    let countdown = CONFIG.REFRESH_INTERVAL;
    
    clearInterval(state.refreshCountdownIntervalId);
    
    state.refreshCountdownIntervalId = setInterval(() => {
        countdown--;
        
        if (refreshCountdownDiv) {
            refreshCountdownDiv.textContent = `Next refresh in ${countdown} seconds`;
        }
        
        if (countdown <= 0) {
            countdown = CONFIG.REFRESH_INTERVAL;
        }
    }, 1000);
}

/**
 * Start the dynamic chain countdown timer
 * Recalculates from server time on each tick to prevent drift
 */
function startChainCountdown() {
    clearInterval(state.countdownIntervalId);
    
    state.countdownIntervalId = setInterval(() => {
        // Recalculate from actual end time to prevent drift
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = state.chainEndTime - currentTime;

        if (timeRemaining > 0) {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            
            // Display chain count and time
            chainInfoDiv.innerHTML = `<p>Chain: ${state.currentChainCount}<br>Time remaining: ${minutes} minutes, ${seconds} seconds</p>`;
            
            // Update tray via secure IPC
            const status = `Chain: ${state.currentChainCount} (${minutes}m ${seconds}s)`;
            window.electronAPI.updateChainStatus(status);
            
            // Check if we need to show warning and fetch targets
            if (timeRemaining <= CONFIG.CHAIN_WARNING_THRESHOLD) {
                if (!state.targetsFetched) {
                    fetchTargets();
                    state.targetsFetched = true;
                }
                showChainExpiringWarning();
            }
        } else {
            stopChainCountdown();
            chainInfoDiv.innerHTML = '<p>Chain expired or no active chain</p>';
            window.electronAPI.updateChainStatus('No active chain');
            hideTargets();
            hideChainExpiringWarning();
            state.targetsFetched = false;
        }
    }, 1000);
}

/**
 * Stop the chain countdown timer
 */
function stopChainCountdown() {
    clearInterval(state.countdownIntervalId);
    state.countdownIntervalId = null;
}

/**
 * Cleanup all intervals and resources
 */
function cleanup() {
    console.log('Cleaning up resources...');
    clearInterval(state.fetchIntervalId);
    clearInterval(state.countdownIntervalId);
    clearInterval(state.refreshCountdownIntervalId);
    clearInterval(state.pauseCountdownIntervalId);
}

// ==================== API CALL MANAGEMENT ====================
/**
 * Increment API call counter and check limits
 */
function incrementApiCallCount() {
    state.apiCallCount++;
    apiCallCounterDiv.textContent = `API Calls: ${state.apiCallCount}`;
    checkApiLimit();
}

/**
 * Check if API call limit has been reached
 */
function checkApiLimit() {
    const currentTime = Date.now();
    
    if (!state.firstCallTime) {
        state.firstCallTime = currentTime;
    }
    
    const elapsedTime = (currentTime - state.firstCallTime) / 1000;
    
    // Reset counter if more than 60 seconds have passed
    if (elapsedTime > CONFIG.RATE_LIMIT_WINDOW) {
        resetApiCallCount();
        return;
    }
    
    // Pause if we've hit the limit within 60 seconds
    if (state.apiCallCount >= CONFIG.API_CALL_LIMIT) {
        const remainingTime = Math.ceil(CONFIG.RATE_LIMIT_WINDOW - elapsedTime);
        pauseApiCalls(remainingTime);
    }
}

/**
 * Pause API calls for a specified duration
 * @param {number} duration - Duration in seconds
 */
function pauseApiCalls(duration) {
    console.log(`API call limit reached. Pausing for ${duration} seconds...`);
    state.isPaused = true;
    let countdown = duration;
    
    clearInterval(state.pauseCountdownIntervalId);

    state.pauseCountdownIntervalId = setInterval(() => {
        countdown--;
        apiCallTimerDiv.textContent = `API calls paused. Resuming in ${countdown} seconds...`;

        if (countdown <= 0) {
            clearInterval(state.pauseCountdownIntervalId);
            apiCallTimerDiv.textContent = '';
            state.isPaused = false;
            resetApiCallCount();
            console.log('API calls resumed');
        }
    }, 1000);
}

/**
 * Reset API call counter and timer
 */
function resetApiCallCount() {
    state.apiCallCount = 0;
    state.firstCallTime = Date.now();
    apiCallCounterDiv.textContent = `API Calls: 0`;
}

// ==================== CHAIN DATA FETCHING ====================
/**
 * Fetch chain data from Torn API
 */
async function fetchChainData() {
    if (state.isPaused) {
        console.log('Skipping fetch - API calls paused');
        return;
    }

    try {
        console.log('Fetching chain data...');
        
        const response = await fetch(
            `https://api.torn.com/faction/${CONFIG.FACTION_ID}?selections=chain&key=${state.apiKey}`
        );
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for API error
        if (data.error) {
            throw new Error(`API Error: ${data.error.error}`);
        }

        console.log("Chain Data:", data);
        incrementApiCallCount();
        updateChainUI(data.chain);
        
    } catch (error) {
        console.error("Error fetching chain data:", error);
        showError(`Error fetching chain data: ${error.message}`);
        chainInfoDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

/**
 * Update the chain UI with new data
 * @param {Object} chainData - Chain data from API
 */
function updateChainUI(chainData) {
    const currentTime = Math.floor(Date.now() / 1000);
    state.chainEndTime = chainData.end;
    state.currentChainCount = chainData.current || 0;
    const timeRemaining = state.chainEndTime - currentTime;

    const targetHeader = document.getElementById('target-header');

    if (timeRemaining > 0 && state.currentChainCount > 0) {
        // Active chain
        if (!state.countdownIntervalId) {
            startChainCountdown();
        }

        if (timeRemaining <= CONFIG.CHAIN_WARNING_THRESHOLD) {
            // Chain is expiring soon
            if (!state.targetsFetched) {
                fetchTargets();
                state.targetsFetched = true;
            }
            targetsUl.style.display = 'block';
            targetHeader.style.display = 'block';
            showChainExpiringWarning();
        } else {
            // Chain is safe
            hideTargets();
            hideChainExpiringWarning();
            state.targetsFetched = false;
        }
    } else {
        // No active chain
        stopChainCountdown();
        chainInfoDiv.innerHTML = '<p>No active chain</p>';
        window.electronAPI.updateChainStatus('No active chain');
        hideTargets();
        hideChainExpiringWarning();
        state.targetsFetched = false;
    }
}

// ==================== TARGET MANAGEMENT ====================
/**
 * Load all target IDs from data.json
 */
async function loadAllTargets() {
    try {
        const data = await window.electronAPI.readFile('data.json', { encoding: 'utf8' });
        state.allTargets = JSON.parse(data);
        console.log(`Loaded ${state.allTargets.length} targets from data.json`);
    } catch (error) {
        console.error("Error loading targets:", error);
        showError("Failed to load target database");
    }
}

/**
 * Fetch and display available targets
 */
async function fetchTargets() {
    console.log('Fetching available targets...');
    targetsUl.innerHTML = '<li>Loading targets...</li>';
    targetsUl.style.display = 'block';

    try {
        const availableTargets = await fetchRandomTargets(CONFIG.TARGET_FETCH_COUNT);
        displayTargets(availableTargets);
    } catch (error) {
        console.error("Error fetching targets:", error);
        targetsUl.innerHTML = `<li style="color: red;">Error loading targets: ${error.message}</li>`;
    }
}

/**
 * Fetch random available targets from the target pool
 * @param {number} maxTargets - Maximum number of targets to fetch
 * @returns {Promise<Array>} Array of available targets
 */
async function fetchRandomTargets(maxTargets = CONFIG.TARGET_FETCH_COUNT) {
    if (state.isPaused) {
        console.log('Cannot fetch targets - API calls paused');
        return [];
    }

    const availableTargets = [];
    let attempts = 0;

    while (availableTargets.length < maxTargets && attempts < CONFIG.MAX_TARGET_ATTEMPTS) {
        attempts++;
        
        // Get random target that hasn't been checked in this session
        let randomTarget;
        let searchAttempts = 0;
        
        do {
            randomTarget = state.allTargets[Math.floor(Math.random() * state.allTargets.length)];
            searchAttempts++;
            
            // Prevent infinite loop if all targets checked
            if (searchAttempts > 100) {
                console.log('All targets in pool have been checked');
                return availableTargets;
            }
        } while (state.checkedTargetIds.has(randomTarget.XID));
        
        state.checkedTargetIds.add(randomTarget.XID);

        try {
            const apiUrl = `https://api.torn.com/user/${randomTarget.XID}?selections=basic&key=${state.apiKey}`;
            const userResponse = await fetch(apiUrl);
            
            if (!userResponse.ok) {
                console.warn(`API error for user ${randomTarget.XID}: ${userResponse.status}`);
                continue;
            }
            
            const userData = await userResponse.json();
            
            // Check for API error
            if (userData.error) {
                console.warn(`API Error for user ${randomTarget.XID}:`, userData.error.error);
                continue;
            }
            
            incrementApiCallCount();

            const status = formatStatus(userData.status);
            
            if (status === "Okay") {
                availableTargets.push({ 
                    XID: randomTarget.XID, 
                    status,
                    name: userData.name || 'Unknown'
                });
                console.log(`Found available target: ${randomTarget.XID} (${userData.name})`);
            } else {
                console.log(`Target ${randomTarget.XID} not available: ${status}`);
            }
            
            // Small delay to avoid hammering the API
            await new Promise(resolve => setTimeout(resolve, CONFIG.API_REQUEST_DELAY));
            
        } catch (error) {
            console.error(`Error fetching target ${randomTarget.XID}:`, error);
        }
        
        // Check if we've hit API limits
        if (state.isPaused) {
            console.log('API limit reached during target fetch');
            break;
        }
    }

    console.log(`Found ${availableTargets.length} available targets after ${attempts} attempts`);
    return availableTargets;
}

/**
 * Format status from Torn API response
 * @param {Object} status - Status object from API
 * @returns {string} Formatted status string
 */
function formatStatus(status) {
    if (!status) return "Unknown";
    
    let formattedStatus = status.state || "Unknown";
    
    if (formattedStatus === "Hospital") {
        const remaining = status.until - Date.now() / 1000;
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);
        formattedStatus = `Hospitalized (${minutes}m ${seconds}s)`;
    }
    
    return formattedStatus;
}

/**
 * Display targets in the UI
 * @param {Array} targets - Array of target objects
 */
function displayTargets(targets) {
    targetsUl.innerHTML = '';

    if (targets.length === 0) {
        targetsUl.innerHTML = '<li>No available targets found. Try again.</li>';
        return;
    }

    targets.forEach(target => {
        const targetElement = document.createElement('li');
        const targetLink = document.createElement('a');
        
        targetLink.href = '#';
        targetLink.textContent = `${target.XID} (${target.name || 'Unknown'}) - ${target.status}`;
        targetLink.style.cursor = 'pointer';
        
        // Open in browser on click using secure API
        targetLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = `https://www.torn.com/profiles.php?XID=${target.XID}`;
            const result = await window.electronAPI.openExternal(url);
            if (!result.success) {
                console.error('Failed to open URL:', result.error);
            }
        });
        
        targetElement.appendChild(targetLink);
        targetsUl.appendChild(targetElement);
    });

    // Add "Pull Next" button if not already present
    if (!targetsUl.contains(pullNextBtn)) {
        targetsUl.appendChild(pullNextBtn);
    }
}

/**
 * Hide targets and header
 */
function hideTargets() {
    targetsUl.innerHTML = '';
    targetsUl.style.display = 'none';
    
    const targetHeader = document.getElementById('target-header');
    if (targetHeader) {
        targetHeader.style.display = 'none';
    }
}

// ==================== WARNING & NOTIFICATIONS ====================
/**
 * Show chain expiring warning
 */
function showChainExpiringWarning() {
    warningDiv.innerHTML = "CHAIN EXPIRING!";

    if (!document.body.contains(warningDiv)) {
        refreshBtn.parentNode.insertBefore(warningDiv, refreshBtn);
    }

    // Throttled notifications
    const currentTime = Date.now();
    if (currentTime - state.lastNotificationTime >= CONFIG.NOTIFICATION_COOLDOWN) {
        sendNotification();
        state.lastNotificationTime = currentTime;
    }
}

/**
 * Hide chain expiring warning
 */
function hideChainExpiringWarning() {
    if (document.body.contains(warningDiv)) {
        warningDiv.remove();
    }
}

/**
 * Send native notification
 */
function sendNotification() {
    try {
        // Use Electron's native notifications via IPC
        window.electronAPI.showNotification({
            title: 'CHAIN EXPIRING!',
            body: 'The chain timer has reached 2.5 minutes!'
        });
        console.log('Notification sent');
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// ==================== ERROR HANDLING ====================
/**
 * Display error message to user
 * @param {string} message - Error message
 */
function showError(message) {
    console.error(message);
    alert(message);
}

// ==================== INITIALIZE ON DOM READY ====================
document.addEventListener('DOMContentLoaded', init);