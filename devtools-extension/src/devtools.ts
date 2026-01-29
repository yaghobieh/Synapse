/**
 * Synapse DevTools - Chrome DevTools Extension
 * Creates the Synapse panel in Chrome DevTools
 */

/// <reference path="./chrome.d.ts" />

chrome.devtools.panels.create(
  'Synapse',
  'icons/icon16.png',
  'panel.html',
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
