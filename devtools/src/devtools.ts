/**
 * Synapse DevTools - DevTools Entry
 * Creates the DevTools panel
 */

// Create DevTools panel
chrome.devtools.panels.create(
  "Synapse",
  "public/icons/icon16.svg",
  "src/panel.html",
  (panel: chrome.devtools.panels.ExtensionPanel) => {
    console.log("Synapse DevTools panel created");

    panel.onShown.addListener((window) => {
      // Panel is shown
      window.postMessage({ type: "SYNAPSE_PANEL_SHOWN" }, "*");
    });

    panel.onHidden.addListener(() => {
      // Panel is hidden
    });
  }
);

