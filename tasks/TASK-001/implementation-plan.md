# TASK-001: Implementation Plan

Application Root: `/Users/michaelpetrusha/Desktop/Files/Projects/frontend-acselerator/app`
Source requirements: `tasks/TASK-001/requirements.md` (status: Ready for planning, no open questions)

All paths below are relative to the Application Root unless stated otherwise.

## Current Behavior

- `src/App.tsx` renders the stock Vite + React starter screen (hero images, counter button, docs/social link sections). No domain feature exists.
- `src/main.tsx` mounts `<App />` inside `<StrictMode>` with no mock-API bootstrap.
- `src/test/setup.ts` contains a single line: `import '@testing-library/jest-dom/vitest'`. No MSW server is started for tests, no `beforeAll/afterEach/afterAll` lifecycle exists.
- `msw` ^2.15 is a devDependency and `public/mockServiceWorker.js` is present with `msw.workerDirectory: ["public"]` in `package.json`, but there are no handler, worker, or server modules under `src`.
- `vite.config.ts` configures Vitest with `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./src/test/setup.ts']`.
- There are no tests in the repository today.

## Intended Behavior

A single Training Sessions screen replaces the starter content:

- On mount the screen fetches the training sessions collection from the MSW-backed mock API and shows a loading indicator while pending.
- On success it renders one row per session showing title, start date/time, and status.
- Zero sessions from the API renders an empty-state message instead of an empty list body.
- A failed request renders an error message plus a Retry button that re-issues the same request.
- One status filter (`All` | `scheduled` | `completed` | `cancelled`, default `All`) filters the already-fetched array in memory. Changing it issues no network request and is never written to the URL; it resets to `All` on reload.
- A status selection with zero matches renders a filtered-empty message, and the filter remains changeable.
- A "New training session" button reveals an **inline** creation form on the same screen (decision recorded below) with exactly two fields: title and start date/time.
- Client-side validation blocks submission and renders field-level errors associated with their inputs; valid submission POSTs to the mock API, disables the submit control while in flight, and on success closes/resets the form and shows the new `scheduled` session in the list without a page reload.
- A failed create renders a form-level error and preserves the entered values.

## Preconditions And Confirmed Decisions

Settled by requirements — do not relitigate:

- Stack fixed: React 19, TypeScript, Vite, Vitest + Testing Library, MSW. **No new dependencies may be added.** Everything below is buildable with the existing `package.json`.
- No routing library exists and none is needed: this is a single screen rendered by `App`.
- No state-management or form library: React `useState`/`useReducer` and a hand-written validation module only.
- No design system: plain CSS in a feature-local stylesheet.
- Status set is closed: `scheduled | completed | cancelled`. Created sessions are always `scheduled`, server-assigned.
- Filtering is client-side; status is never sent as a query parameter.
- Empty and error scenarios are exercised only by overriding MSW handlers in tests, never by a UI toggle.

Decisions this plan is required to pin down (deferred here by the requirements):

### Decision 1 — Form presentation: inline, not modal or drawer

The creation form renders **inline on the same screen**, above the list, inside a `<section>` toggled by a "New training session" button. Rationale: a modal or drawer needs a focus trap, scroll lock, and `Escape` handling that would either pull in a new dependency (forbidden) or require hand-rolled focus management that is not covered by any acceptance criterion. Inline rendering satisfies "reachable and operable by keyboard, with visible focus" with no extra machinery. The toggle button carries `aria-expanded`; when the form opens, focus moves to the title input; when it closes (after success or cancel), focus returns to the toggle button.

### Decision 2 — MSW placement and the provisional API contract

MSW modules live under `src/mocks/`, which is the conventional MSW v2 layout and keeps the mock separate from feature code:

- `src/mocks/handlers.ts` — the request handlers (shared by browser and node).
- `src/mocks/seed.ts` — the fixed seed data and a resettable in-memory store.
- `src/mocks/browser.ts` — `setupWorker(...handlers)` for `npm run dev`.
- `src/mocks/server.ts` — `setupServer(...handlers)` for Vitest (`msw/node`).

Provisional contract (collection read + create only, nothing more):

| Method | Path | Request body | Success | Failure (test override only) |
| --- | --- | --- | --- | --- |
| GET | `/api/training-sessions` | — | `200` with `TrainingSession[]` | `500` with `{ "message": string }` |
| POST | `/api/training-sessions` | `{ "title": string, "startsAt": string }` | `201` with the created `TrainingSession` | `500` with `{ "message": string }` |

```ts
type TrainingSessionStatus = 'scheduled' | 'completed' | 'cancelled'

type TrainingSession = {
  id: string
  title: string
  startsAt: string // ISO 8601, e.g. "2026-04-14T09:00:00.000Z"
  status: TrainingSessionStatus
}
```

