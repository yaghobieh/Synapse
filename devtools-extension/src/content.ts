/// <reference path="./chrome.d.ts" />

interface SynapseMessage {
  type?: string;
  source?: string;
  payload?: unknown;
  nucleusId?: string;
  timestamp?: number;
}

let isExtensionValid = true;

function safeSendMessage(message: unknown): void {
  if (!isExtensionValid) return;
  
  try {
    chrome.runtime.sendMessage(message);
  } catch (e) {
    if ((e as Error).message?.includes('Extension context invalidated')) {
      isExtensionValid = false;
    }
  }
}

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return;
  
  const data = event.data as SynapseMessage | undefined;
  const source = data?.source;
  
  if (source === 'synapse-devtools') {
    safeSendMessage(event.data);
  }
});

try {
  chrome.runtime.onMessage.addListener((msg: unknown) => {
    const message = msg as SynapseMessage;
    window.postMessage(message, '*');
  });
} catch (_e) {
  isExtensionValid = false;
}

// Inject the marker script from file (CSP-compliant)
try {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
} catch (_e) {
  // Silently fail if injection not possible
}
