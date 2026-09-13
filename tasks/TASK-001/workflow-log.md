# Workflow Log — TASK-001

## 1. /requirements-analyst

Prompt (verbatim):

> Create a screen for training session, list should be from mock api. should be 1 status filter. creation form with validation. Write a scope and acceptence creteria in tasks/TASK-001/requirements.md. Don't create arcitecture and dont write code. STOP after file and question list. I'll chose the next commant myself

Result: `tasks/TASK-001/requirements.md` created (109 lines). Agent STOPped, recommended `brainstorm`, did not invoke it.

## 2. /requirements-analyst (follow-up, same agent)

Prompt (verbatim):

> Here is the answers: domain = internal corporate training, trainer role only; statuses scheduled|completed|cancelled; form = title + start date/time only; always created as scheduled; title trimmed 3-80; start strictly in the future; ~8 seeded sessions, >=2 per status; empty/error via test handler overrides only; filter client-side, not persisted, not in URL; no toast; >=1 behavior test in DoD; API contract deliberately provisional, no api-integration pass; no design system, no ui-designer pass. Update only tasks/TASK-001/requirements.md. Don't touch arcitecture or code. STOP after the report, I'll chose the next commant myself

Result: `requirements.md` 109 -> 136 lines, readiness flipped to **Ready for planning**. Duration field removed, status set closed to three values, always-scheduled criterion added. Agent STOPped, recommended `writing-plans`, did not invoke it.

## 3. /writing-plans

Prompt (verbatim):

> application root is app/. Stack is already fixed React 19, Vite, Vitest + Testing Library, MSW. Recuerements is alredy defined in tasks/TASK-001/requirements.md use them. Plan should finish requirements (path for msv adn where the form lives inline/modal/draver). Write in tasks/TASK-001/implementation-plan.md. Don't add new libs, don't write prod code, don't touch app/**. Use only defined scope. STOP: file + report, I'll chose the new command myself

Result: `tasks/TASK-001/implementation-plan.md` created (236 lines), 9 ordered steps. Both deferred decisions closed: form is inline (no focus trap dependency), MSW in `app/src/mocks/` with `GET|POST /api/training-sessions`. Nothing under `app/**` touched. Agent STOPped, recommended `coder`, did not invoke it.

## 4. /coder

Prompt (verbatim):

> You can find a plan in tasks/TASK-001/implementation-plan.md, app root in app/. For test only write 2 and 6 + validation, that would be enough. Don't add any new libs, don't change the configs, only use scope from a plan. Expected artifact: list of changes files, which tests are added, return of npm run test/ typecheck/ lint with results. STOP: after implementation and all checks

Result: 14 files created under `app/src/features/training-sessions/` and `app/src/mocks/`, 3 modified (`App.tsx`, `main.tsx`, `test/setup.ts`), 4 unreferenced Vite starter assets deleted. Tests: plan tests 2 and 6 + validation unit tests. Checks reported by the agent and re-run independently: `npm run test` 2 files / 14 tests passed, `npm run typecheck` clean, `npm run lint` clean. Three deviations from the plan (see below). Agent STOPped, recommended `code-reviewer`, did not invoke it.

Deviations from the plan, all declared by the agent:
- `formatStartsAt` extracted into a new `formatting.ts` (react-refresh/only-export-components).
- `loading` reset moved from the effect body into `reload()` (react-hooks/set-state-in-effect).
- `TrainingSessionsList` takes `emptyVariant: 'collection' | 'filtered'` instead of a boolean prop (composition ruleset).

Not verified at this point: manual dev-server pass over the acceptance states; plan tests 1, 3, 4, 5, 7, 8 deliberately scoped out.

## 5. /code-reviewer

Prompt (verbatim):

> review staged diff, not all repo. Task and plan in tasks/TASK-001/. Also check all deviation from the plan and deleting unused files. Border: read only, don't change the code. Need to have your findings + verdict Pass/needs-changes. STOP: after verdict

Result: **NEEDS-CHANGES** on the staged diff (base HEAD, 26 files). Agent STOPped, recommended a scoped `coder` pass, did not invoke it.

Findings:
- **B1 (blocking)** — `app/src/features/training-sessions/api.ts:1` imports `TRAINING_SESSIONS_PATH` from `../../mocks/handlers.ts`, which statically pulls `msw` into the production bundle (built `dist` 554 kB, MSW strings present). Contradicts plan Decision 3. Verified independently: the import is there.
- **S1 (should fix)** — `api.ts` `toIsoStartsAt` parses the `datetime-local` value as local time, while `formatting.ts` pins `timeZone: 'UTC'` for display. In any non-UTC zone the created session renders at a different time than the trainer typed. The plan itself flagged this as the most probable silent defect, and that test was scoped out.
- **S2 (should fix)** — dark-mode contrast: `--ts-danger` ~2.7:1 and `--ts-muted` ~2.9:1 on the dark background.
- Nits: focus goes to the title input for any field error; `role="status"` region mounted together with its text; `api.ts` exports three functions where the plan said two.
- Cleanup missed: `app/public/icons.svg` orphaned; dead starter rules left in `src/index.css` (including a `#root` shell that still draws vertical rules and centres text).
- Declared deviations (formatting.ts, reload() loading reset, emptyVariant) all confirmed benign and lint-motivated.