Notes that bind the implementation:

- The POST handler ignores any client-supplied `status` and assigns `'scheduled'`; it generates `id` via `crypto.randomUUID()` and appends to the in-memory store so the subsequent GET (or the client-side append) reflects it.
- `startsAt` is always ISO 8601 with a `Z` offset on the wire. The `datetime-local` input yields a local-time string with no offset (`"2026-04-14T09:00"`); converting to ISO is the client's job in `api.ts`, not the component's.
- Relative paths are used so MSW intercepts under both Vite dev server and jsdom. If jsdom request resolution against a relative URL proves awkward, resolve against `window.location.origin` inside `api.ts` — do **not** introduce a base-URL env variable.
- Session status is **stored**, not derived from `startsAt`. Seed rows therefore use fixed ISO dates; no seed row needs to move as real time passes, and no list behavior is time-dependent. Only form validation compares against the current time.

### Decision 3 — Request boundary

All network access goes through `src/features/training-sessions/api.ts`, which exports exactly two functions (`fetchTrainingSessions`, `createTrainingSession`). Components and hooks never call `fetch` directly. This is the "replaceable request boundary" the requirements ask for: swapping MSW for a real backend later touches only this file.

## Ordered File Changes

Steps 1–3 are foundational and must land first. Steps 4–6 are independent of one another once step 3 exists and may proceed in parallel. Steps 7–9 depend on 4–6.

### Step 1 — Domain types

**Create `src/features/training-sessions/types.ts`**
Exports `TrainingSessionStatus`, `TrainingSession`, `CreateTrainingSessionInput` (`{ title: string; startsAt: string }`), and `STATUS_VALUES` as a readonly tuple used to build the filter options and to keep the closed status set in one place. No logic.

### Step 2 — Mock API

**Create `src/mocks/seed.ts`**
Exports `SEED_SESSIONS: TrainingSession[]` with exactly 8 rows — 3 `scheduled`, 3 `completed`, 2 `cancelled` (satisfies "roughly 8, all three statuses, >= 2 each"). Fixed `id` values (`"ts-1"`…`"ts-8"`) and fixed ISO `startsAt` values. Also exports a mutable module-level store plus `resetStore()`, because the POST handler mutates the collection and tests must start from a clean slate.

**Create `src/mocks/handlers.ts`**
Two `http.get` / `http.post` handlers implementing the table in Decision 2, reading and writing through the store from `seed.ts`. No artificial delay — an injected delay makes the loading assertion flaky rather than more realistic; the loading state is observable because the resolver is async.

**Create `src/mocks/browser.ts`** — `export const worker = setupWorker(...handlers)`.
**Create `src/mocks/server.ts`** — `export const server = setupServer(...handlers)` from `msw/node`.

### Step 3 — Test harness wiring

**Modify `src/test/setup.ts`**
Keep the existing jest-dom import. Add the MSW node lifecycle: `server.listen({ onUnhandledRequest: 'error' })` in `beforeAll`, `server.resetHandlers()` **and** `resetStore()` in `afterEach`, `server.close()` in `afterAll`. `globals: true` is already set in `vite.config.ts`, so these hooks need no import. `onUnhandledRequest: 'error'` is deliberate: it turns a path typo into a failing test instead of a silent hang.

`vite.config.ts` needs **no** change — `environment`, `globals`, and `setupFiles` are already correct.

### Step 4 — Validation module

**Create `src/features/training-sessions/validation.ts`**
Pure functions, no React import, so they are unit-testable without rendering:

- `validateTitle(raw: string): string | null` — trim; empty → required message; trimmed length `< 3` or `> 80` → range message; otherwise `null`.
- `validateStartsAt(raw: string, now: Date): string | null` — empty → required message; unparseable (`Number.isNaN(date.getTime())`) → invalid message; `date.getTime() <= now.getTime()` → must-be-future message; otherwise `null`. `now` is an injected parameter, not `new Date()` read internally — this is what lets tests assert the boundary without fake timers.
- `validateCreateForm(values, now)` returning `{ title?: string; startsAt?: string }`.

Message strings live here as exported constants so tests assert against the constants rather than duplicated literals.

### Step 5 — Request boundary

**Create `src/features/training-sessions/api.ts`**

- `fetchTrainingSessions(signal?: AbortSignal): Promise<TrainingSession[]>` — GET, throws on `!response.ok`, returns parsed JSON.
- `createTrainingSession(input: CreateTrainingSessionInput): Promise<TrainingSession>` — converts the `datetime-local` value to an ISO string, POSTs, throws on `!response.ok`, returns the created record.
- A small local `TrainingSessionsApiError` (plain `Error` subclass carrying `status`) so the UI can distinguish "request failed" from a programming error. No error taxonomy beyond that.

