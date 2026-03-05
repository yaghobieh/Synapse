/**
 * Synapse DevTools - Chrome DevTools Extension
 * Creates the Synapse panel in Chrome DevTools
 */

/// <reference path="./chrome.d.ts" />

const tabId = chrome.devtools.inspectedWindow.tabId;
const panelPath = 'panel.html?tabId=' + tabId;

// Ask background to inject content script into the inspected tab (activeTab + scripting)
chrome.runtime.sendMessage({ type: 'SYNAPSE_INIT', tabId });

chrome.devtools.panels.create(
  'Synapse',
  'icons/icon16.png',
  panelPath,
  (panel) => {
    console.log('Synapse DevTools panel created');
    
    panel.onShown.addListener((window) => {
      console.log('Synapse panel shown');
      window.postMessage({ type: 'SYNAPSE_PANEL_SHOWN' }, '*');
    });
    
    panel.onHidden.addListener(() => {
      console.log('Synapse panel hidden');
    });
  }
);
