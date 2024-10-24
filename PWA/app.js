// DOM Elements
const chainInfoDiv = document.getElementById('chain-info');
const targetsUl = document.getElementById('targets');
const refreshBtn = document.getElementById('refresh-btn');
const apiCallCounterDiv = document.getElementById('api-call-counter');
const apiCallTimerDiv = document.getElementById('api-call-timer');
const pullNextBtn = document.createElement('button');  // Button for pulling next targets
const warningDiv = document.createElement('div');

// State variables
let allTargets = [];
let apiCallCount = 0;
let isPaused = false;  // Tracks if API calls are paused
let callStartTime = Date.now();      // Track when API calls started
let firstCallTime = null; // To track the start time of API calls for 60-second reset logic
let chainEndTime = null; // Time when the chain ends
let dynamicTimeRemaining = 0; // Dynamic countdown for remaining time
let countdownInterval = null; // Countdown interval for dynamic countdown
let intervalId = null; // For storing the interval reference
let targetsFetched = false; // Flag to prevent multiple calls to fetchTargets
let lastNotificationTime = 0; // For tracking notification cooldown
let deferredPrompt; // For PWA installation

// Constants
const apiCallLimit = 90; // Set the limit to 90 API calls
const refreshInterval = 10; // 10 second refresh interval
let refreshCountdown = refreshInterval; // Countdown for refresh

// Retrieve API key for making requests
const apiKey = localStorage.getItem('apiKey') || null;

// Send a OneSignal push notification with cooldown
function sendOneSignalNotification() {
    const currentTime = Date.now();
    if (currentTime - lastNotificationTime >= 10000) { // 10000 ms = 10 seconds
        fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": "N2Q5YzRkZjgtNmIwZS00YTE2LTliNDAtYmY3OTRjNTYyMjk5"
            },
            body: JSON.stringify({
                app_id: "2e8c02fe-c7d5-479d-8dc5-c5044c0a36c0",
                headings: { "en": "CHAIN EXPIRING!" },
                contents: { "en": "The chain timer has reached 2.5 minutes!" },
                included_segments: ["Subscribed Users"],
                url: window.location.href
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Notification sent:", data);
            lastNotificationTime = currentTime;
        })
        .catch(error => {
            console.error("Error sending notification:", error);
        });
    }
}

// Function to control the fetch interval
function startFetchInterval() {
    if (intervalId) {
        clearInterval(intervalId);
    }

    intervalId = setInterval(() => {
        fetchChainData();
    }, refreshInterval * 1000);
}

// Function to handle API key input and storage
function setupApiKeyHandling() {
    const apiKeyContainer = document.getElementById('api-key-container');
    const savedApiKeyContainer = document.getElementById('saved-api-key-container');
    const savedApiKeySpan = document.getElementById('saved-api-key');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const clearApiKeyBtn = document.getElementById('clear-api-key-btn');

    // Get all elements with app-content class
    const appContentElements = document.querySelectorAll('.app-content');
    
    // Function to toggle visibility of app content
    const toggleAppContent = (show) => {
        appContentElements.forEach(el => {
            el.style.display = show ? 'block' : 'none';
        });
    };

    // Initially hide all app content
    toggleAppContent(false);

    const storedApiKey = localStorage.getItem('apiKey');

    if (storedApiKey) {
        // API key exists
        apiKeyContainer.style.display = 'none';
        savedApiKeyContainer.style.display = 'block';
        savedApiKeySpan.textContent = storedApiKey;
        toggleAppContent(true);
    } else {
        // No API key
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
            alert("Please enter a valid API key.");
        }
    });

    // Clear API key handler
    clearApiKeyBtn.addEventListener('click', () => {
        localStorage.removeItem('apiKey');
        location.reload();
    });
}

// Initialize the API call counter
function incrementApiCallCount() {
    apiCallCount++;
    apiCallCounterDiv.innerText = `API Calls: ${apiCallCount}`;
    checkApiLimit();
}

