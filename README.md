# Underwater Optimizer

**Find your fastest breakout.** V0.2 is a local-first swimming dashboard for swimmers and coaches. Record underwater observations, keep comparable tests together, and inspect individual results and repeated-distance statistics. There is no account, backend, AI API, or validated biomechanical prediction.

## What V0.2 includes

- Multiple named athletes, with separate sessions and optional personal bests by stroke/event.
- Session name, date, stroke (freestyle, backstroke, butterfly), event (50/100/200 m), pool length (25/50 m), and start type (block, in-water, or push after turn).
- Create, rename and select athletes and sessions. Only the selected session's observations enter its analysis. Historical sessions are never automatically pooled, even if settings match.
- Add/edit/delete tests; repeat the latest recorded test with distance/kicks prefilled and time/notes blank. Decimal dot or comma is accepted, including personal best.
- A separate demo athlete containing 8 m / 4 kicks / 6.51 s, 10 m / 5 kicks / 6.39 s, 12 m / 7 kicks / 6.31 s, and 14 m / 9 kicks / 6.43 s. Loading the demo selects this workspace; it does not replace real observations. Later clicks reuse the existing demo athlete, including any edits made there.
- Best individual observation, best–worst difference, and exact-distance sample count, mean, median, best, sample standard deviation and time range.
- Overview/detail scatter chart with explicit time-axis bounds in detail mode, selectable points, keyboard support and a selector that includes every overlapping observation.
- Larger controls and readable mobile test cards, with a floating New test action on small screens. Notes, edit, move and delete remain accessible.
- CSV for the current session, complete JSON backup/restore with validation and preview, and a printable summary for a coach.
- A 15 m pool lane and regulatory reminder. The simulator is intentionally coming soon.

The interface remains in English to match the initial version. Explanations in the UI describe what the numbers mean.

## Run the project

Use **Node.js 22.12 or later** (validated with Node 24) and npm. In this cloud workspace the project is `/workspace/Codex`.

```sh
cd /workspace/Codex
npm ci
npm run dev
```

Open the address printed by the development server on your computer. Stop it with Ctrl+C. No secrets or environment variables are required by the application.

```sh
npm run build
npm run preview
```

The optimized static app is written to `dist/`. The existing Vercel integration uses Vite, `npm run build`, and the `dist` output directory. Running local commands does not push or deploy changes. Development/preview servers bind to all interfaces for cloud use and are not production servers.

## Try the new workflow

1. Create an athlete using the + beside Athlete.
2. Create a session: enter the actual date, pool, stroke/event and start type. The date starts blank; **Use today** fills today's browser-local date explicitly.
3. Click **New test** and enter distance, dolphin kicks and 15 m time. For example, `12,01` and `6,31` work.
4. Use **Repeat last test** to collect comparable repeats quickly. Record rest, effort and timing method in notes when relevant.
5. Inspect **Best observed test** separately from **Lowest observed mean**. These can identify different distances.
6. Switch athletes/sessions and reload to check persistence.
7. Use **Backup JSON** before clearing browser data, changing devices, or restoring another backup.

Session renaming and condition edits with existing observations require confirmation that every test belongs to the stated date/conditions. Stroke and event are locked for a session with observations. To split mixed imported observations, create destination sessions with matching stroke/event and use each test's **Move** action. It preserves measurements, ID and recording timestamp. Measurements can be edited or deleted even in an incomplete imported session, but new tests and analysis require complete conditions.

## Calculations and interpretation

Calculations live in `src/lib/model.ts`.