### Step 6 — Feature styles

**Create `src/features/training-sessions/trainingSessions.css`**
Plain CSS for the screen layout, list rows, status pill, form fields, and error text. Must define a visible `:focus-visible` outline for the toggle button, select, inputs, and submit button (Cross-Cutting criterion). Desktop-first; one narrow-viewport media query so the layout does not break. Do not delete `src/index.css`; `src/App.css` becomes unused once `App.tsx` stops importing it and should be removed along with the unused `src/assets/` imports in step 9.

### Step 7 — Data hook

**Create `src/features/training-sessions/useTrainingSessions.ts`**
Owns the collection and request lifecycle. Shape: `{ status: 'loading' | 'error' | 'ready', sessions, reload(), addSession(session) }` — model the state as a discriminated union rather than three loose booleans, so "loading and error at the same time" is unrepresentable.

- Fetches on mount via `useEffect`; `reload()` re-runs the same request and is what the Retry button calls.
- `addSession` appends a created record to local state, which is how the new row appears without a refetch or reload.
- Guard against React 19 `StrictMode` double-invocation of the mount effect with an `AbortController` whose `abort()` runs in the effect cleanup, and ignore `AbortError` in the catch so the aborted first run does not surface as an error state. This is a real trap here: `main.tsx` renders inside `StrictMode`, so without the guard the dev screen can flash an error.

### Step 8 — Presentation components

All under `src/features/training-sessions/`:

**`StatusFilter.tsx`** — a single `<select>` (native select is keyboard-operable for free) with an associated `<label htmlFor>`; options `All`, `scheduled`, `completed`, `cancelled` built from `STATUS_VALUES`. Controlled by the parent; emits the new value. No internal fetching.

**`TrainingSessionsList.tsx`** — renders the already-filtered array. Props include the filtered rows plus enough context to choose between the two distinct empty messages: an unfiltered empty collection ("No training sessions yet") and a filtered-empty result ("No training sessions match this status"). These are separate acceptance criteria and must be separate strings. Each row shows title, formatted start date/time, and status. Format the date with `Intl.DateTimeFormat`; pin an explicit locale (`'en-US'`) and `timeZone: 'UTC'` so assertions are not host-dependent.

**`CreateTrainingSessionForm.tsx`** — `<form>` with `<label>`-bound `<input type="text">` and `<input type="datetime-local">`. On submit: `preventDefault`, run `validateCreateForm(values, new Date())`; if errors, set them and do not call the API. Each input gets `aria-invalid` and `aria-describedby` pointing at its error element's `id`; the error container has `role="alert"` so errors are announced. Submit button is `disabled` while in flight. On API rejection, render a form-level `role="alert"` message and leave `values` untouched. On success, call the `onCreated(session)` prop and reset.

**`TrainingSessionsScreen.tsx`** — composition root. Calls `useTrainingSessions`, owns `filter` state (`'all' | TrainingSessionStatus`, default `'all'`) and `isFormOpen` state, derives the filtered array with `useMemo`, renders loading / error+Retry / list, the toggle button, and the form. Passes `addSession` as the form's `onCreated`. Holds the `useRef` on the toggle button used for focus return.

### Step 9 — Mount the screen

**Modify `src/App.tsx`** — replace the entire starter body with a render of `<TrainingSessionsScreen />` wrapped in a `<main>` with an `<h1>`. Remove the `useState` counter, the three asset imports, and the `./App.css` import. Delete `src/App.css` and the now-unreferenced files in `src/assets/` only if nothing else imports them.

**Modify `src/main.tsx`** — start the MSW worker in development before mounting:

```ts
async function enableMocking() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}
```

and `await` it before `createRoot(...).render(...)`. Two details matter: the dynamic `import()` keeps MSW out of the production bundle, and awaiting before render prevents the first GET from racing the worker registration. Keep `<StrictMode>`.

## Contracts And Dependencies

- `api.ts` is the only module that calls `fetch`. Components and `useTrainingSessions` depend on its two exported functions, not on URLs.
- `useTrainingSessions` owns the collection; `TrainingSessionsScreen` owns filter and form-visibility state. Neither `StatusFilter`, `TrainingSessionsList`, nor `CreateTrainingSessionForm` fetches, filters, or persists anything — they are controlled by props. This keeps "changing the filter issues no request" true by construction rather than by discipline.
- `types.ts` `STATUS_VALUES` is the single source of the closed status set, consumed by the filter options and the seed.
- `validation.ts` takes `now` as a parameter; no module reads the clock implicitly.
- `handlers.ts` and `seed.ts` are shared verbatim by `browser.ts` and `server.ts`, so dev behavior and test behavior cannot drift.
- `resetStore()` must run in `afterEach` alongside `server.resetHandlers()`; a create test that leaks a ninth row into the next test is the most likely source of order-dependent failures.

