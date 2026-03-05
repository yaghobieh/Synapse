/**
 * API Call Tracker for DevTools
 */

interface ApiCall {
  id: number;
  method: string;
  url: string;
  status: number | null;
  requestBody: unknown;
  responseBody: unknown;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  duration: number | null;
  timestamp: number;
}

let apiCalls: ApiCall[] = [];
let apiId = 0;

/**
 * Initialize API tracking
 */
export function initApiTracking(): void {
  if (typeof window === 'undefined') return;
  
  // Expose to DevTools
  (window as any).__SYNAPSE_API_CALLS__ = apiCalls;
  
  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || 'GET';
    const requestBody = init?.body;
    const requestHeaders = init?.headers ? headersToRecord(init.headers) : undefined;

    const call: ApiCall = {
      id: ++apiId,
      method: method.toUpperCase(),
      url,
      status: null,
      requestBody: tryParseJson(requestBody),
      responseBody: null,
      requestHeaders,
      duration: null,
      timestamp: Date.now(),
    };

    apiCalls.unshift(call);
    if (apiCalls.length > 50) apiCalls.pop();

    const startTime = Date.now();

    try {
      const response = await originalFetch.call(window, input, init);

      call.status = response.status;
      call.duration = Date.now() - startTime;
      call.responseHeaders = headersToRecord(response.headers);

      // Clone and parse response
      const clone = response.clone();
      try {
        call.responseBody = await clone.json();
      } catch {
        try {
          call.responseBody = await clone.text();
        } catch {
          call.responseBody = '[Unable to parse]';
        }
      }

      return response;
    } catch (error) {
      call.status = 0;
      call.duration = Date.now() - startTime;
      call.responseBody = { error: (error as Error).message };
      throw error;
    }
  };
  
  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
    (this as any).__synapse_method = method;
    (this as any).__synapse_url = typeof url === 'string' ? url : url.href;
    return originalXHROpen.apply(this, arguments as any);
  };
  
  XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    const xhr = this;
    const call: ApiCall = {
      id: ++apiId,
      method: ((xhr as any).__synapse_method || 'GET').toUpperCase(),
      url: (xhr as any).__synapse_url || '',
      status: null,
      requestBody: tryParseJson(body),
      responseBody: null,
      duration: null,
      timestamp: Date.now(),
    };
    
    apiCalls.unshift(call);
    if (apiCalls.length > 50) apiCalls.pop();
    
    const startTime = Date.now();
    
    xhr.addEventListener('load', () => {
      call.status = xhr.status;
      call.duration = Date.now() - startTime;
      try {
        call.responseBody = JSON.parse(xhr.responseText);
      } catch {
        call.responseBody = xhr.responseText;
      }
    });
    
    xhr.addEventListener('error', () => {
      call.status = 0;
      call.duration = Date.now() - startTime;
      call.responseBody = { error: 'Network error' };
    });
    
    return originalXHRSend.apply(this, arguments as any);
  };
}

function headersToRecord(headers: HeadersInit | undefined): Record<string, string> | undefined {
  if (!headers) return undefined;
  const out: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => { out[key] = value; });
  } else if (Array.isArray(headers)) {
    headers.forEach(([k, v]) => { out[k] = String(v); });
  } else {
    Object.entries(headers).forEach(([k, v]) => { out[k] = String(v); });
  }
  return out;
}

function tryParseJson(data: unknown): unknown {
  if (!data) return null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

/**
 * Manually track an API call
 */
export function trackApiCall(config: {
  method: string;
  url: string;
  requestBody?: unknown;
}): {
  complete: (status: number, responseBody?: unknown) => void;
} {
  const call: ApiCall = {
    id: ++apiId,
    method: config.method.toUpperCase(),
    url: config.url,
    status: null,
    requestBody: config.requestBody || null,
    responseBody: null,
    duration: null,
    timestamp: Date.now(),
  };
  
  apiCalls.unshift(call);
  if (apiCalls.length > 50) apiCalls.pop();
  
  const startTime = Date.now();
  
  return {
    complete: (status: number, responseBody?: unknown) => {
      call.status = status;
      call.duration = Date.now() - startTime;
      call.responseBody = responseBody || null;
    },
  };
}

/**
 * Get all tracked API calls
 */
export function getApiCalls(): ApiCall[] {
  return apiCalls;
}

/**
 * Clear API call history
 */
export function clearApiCalls(): void {
  apiCalls = [];
  if (typeof window !== 'undefined') {
    (window as any).__SYNAPSE_API_CALLS__ = apiCalls;
  }
}

