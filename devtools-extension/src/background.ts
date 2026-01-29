/**
 * Synapse DevTools Background Script
 * Manages connections between content scripts and DevTools panels
 */

/// <reference path="./chrome.d.ts" />

interface SynapseMessage {
  type?: string;
  source?: string;
  payload?: unknown;
  nucleusId?: string;
  timestamp?: number;
}

// Store connections
const connections: Record<number, chrome.runtime.Port> = {};

// Listen for connections from DevTools panel
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'synapse-devtools') return;
  
  const tabId = port.sender?.tab?.id;
  if (tabId) {
    connections[tabId] = port;
    
    port.onDisconnect.addListener(() => {
      delete connections[tabId];
    });
    
    port.onMessage.addListener((msg: unknown) => {
      const message = msg as SynapseMessage;
      // Forward to content script
      chrome.tabs.sendMessage(tabId, message);
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg: unknown, sender) => {
  const message = msg as SynapseMessage;
  const tabId = sender.tab?.id;
  if (tabId && connections[tabId]) {
    connections[tabId].postMessage(message);
  }
});

console.log('Synapse DevTools: Background script loaded');
