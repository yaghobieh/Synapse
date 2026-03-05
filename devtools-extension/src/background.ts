/**
 * Synapse DevTools Background Script
 * Manages connections between content scripts and DevTools panels.
 * Uses activeTab + scripting: content script is injected when DevTools is opened (user gesture).
 */

/// <reference path="./chrome.d.ts" />

interface SynapseMessage {
  type?: string;
  source?: string;
  payload?: unknown;
  nucleusId?: string;
  timestamp?: number;
  tabId?: number;
}

const connections: Record<number, chrome.runtime.Port> = {};

// Inject content script when DevTools is opened (user gesture → activeTab)
chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
  const message = msg as SynapseMessage;
  if (message.type === 'SYNAPSE_INIT' && typeof message.tabId === 'number') {
    chrome.scripting
      .executeScript({
        target: { tabId: message.tabId },
        files: ['content.js'],
      })
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // keep channel open for async sendResponse
  }
});

// Listen for connections from DevTools panel (panel sends SET_TAB_ID as first message)
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'synapse-devtools') return;

  let resolvedTabId: number | null = null;

  port.onMessage.addListener((msg: unknown) => {
    const message = msg as SynapseMessage;
    if (message.type === 'SET_TAB_ID' && typeof message.tabId === 'number') {
      resolvedTabId = message.tabId;
      connections[resolvedTabId] = port;
      return;
    }
    // Forward panel messages to content script
    if (resolvedTabId != null) {
      chrome.tabs.sendMessage(resolvedTabId, message);
    }
  });

  port.onDisconnect.addListener(() => {
    if (resolvedTabId != null) delete connections[resolvedTabId];
  });
});

// Listen for messages from content scripts → forward to panel
chrome.runtime.onMessage.addListener((msg: unknown, sender) => {
  const message = msg as SynapseMessage;
  const tabId = sender.tab?.id;
  if (tabId != null && connections[tabId]) {
    connections[tabId].postMessage(message);
  }
});

console.log('Synapse DevTools: Background script loaded');
