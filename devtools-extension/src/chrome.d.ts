/**
 * Minimal Chrome DevTools types
 * This avoids needing @types/chrome from npm
 */

declare namespace chrome {
  namespace devtools {
    namespace panels {
      function create(
        title: string,
        iconPath: string,
        pagePath: string,
        callback?: (panel: ExtensionPanel) => void
      ): void;

      interface ExtensionPanel {
        onShown: {
          addListener(callback: (window: Window) => void): void;
        };
        onHidden: {
          addListener(callback: () => void): void;
        };
      }
    }

    namespace inspectedWindow {
      function eval<T>(
        expression: string,
        callback?: (result: T, exceptionInfo?: { isException: boolean; value: string }) => void
      ): void;
    }
  }

  namespace runtime {
    function sendMessage(message: unknown): void;
    function getURL(path: string): string;

    const onMessage: {
      addListener(callback: (message: unknown, sender: MessageSender, sendResponse: () => void) => void): void;
    };

    const onConnect: {
      addListener(callback: (port: Port) => void): void;
    };

    interface MessageSender {
      tab?: {
        id?: number;
      };
    }

    interface Port {
      name: string;
      sender?: MessageSender;
      onDisconnect: {
        addListener(callback: () => void): void;
      };
      onMessage: {
        addListener(callback: (message: unknown) => void): void;
      };
      postMessage(message: unknown): void;
    }
  }

  namespace tabs {
    function sendMessage(tabId: number, message: unknown): void;
  }
}

