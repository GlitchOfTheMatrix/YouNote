// content-script.js
// Injected into the YouNote frontend web pages to act as a secure bridge
// between the web app and the extension's background script.
// This is required for Firefox, which does not support externally_connectable.

window.addEventListener("message", (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  const data = event.data;
  
  // Verify it's a legitimate request from our frontend
  if (data && data.type === "YOUNOTE_EXTENSION_REQUEST") {
    
    // Forward the payload to the background script (service-worker.js)
    chrome.runtime.sendMessage(data.payload, (response) => {
      
      // If there's an error during communication, capture it
      if (chrome.runtime.lastError) {
        window.postMessage({
          type: "YOUNOTE_EXTENSION_RESPONSE",
          id: data.id,
          response: { success: false, error: chrome.runtime.lastError.message }
        }, "*");
        return;
      }

      // Send the background script's response back to the web page
      window.postMessage({
        type: "YOUNOTE_EXTENSION_RESPONSE",
        id: data.id,
        response: response
      }, "*");
    });
  }
});

// Let the page know the extension content script has loaded successfully
window.postMessage({ type: "YOUNOTE_EXTENSION_READY" }, "*");
