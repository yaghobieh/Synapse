/**
 * Synapse DevTools - Background Script
 * Manages communication between content scripts and DevTools panel
 */

// Store connections
const connections: { [tabId: number]: chrome.runtime.Port } = {};

// Listen for connections from DevTools panel
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'synapse-panel') return;

  const tabId = port.sender?.tab?.id;

  if (tabId) {
    connections[tabId] = port;

    // Handle messages from panel
    port.onMessage.addListener((message) => {
      // Forward to content script
      chrome.tabs.sendMessage(tabId, message);
    });

    // Clean up on disconnect
    port.onDisconnect.addListener(() => {
      delete connections[tabId];
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  if (tabId && connections[tabId]) {
    // Forward to DevTools panel
    connections[tabId].postMessage(message);
  }

  return true;
});

// Listen for tab updates to detect page reloads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && connections[tabId]) {
    connections[tabId].postMessage({ type: 'SYNAPSE_PAGE_RELOAD' });
  }
});

console.log('Synapse DevTools background script loaded');

