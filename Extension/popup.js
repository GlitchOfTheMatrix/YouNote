// DOM Elements
const logsDiv = document.getElementById('logs');
const statusBadge = document.getElementById('statusBadge');
const requestCountSpan = document.getElementById('requestCount');
const timeUntilResetSpan = document.getElementById('timeUntilReset');

// Load rate limits on popup open
document.addEventListener('DOMContentLoaded', () => {
    updateRateLimitDisplay();
    setInterval(updateRateLimitDisplay, 1000);
});

function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    logsDiv.appendChild(entry);
    logsDiv.scrollTop = logsDiv.scrollHeight;
}

function setStatus(type, text) {
    statusBadge.textContent = text;
    statusBadge.className = `status-badge ${type}`;
}

function updateRateLimitDisplay() {
    chrome.storage.sync.get(['requestTimestamps'], (data) => {
        const timestamps = data.requestTimestamps || [];
        const windowSize = 3600 * 1000; // 1 hour in ms
        const rateLimit = 100;
        const now = Date.now();
        
        // Remove old timestamps outside the window
        const validTimestamps = timestamps.filter(ts => now - ts < windowSize);
        
        requestCountSpan.textContent = `${validTimestamps.length} / ${rateLimit}`;
        
        if (validTimestamps.length > 0) {
            const oldestTimestamp = validTimestamps[0];
            const timeUntilReset = Math.ceil((windowSize - (now - oldestTimestamp)) / 1000);
            
            // Format time nicely
            const minutes = Math.floor(timeUntilReset / 60);
            const seconds = timeUntilReset % 60;
            timeUntilResetSpan.textContent = `${minutes}m ${seconds}s`;
        } else {
            timeUntilResetSpan.textContent = '--';
        }
    });
}
