# Synapse DevTools

Chrome DevTools extension for [Synapse](https://www.npmjs.com/package/@forgedevstack/synapse) state management. Inspect nuclei, time-travel, and view API calls with full request/response details.

## What it does

- **Actions panel** — List of state updates per nucleus; filter by store (top bar tabs) and search.
- **Diff tab** — For a selected action, see what changed (before/after).
- **State tab** — Tree view of current state; expand/collapse, search, and edit values.
- **Action tab** — Raw payload of the selected action.
- **API tab** — List of intercepted fetch/XHR calls. Click a call to see request and response headers and body (RTK-style).
- **Perf tab** — Update count, average interval, state size, and a simple frequency chart.
- **Time slider** — Scrub through action history and jump to a previous state.
- **Snapshots** — Save and restore state snapshots.
- **Export / Import** — Export state as JSON or import from a file.

## Install (unpacked)

1. Build: `npm run build`
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `dist` folder inside this project

After loading, open DevTools on any page that uses Synapse; you will see a **Synapse** tab.

## Build

```bash
npm install
npm run build
```

Output is in `dist/`. Reload the extension in `chrome://extensions` after changes.

## Requirements

- The inspected page must use Synapse and have at least one nucleus created (with devtools enabled in config, which is default in development).
- For the API tab, the page should call `initApiTracking()` from `@forgedevstack/synapse` so fetch/XHR are tracked (including request/response headers).

## Version

See [CHANGELOG.md](./CHANGELOG.md). Extension version is in `manifest.json` and `package.json`.
