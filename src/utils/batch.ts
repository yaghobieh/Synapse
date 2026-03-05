let batchDepth = 0;
let pendingNotifications: Set<() => void> = new Set();

export function batchUpdates(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const fns = pendingNotifications;
      pendingNotifications = new Set();
      fns.forEach((f) => f());
    }
  }
}

export function scheduleNotification(notify: () => void): void {
  if (batchDepth > 0) {
    pendingNotifications.add(notify);
    return;
  }
  notify();
}
