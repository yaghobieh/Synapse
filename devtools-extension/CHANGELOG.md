# Changelog

All notable changes to the Synapse DevTools Chrome extension are documented here.

---

## [1.2.0] — 2026-03-03

### Added

- **API tab: full request/response detail** — Click an API call to see Request (method, URL, time, headers, body) and Response (status, duration, headers, body). Requires Synapse API tracker to record headers (Synapse 1.2.0+).
- **Store filter tabs** — Top bar tabs (All, Counter, Todos, etc.) to filter actions and state by nucleus. Fixes top bar not updating when selecting a store.

### Fixed

- **Top bar store tabs** — Active tab now updates immediately when you click a store; no longer depends on poll interval.
- **Signals** — Internal `__signals__` nucleus is hidden from the store tabs list.

---

## [1.1.0] — 2026-02-24

### Added

- **Time slider** — Slider at the bottom to scrub through action history and time-travel.
- **API tab** — List of tracked API calls (method, URL, status, duration).
- **Modern UI** — Softer colors, clearer layout, and improved empty states.

### Changed

- Panel layout and styling overhaul (dark theme, pill badges, clearer typography).

---

## [1.0.0] — 2026-01-15

### Added

- Initial DevTools panel: Actions list, Diff, State tree, Action payload, Perf.
- Snapshots, Export, Import, and inline state edit.
- Time-travel via "Jump" on an action.