## Essential Tests

**Create `src/features/training-sessions/TrainingSessionsScreen.test.tsx`** — behavior-level, Testing Library + `user-event`, default MSW handlers unless the test overrides them via `server.use(...)`. Render `<TrainingSessionsScreen />` directly (not inside `StrictMode`) and `await` the disappearance of the loading indicator before asserting.

The criteria bar is "at least one" behavior test; this file covers both named flows plus the state matrix:

1. **Loading then list** — loading indicator is visible on first render; after resolution 8 rows appear, and one row exposes title, start date/time, and status.
2. **Status filter (required by criteria)** — select `completed`; only the 3 completed rows remain and no additional request is made (assert via a `vi.fn()` spy attached with `server.events.on('request:start', spy)`, then assert the spy count is unchanged). Select `All`; all 8 return.
3. **Filtered-empty** — override GET with a collection containing no `cancelled` rows, select `cancelled`, assert the filtered-empty message and that the select can be changed back to `All`.
4. **Empty state** — `server.use` GET returning `[]`; assert the empty message and the absence of any row.
5. **Error and retry** — `server.use` GET returning `500` once, assert the error message and Retry button; click Retry with the default handler restored and assert the list renders.
6. **Successful creation (required by criteria)** — open the form, type a valid title, set a future `datetime-local` value, submit; assert the submit control is disabled while in flight, then that a row with the new title and status `scheduled` appears and the form is closed. Use a far-future literal (e.g. `'2099-01-01T09:00'`) rather than fake timers — `user-event` needs `advanceTimers` wiring under `vi.useFakeTimers()`, and that is avoidable complexity here.
7. **Invalid submit blocks the request** — submit with both fields empty; assert two field-level errors, that each input is `aria-invalid` and `aria-describedby` resolves to the error text, and that no POST was issued.
8. **Failed create preserves values** — `server.use` POST returning `500`; assert a form-level alert and that the title input still holds the typed value.

**Create `src/features/training-sessions/validation.test.ts`** — pure unit tests for the boundaries that are tedious to exercise through the DOM: title of length 2 / 3 / 80 / 81, title that is whitespace-only, title whose untrimmed length passes but trimmed length fails, `startsAt` unparseable, `startsAt` exactly equal to `now` (must be rejected — "strictly in the future"), and `startsAt` one second after `now` (accepted).

## Additional Risk-Based Tests

Valuable, not required for done:

- No console errors during load, filter, and create: spy on `console.error` in a test and assert it was never called. Most likely to catch an uncontrolled-input warning or a React key warning.
- Keyboard-only path: `user-event.tab()` from the toggle button through the form fields to submit, asserting focus order and that the whole create flow completes without a mouse.
- Focus management: focus lands on the title input when the form opens and returns to the toggle button after a successful create.
- `api.ts` unit test that a `datetime-local` value is converted to the ISO `startsAt` the POST handler receives — the most probable silent defect in the whole feature.
- POST handler unit test asserting a client-supplied `status: 'completed'` is ignored and the created record is `scheduled`.

## Verification Commands

Run from the Application Root. These are the scripts already declared in `app/package.json`; no new script is added and no dependency installation is implied.

```
npm run test        # vitest run
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run build       # tsc -b && vite build
npm run dev         # manual pass over the eight acceptance states
```

Manual dev-server check after `npm run dev`: confirm the browser console shows the MSW worker started, that the list loads, that changing the filter produces no new entry in the Network tab, and that a created session appears in the list.

## Risks And Rollback

Low overall risk: the feature is greenfield, additive, and behind no flag. No feature flag or rollback plan is warranted — reverting the commit removes the screen and restores the starter `App.tsx`.

Specific traps worth pre-empting:

- **StrictMode double fetch** — mitigated by the `AbortController` in step 7. Without it the dev screen can flash the error state and the request count assertion in test 2 can misbehave.
- **MSW worker not started before the first request in dev** — mitigated by awaiting `enableMocking()` before `render` in `main.tsx`.
- **Mutable seed leaking between tests** — mitigated by `resetStore()` in `afterEach`.
- **Timezone-dependent assertions** — mitigated by pinning locale and `timeZone: 'UTC'` in the date formatter and by using far-future literals in tests.
- **`datetime-local` in jsdom** — it is a supported input type, but `user-event.type()` on it is fragile; prefer `fireEvent.change` or `user-event.clear` + `type` with the full `YYYY-MM-DDTHH:mm` string, and verify the input's `value` after setting it before asserting downstream behavior.
- **`onUnhandledRequest: 'error'`** will fail tests on any path mismatch. That is intended, but it means the path string in `api.ts` and in `handlers.ts` must match exactly; consider exporting the path from a shared constant if the first test run trips on it.