- **Best observed test:** minimum entered 15 m time within the selected session. Every fastest tie is kept. The summary shows the shortest tied distance, then the earliest test at that distance. This is a display rule, not a recommendation for shorter distances or fewer kicks.
- **Best–worst difference:** maximum minus minimum time in the session. It is a spread, not a claim of improvement over time. With fewer than two observations the difference card shows no comparison.
- **Exact-distance groups:** numeric distances must be exactly equal. `12` and `12.0` are equal numbers; `12.01` is a separate group. No bins, silent rounding or averaging of neighboring distances.
- **Mean:** sum divided by sample count. **Median:** middle sorted value, or average of the middle pair. **Best:** minimum recorded time. **Range:** minimum to maximum recorded time.
- **Variability:** sample standard deviation, `sqrt(sum((time − mean)^2)/(n − 1))`. It is unavailable for one observation, never reported as zero uncertainty. The table shows SD to three decimal places and times to two; calculations use the entered values without pre-rounding.
- **Lowest observed mean:** the minimum group mean; all exact mean ties are listed. Sample counts are displayed. A lower mean, especially with unequal sample sizes, does not establish a reliable strategy.
- **Preliminary result:** displayed if fewer than two distances exist or any distance has fewer than three observations. This is a practical reminder, not a statistically or scientifically validated confidence threshold. Larger sample counts still do not establish physiological validity or eliminate timing error.
- **Chart overview:** horizontal axis 0–15 m and time axis starting at zero. **Detail:** time bounds are based on the observed range with padding of at least 0.05 s, rounded outward to hundredths; the exact bounds and any nonzero origin are clearly stated. Identical points remain individually accessible through the observation selector and log.
- Personal best is stored by athlete and stroke/event for context; it never alters the analysis.

Use consistent timing methods, effort, rest and conditions. No causation, biomechanical optimum, race prediction, medical benefit or guaranteed performance is inferred. Session settings are user declarations, not independently verified measurements. Breaststroke is excluded; freestyle, backstroke and butterfly require the head to break the surface by 15 m after a start or turn.

## Data migration and storage safety

V0.2 stores the complete workspace at `underwater-optimizer:v2` in localStorage. When that key is absent and valid `underwater-optimizer:v1` data exists, migration:

1. Creates an **Imported athlete** and preserves personal bests.
2. Creates an imported session for each distinct legacy stroke/event combination, including the previously selected context.
3. Preserves each observation's ID, measurements, notes and timestamp.
4. Leaves session date, pool and start type **unknown**. Recording timestamps are not assumed to identify an actual session date.
5. Disables comparisons until you manually review the session's actual conditions. Split observations that were recorded under different conditions before confirming.

The original v1 localStorage value is retained unchanged as a recovery copy. Migration writes only the new v2 key; after a successful save, future loads use v2 and do not migrate repeatedly. Legacy demo observations cannot be distinguished reliably from real data and are therefore preserved as imported observations. Migration cannot reconstruct missing metadata.

If v2 is unreadable, the app does not silently replace it with v1. It displays a warning and works in memory until you explicitly enable saving or restore a validated backup. An inaccessible/full storage warning explains that changes only survive in this tab and offers a JSON download. A failed restore write does not replace the in-memory workspace.

Data belongs to this browser and site origin. There is **no automatic synchronization or backup** across phones, computers or tabs. Use one editing tab. Clearing browser storage can remove observations. Returning to a different domain or port does not automatically bring your previous browser data with you.

### CSV, backups and printing

- **Export CSV** contains only the selected session, with athlete/session context, IDs, original timestamps, distance, kicks, time and notes. CSV uses a UTF-8 BOM, quoted fields, escaped quotes and preserved multiline notes. Formula-like cell values are prefixed with an apostrophe to avoid spreadsheet execution; JSON backup preserves original text exactly.
- **Backup JSON** downloads the complete versioned workspace, including all real/demo athletes, sessions, observations, selections and personal bests.
- **Restore backup** accepts v2 JSON or a valid legacy v1 payload (which undergoes migration). A 10 MB limit, schema checks, bounds, date validation, unique IDs and relationship validation apply. Unknown properties are removed. Invalid files leave current data unchanged.
- Preview shows incoming athlete names and counts, sessions/observations and missing-condition counts. Restore is a **complete replacement, not a merge**. You must explicitly confirm and can download the current workspace first. Storage must successfully save the validated replacement before the in-memory workspace is replaced.
- **Print summary** uses the browser print dialog, where supported you can save as PDF. It includes the selected athlete/session, conditions, observations/notes, statistics and limitations. Incomplete sessions receive no analysis. Nothing is sent to a coach automatically.

JSON backups and CSVs contain athlete names and notes; choose where to save or share them.

## Main files