Residual gaps named honestly by the reviewer: no automated coverage for empty state, error+retry, invalid-submit-blocks-POST, failed-create-preserves-values; manual dev-server pass not yet performed.

Review artifact: the `code-reviewer` role is read-only by design (tools: Read, Grep, Glob,
Bash(git diff*), Bash(git log*)) and cannot write files, so its report was transcribed into
`tasks/TASK-001/review.md` from this session.

Developer decision on the findings: fix all of B1 + S1 + S2 + the cleanup items in one
scoped `coder` pass. Plan tests 4, 5, 7, 8 stay deferred to `test-generator`.

## 6. /coder (review fixes)

Prompt (verbatim):

> fix B1 + S1 + S2 + cleanup from tasks/TASK-001/review.md. Fix only provided stuff, don't change other. Don't add tests. NO new libs or config changes. Should be changes for each task + test/typecheck/lint/build + results. Check if msw with and size dropped from 554kb.

Result: all four findings fixed across 5 files + 1 deletion. Agent STOPped, recommended `browser-verify`, did not invoke it.

- **B1 fixed** — `TRAINING_SESSIONS_PATH` now lives in `api.ts`; `mocks/handlers.ts` imports it from the feature. Edge `api.ts -> handlers.ts -> msw` is gone. Verified independently: `npm run build` 554.30 kB -> **226.39 kB** (204 -> 70.68 kB gzip), `grep -c "mswjs.io\|setupWorker" dist/assets/*.js` = **0**, chunk-size warning gone.
- **S1 fixed** — `toIsoStartsAt` parses the `datetime-local` wall clock via `Date.UTC(...)`, matching the UTC pin in `formatting.ts`. Agent verified under `TZ=Europe/Minsk`: `2026-04-14T09:00` -> `2026-04-14T09:00:00.000Z`, renders 9:00 AM (was 6:00 AM). Suite re-run under that TZ: 14 passed.
- **S2 fixed** — nested `@media (prefers-color-scheme: dark)` on `.training-sessions`: `--ts-danger` 2.7:1 -> 6.46:1, `--ts-muted` 2.9:1 -> 7.04:1.
- **Cleanup done** — `app/public/icons.svg` deleted; dead `#social .button-icon`, `.counter`, and the `#root` shell rules removed from `src/index.css`.

Checks re-run independently in the main session: `npm run test` 2 files / 14 passed, `npm run typecheck` clean, `npm run lint` clean, `npm run build` 226.39 kB.

No tests were added, per the prompt boundary. Agent flagged that this leaves the `toIsoStartsAt` conversion without regression coverage.

Residual risks declared by the agent, not fixed (out of approved scope):
- `validation.ts:36` still parses the `datetime-local` value as host-local time for the future check, while `api.ts` now stores UTC. Effect confined to values within one host-offset of "now".
- Removing the `#root` shell leaves the `<h1>` in `App.tsx` without horizontal padding — a visual change worth a browser pass.
- `dist/mockServiceWorker.js` still ships as a `public/` asset; inert because registration is `import.meta.env.DEV`-gated, and removing it would need the excluded config changes.

## 7. /verify

Prompt (verbatim):

> app root app/, TASK-001, run existing checks, write verification.md. every command and it's return. Failed cheks dont fi and dont touch configs, if anything failse just give the return. STOP: after file write and verdict, I'll choose the next command myself

Result: **PASS** on static + test-suite evidence. `tasks/TASK-001/verification.md` written (157 lines). Agent STOPped, recommended `browser-verify`, did not invoke it.

| Command | Exit | Result |
|---|---|---|
| `npm run lint` | 0 | no findings |
| `npm run typecheck` | 0 | no diagnostics |
| `npm run test` | 0 | 2 files / 14 tests passed |
| `npm run build` | 0 | 27 modules, `index-*.js` 226.39 kB (gzip 70.68 kB) |

NOT-APPLICABLE: format check (no script, no Prettier config), e2e (no Playwright/Cypress).
Skipped on purpose: `npm run dev` / `npm run preview` as long-lived processes outside read-only scope.

Unverified items recorded in the file: requirement-by-requirement conformance, all browser/runtime
evidence, accessibility/visual/performance, e2e coverage.

Note: the agent did not carry over two known gaps from review.md into its Unverified Items —
plan tests 4/5/7/8 and the `validation.ts:36` local-vs-UTC mismatch. Both remain recorded in
review.md and in step 6 of this log.

## 8. Manual browser check (developer, not an agent)

Ran `cd app && npm run dev` and exercised the flow by hand in the browser.

Observed:

- Created a session and the time shown in the list matched the time entered in the form
  (live confirmation of the S1 timezone fix).
- Switched the filter to `cancelled`: 2 rows remained. Switching back to `All` restored the
  full list.
- Browser console: empty, no errors or warnings during load, filter, and create.

Not specifically observed / not recorded: whether the loading indicator was visible on first
paint, and the `<h1>` horizontal padding after the `#root` starter shell was removed.