// Check if the API call limit has been reached
function checkApiLimit() {
    const currentTime = Date.now();

    if (!firstCallTime) {
        firstCallTime = currentTime;
    }

    const elapsedTime = (currentTime - firstCallTime) / 1000;

    if (apiCallCount >= apiCallLimit && elapsedTime <= 60) {
        pauseApiCalls();
    } else if (elapsedTime > 60) {
        resetApiCallCount();
    }
}

// Pause API calls for 60 seconds
function pauseApiCalls() {
    isPaused = true;
    let countdown = 60;

    const countdownInterval = setInterval(() => {
        countdown--;
        apiCallTimerDiv.innerText = `API calls paused. Resuming in ${countdown} seconds...`;

        if (countdown <= 0) {
            clearInterval(countdownInterval);
            apiCallTimerDiv.innerText = '';
            isPaused = false;
            resetApiCallCount();
        }
    }, 1000);
}

// Reset API call count after cooldown
function resetApiCallCount() {
    apiCallCount = 0;
    apiCallCounterDiv.innerText = `API Calls: 0`;
    firstCallTime = Date.now();
}

// Fetch chain data
async function fetchChainData() {
    if (isPaused) return;

    try {
        console.log('fetchChainData() called');
        const response = await fetch(`https://api.torn.com/faction/19?selections=chain&key=${apiKey}`);
        const data = await response.json();

        console.log("Chain Data:", data);

        incrementApiCallCount();
        updateChainUI(data.chain);
    } catch (error) {
        console.error("Error fetching chain data:", error);
        chainInfoDiv.innerHTML = '<p>Error fetching chain data</p>';
    }
}

// Update the chain UI
function updateChainUI(chainData) {
    const currentTime = Math.floor(Date.now() / 1000);
    chainEndTime = chainData.end;
    dynamicTimeRemaining = chainEndTime - currentTime;

    const targetHeader = document.getElementById('target-header');

    if (dynamicTimeRemaining > 0 && chainData.current > 0) {
        if (!countdownInterval) {
            startDynamicCountdown();
        }

        if (dynamicTimeRemaining <= 150) {
            if (!targetsFetched) {
                fetchTargets();
                targetsFetched = true;
            }
            targetsUl.style.display = 'block';
            targetHeader.style.display = 'block';
            showChainExpiringWarning();
        } else {
            hideTargets();
            hideChainExpiringWarning();
            targetsFetched = false;
        }
    } else {
        chainInfoDiv.innerHTML = '<p>No active chain</p>';
        hideTargets();
        hideChainExpiringWarning();
        targetsFetched = false;
    }
}

// Show the "CHAIN EXPIRING!" warning
function showChainExpiringWarning() {
    warningDiv.innerHTML = "CHAIN EXPIRING!";
    warningDiv.style.color = "yellow";
    warningDiv.style.fontSize = "24px";
    warningDiv.style.fontWeight = "bold";
    warningDiv.style.textAlign = "center";
    warningDiv.style.marginBottom = "10px";

    if (!document.body.contains(warningDiv)) {
        refreshBtn.parentNode.insertBefore(warningDiv, refreshBtn);
    }

    sendOneSignalNotification();
}

// Hide the "CHAIN EXPIRING!" warning
function hideChainExpiringWarning() {
    if (document.body.contains(warningDiv)) {
        warningDiv.remove();
    }
}

// Hide targets and header
function hideTargets() {
    targetsUl.innerHTML = '';
    targetsUl.style.display = 'none';
    const targetHeader = document.getElementById('target-header');
    targetHeader.style.display = 'none';
}