```text
src/App.tsx                         Application state, context, navigation and dialogs
src/components/ContextForms.tsx    Athlete/session creation and editing
src/components/TestForm.tsx        Decimal input, validation and quick repeat
src/components/PerformanceChart.tsx  Interactive overview/detail chart
src/components/Statistics.tsx      Exact-distance statistics and metric explanations
src/components/TrialLog.tsx        Desktop table, mobile cards and observation actions
src/components/PoolLane.tsx        Responsive 15 m visualization
src/components/Dialog.tsx          Native accessible modal and focus restoration
src/lib/model.ts                   Data types, validation and calculations
src/lib/storage.ts                 Versioned storage, migration, backup validation
src/lib/export.ts                  CSV quoting/protection and file downloads
src/styles.css                    Dark theme, responsive styles and print layout
src/lib/*.test.ts                  Analysis, migration, storage and CSV tests
tests/app.spec.ts                 Desktop/mobile browser workflows
```

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

## Deep Pool & Aqua interface

The dashboard now uses a full-width sticky topbar in place of the sidebar. Athlete/session selectors stay in a unified context pill; **Actions** contains CSV export, JSON backup, restore and printing. Existing storage schema, migration, app state handlers and analysis calculations are unchanged.

Four KPI cards show best observed 15 m time (with best–worst difference), breakout, kicks at that test, and session observation count. The pool SVG positions the breakout at its measured distance on the 0–15 m scale, with a red regulatory boundary. **The path is an illustration, not measured underwater motion.** It makes no depth, trajectory or biomechanical prediction.

On desktop the chart occupies two thirds of the main analysis row and a quick-entry form occupies the remaining third. Breakout steppers use 0.5 m increments, kick steppers use increments of one, and both retain manual input and existing validation. Inline saving uses the same handler as the modal; it clears the form after a successful submission. The repeat-last-test modal is preserved. Notes collapse in inline mode.

The chart offers **Time** and **Average speed**. Average speed is a display conversion, `15 / total 15 m time`, in m/s; it is **not underwater-only speed**. Time analysis and fastest-test selection remain unchanged. The cyan guide joins the fastest recorded test at each exact distance with straight segments; it is not a regression, interpolation model or prediction. Each individual observation, including repeats, remains plotted and selectable. Gold/cyan concentric rings identify the fastest observed test(s).

The new theme includes responsive tablet/mobile layouts, larger stepper buttons, reduced-motion support, mobile test cards, blurred native dialogs, keyboard-operable Actions and preserved black-on-white print rules. Interface labels remain in English to match the existing workflows.

Browser verification:

```sh
npx playwright install chromium
npm run test:e2e
```

This environment already includes system Chromium, so it can be used without downloading another browser:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright starts/reuses Vite on port 5173. Tests cover desktop/mobile CRUD, comma decimals, quick repeats, separate athletes/sessions, demo isolation, persistent migration, movement of imported tests, backup preview/cancel/restore, invalid import, CSV/JSON download contents, overlapping point selection, keyboard access, print-media content, invalid input and storage errors. Screenshots are generated in `test-results/`; they are ignored by Git.

## Screenshots

_Screenshot placeholder for published documentation._

Current browser tests generate `test-results/dashboard-aqua-desktop.png` and `test-results/dashboard-aqua-mobile.png` for review.

## Roadmap and remaining limits

| Version        | Focus                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| V0.1           | Manual tests + basic analytics                                                        |
| V0.2 — current | Named athletes, historical sessions, repeated-distance statistics, backup and sharing |
| V0.3           | Full race simulator                                                                   |
| V0.4           | Video-based underwater analysis                                                       |
| V0.5           | Advanced performance recommendations                                                  |

The redesign adds no new backend or data schema. No automatic timing capture, live multi-tab sync, cloud sharing, cross-session trend analysis, account system or race simulator is included. Statistics describe entered observations and do not correct for fatigue or timing uncertainty. There is no confidence score or validated physiological model.

## Official logo

The official app logo is the supplied transparent swimmer-and-arrow PNG at `public/brand/imprwater-logo.png`. `src/components/Logo.tsx` uses the same artwork for the header, footer and printed report; the browser favicon and touch icon also reference it. Preserve this artwork and its original colors for future branding changes. A light display plate provides contrast against the navy interface without altering the PNG.
