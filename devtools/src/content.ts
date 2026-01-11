/**
 * Synapse DevTools - Content Script
 * Bridges page and DevTools panel
 */

// Inject the page script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('dist/inject.js');
script.onload = function() {
  script.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from the page
window.addEventListener('message', (event) => {
  // Only accept messages from same window
  if (event.source !== window) return;

  // Only handle Synapse messages
  if (!event.data || !event.data.type?.startsWith('SYNAPSE_')) return;

  // Forward to background script
  chrome.runtime.sendMessage(event.data);
});

// Listen for messages from DevTools panel (via background)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Forward to page
  window.postMessage(message, '*');
  return true;
});

console.log('Synapse DevTools content script loaded');