// Start the dynamic countdown
function startDynamicCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    countdownInterval = setInterval(() => {
        dynamicTimeRemaining--;

        if (dynamicTimeRemaining > 0) {
            const minutes = Math.floor(dynamicTimeRemaining / 60);
            const seconds = dynamicTimeRemaining % 60;
            chainInfoDiv.innerHTML = `<p>Chain: Ongoing<br>Time remaining: ${minutes} minutes, ${seconds} seconds</p>`;
        } else {
            clearInterval(countdownInterval);
            countdownInterval = null;
            chainInfoDiv.innerHTML = '<p>Chain expired or no active chain</p>';
            hideTargets();
            targetsFetched = false;
        }
    }, 1000);
}

// Load all target XIDs from data.json
async function loadAllTargets() {
    try {
        const response = await fetch("data.json");
        allTargets = await response.json();
        console.log("All targets loaded", allTargets);
    } catch (error) {
        console.error("Error loading targets:", error);
    }
}

// Fetch available targets randomly from the data.json file
async function fetchRandomTargets(apiKey, maxTargets = 10) {
    if (isPaused) return;

    let availableTargets = [];
    let attempts = 0;
    const maxAttempts = 100;

    while (availableTargets.length < maxTargets && attempts < maxAttempts) {
        attempts++;

        const randomTarget = allTargets[Math.floor(Math.random() * allTargets.length)];
        const apiUrl = `https://api.torn.com/user/${randomTarget.XID}?selections=basic&key=${apiKey}`;

        try {
            const userResponse = await fetch(apiUrl);
            const userData = await userResponse.json();
            incrementApiCallCount();

            const status = formatStatus(userData.status);
            if (status === "Okay") {
                availableTargets.push({ ...randomTarget, status });
            }
        } catch (error) {
            console.error("Error fetching target:", error);
        }
    }

    return availableTargets;
}

// Format the status from the Torn API response
function formatStatus(status) {
    let formattedStatus = status.state;
    if (formattedStatus === "Hospital") {
        const remaining = status.until - Date.now() / 1000;
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);
        formattedStatus = `Hospitalized (${minutes}m ${seconds}s)`;
    }
    return formattedStatus;
}

// Display available targets in the UI
function displayTargets(targets) {
    targetsUl.innerHTML = '';

    targets.forEach(target => {
        const targetElement = document.createElement('li');
        targetElement.innerHTML = `<a href="https://www.torn.com/profiles.php?XID=${target.XID}" target="_blank">${target.XID} - Status: ${target.status}</a>`;
        targetsUl.appendChild(targetElement);
    });

    if (!targetsUl.contains(pullNextBtn)) {
        pullNextBtn.innerText = "Pull Next Targets";
        pullNextBtn.classList.add('btn');
        pullNextBtn.addEventListener('click', fetchTargets);
        targetsUl.appendChild(pullNextBtn);
    }
}

// Fetch random targets and display them
async function fetchTargets() {
    targetsUl.innerHTML = '<li>Loading targets...</li>';
    targetsUl.style.display = 'block';

    const availableTargets = await fetchRandomTargets(apiKey, 10);
    displayTargets(availableTargets);
}

// Update refresh countdown every second
setInterval(function () {
    refreshCountdown--;
    const countdownDiv = document.getElementById("refreshCountdownDiv");
    if (countdownDiv) {
        countdownDiv.innerText = `Next refresh in ${refreshCountdown} seconds`;
    }

    if (refreshCountdown <= 0) {
        refreshCountdown = refreshInterval;
    }
}, 1000);

// PWA Installation Event Handlers
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.getElementById('install-btn');
    installBtn.style.display = 'block';

    installBtn.addEventListener('click', () => {
        deferredPrompt.prompt();

        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the PWA installation');
            } else {
                console.log('User dismissed the PWA installation');
            }
            deferredPrompt = null;
        });
    });
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    document.getElementById('install-btn').style.display = 'none';
});

// Refresh button event listener
refreshBtn.addEventListener('click', fetchChainData);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupApiKeyHandling();
    loadAllTargets();
    if (apiKey) {
        fetchChainData();
        startFetchInterval();
    }
});