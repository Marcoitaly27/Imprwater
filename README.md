# Underwater Optimizer

**Find your fastest breakout.** A local-first swimming dashboard for swimmers and coaches to compare measured underwater tests after a start or turn.

This first version has a complete manual-entry and analysis workflow. No account, backend, database server, or AI service is needed.

## Features

- Responsive dark dashboard with desktop and mobile navigation.
- Freestyle, backstroke, and butterfly; 50 m, 100 m, and 200 m events.
- Separate observations and optional personal best for each stroke/event combination.
- Add, edit, and delete tests with breakout distance, dolphin kicks, 15 m time, and optional notes.
- Input validation: breakout 1–15 m, whole kicks 0–100, positive 15 m time up to 300 s, notes up to 500 characters. Personal best is optional, in seconds, up to 3600 s.
- Repeated and similar tests stay separate. A notice flags distances within 0.25 m of an existing observation.
- Interactive scatter chart, 15 m pool visualization, best-observed summary, deterministic insights, and a distance-sorted test log.
- One-click demo with the four requested observations; replacement, deletion, and clearing require confirmation.
- Browser persistence with visible storage error handling. Invalid saved data is not overwritten until you explicitly enable saving.
- Tests view and an honest “Coming soon” simulator page.

## Screenshots

_Screenshot placeholder: add dashboard screenshots here when publishing the project._

Browser tests produce `test-results/dashboard-desktop.png` and `test-results/dashboard-mobile.png`. These generated files are not committed.

## Technology

React 19, TypeScript, Vite 6, Tailwind CSS 4, Recharts, and Lucide icons. Vitest checks analysis rules; Playwright exercises real browser workflows. ESLint checks code quality and TypeScript checks types (the expected shape of data).

## Requirements and installation

Install **Node.js 22.12 or later** (Node.js 24 was used here). Node includes npm, the dependency installer.

Open a terminal in this project directory, then run:

```sh
npm ci
npm run dev
```

`npm ci` installs the exact versions recorded in `package-lock.json`. `npm run dev` starts the development server and prints its address. Open that address in your browser. In this cloud workspace the project directory is `/workspace/Codex`.

To stop the server, press Ctrl+C in its terminal. No environment variables or credentials are needed for the application.

To produce and inspect an optimized production version:

```sh
npm run build
npm run preview
```

The production files are written to `dist/`, which can be deployed to a static web host. Use HTTPS for a deployed site. Vite's development and preview servers bind to all interfaces for cloud use; they are intended for development, not public production hosting.

## Try it

1. Choose a stroke and event.
2. Click **Load demo data**.
3. Observe the 12.0 m / 7 kicks / 6.31 s best result and its 0.20 s advantage over the slowest test.
4. Add your own test or use a row's pencil button to edit it.
5. Reload the browser to verify your saved observations remain.

Demo data replaces only the selected stroke/event's tests after confirmation if tests already exist. **Clear data** removes only that combination's tests and keeps profile preferences. It also requires confirmation.

## How the optimizer works

Calculations are in `src/lib/model.ts`, separate from the interface:

- The lowest entered 15 m time is the best observed performance.
- All observations sharing that time are marked BEST. The summary uses the shortest tied breakout, then the earliest observation when distance is also tied. This is a display choice, not evidence that fewer kicks or a shorter distance is better.
- The reported gain is `slowest time − fastest time` for the selected stroke and event.
- Insights compare actual observations. The longer-distance insight compares the best observation to the nearest recorded longer distance (fastest time at that distance if repeated).
- The scatter chart plots every test. Distance spans 0–15 m; time starts at zero. Overlapping points can be inspected individually in the table. The chart is loaded only when there are observations.
- Personal best is contextual and does not change the analysis.

No curve fitting, interpolation, prediction, hidden AI inference, or external API is used. Similar tests are not averaged or silently discarded. With one observation there is a best recorded result, but no meaningful comparison; with none, the interface asks for tests.

## Fair comparisons and limitations

Record tests under similar conditions: same start or turn, timing method, effort, rest, and pool conditions. Put relevant conditions in notes. V0.1 does not separately model fatigue, starts versus turns, sessions, timing uncertainty, or race carryover. A difference between two tests does not establish that breakout distance caused the difference.

For freestyle, backstroke, and butterfly the head must break the surface by 15 m after a start or turn. Breaststroke is excluded because its underwater rules differ.

**V1 recommendations are based on user-entered observations, not a scientifically validated biomechanical model.** Results are not a guaranteed physiological optimum, a promise of faster race times, or medical advice.

### Storage and privacy

`src/lib/storage.ts` is the storage boundary and can be replaced with a backend later. Data uses the versioned `underwater-optimizer:v1` localStorage key. It stays in the current browser and site origin; there is no cloud synchronization, export, or backup yet. Browser clearing, private browsing, storage restrictions, or changing site address/port can affect access to saved data. Multiple tabs do not synchronize live; use one tab for editing.

When reading saved data fails, the app starts in memory and preserves the unreadable original until **Enable saving** is clicked. When writing fails, a warning explains that changes only survive in the current tab; **Retry saving** attempts persistence again. Do not close the tab with unsaved observations you need to retain.

## Main files

```text
src/App.tsx                       Dashboard, profile, navigation, test workflow
src/components/TestForm.tsx       Validated add/edit form
src/components/PerformanceChart.tsx  Interactive chart, loaded when needed
src/components/Dialog.tsx         Accessible native modal with focus handling
src/lib/model.ts                  Types, validation, analysis, demo data
src/lib/storage.ts                Versioned browser storage and validation
src/styles.css                    Tailwind import, theme, responsive styles
src/lib/model.test.ts             Analysis and input tests
src/lib/storage.test.ts           Storage contract and error tests
tests/app.spec.ts                Browser workflow and responsive checks
```

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

For real browser tests, install Chromium for Playwright once, then run:

```sh
npx playwright install chromium
npm run test:e2e
```

If Chromium is already installed by your environment, use its path instead of downloading another copy:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright starts and stops a local Vite server automatically (or reuses an existing one on port 5173). Tests cover desktop and mobile, demo calculations, localStorage persistence, create/edit/delete/clear, profile isolation, invalid distance, navigation, storage failures, and document overflow. Failure traces and dashboard screenshots are written to `test-results/`.

## Roadmap

| Version        | Focus                                    |
| -------------- | ---------------------------------------- |
| V0.1 — current | Manual testing + analytics               |
| V0.2           | Athlete profiles and historical sessions |
| V0.3           | Full race simulator                      |
| V0.4           | Video-based underwater analysis          |
| V0.5           | Advanced performance recommendations     |

Future work also includes data export/import, repeated-test summaries, and timing uncertainty. The current profile controls are filters for one local workspace, not multiple named athletes.
