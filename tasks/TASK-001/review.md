# TASK-001 — Code Review

Surface: staged diff only (`git diff --cached`, base = `HEAD`), 26 files.
Application Root: `app/`.
Reviewer: `code-reviewer` role, read-only. This file was transcribed from the role's
report because the role has no write authority by design.

## Checks run by the reviewer

| Command | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm run test` | 2 files / 14 tests passed |
| `npm run build` | succeeded, `dist/assets/index-*.js` = 554.30 kB (204 kB gzip), chunk-size warning |

## Verdict

**NEEDS-CHANGES** — B1 and S1 must be resolved. S2 and the cleanup items should follow
in the same pass.

## Blocking

### B1 — MSW is shipped in the production bundle

`app/src/features/training-sessions/api.ts:1`

```ts
import { TRAINING_SESSIONS_PATH } from '../../mocks/handlers.ts'
```

`mocks/handlers.ts:1` does `import { http, HttpResponse } from 'msw'` and evaluates the
`handlers` array at module scope, so the import is not tree-shakeable. Chain:
`App.tsx` -> `TrainingSessionsScreen` -> `api.ts` -> `mocks/handlers.ts` -> `msw`.

Confirmed in the built output, not inferred: `grep` of the emitted bundle matches
`mswjs.io/docs/...` and `Invariant Violation`; bundle is 554 kB where React 19 +
react-dom alone is ~190 kB.

Failure scenario: a production deploy ships the entire mock server plus seed data and can
install request interception in a real user's browser. Contradicts plan Decision 3
("`api.ts` is the only module that calls fetch... swapping MSW for a real backend later
touches only this file"). The dynamic `import('./mocks/browser.ts')` in `main.tsx:11`,
which exists precisely to keep MSW out of the bundle, is defeated by this static import.

Remedy named by the reviewer: invert ownership — the path constant lives in the feature
and `mocks/handlers.ts` imports it, not the reverse.

## Should fix

### S1 — A created session is displayed at the wrong time in any non-UTC timezone

`api.ts:19-21` converts the `datetime-local` value with `new Date(localValue).toISOString()`
(parsed as **local** time), while `formatting.ts:1-5` pins `timeZone: 'UTC'` for display.

Scenario: a trainer in UTC+3 enters `2026-04-14T09:00`, the POST stores
`2026-04-14T06:00:00.000Z`, and the new row renders "Apr 14, 2026, 6:00 AM". The value
they typed is never shown back to them. Seed rows hide this because they are authored in
UTC.

The implementation plan (line 208) flagged `api.ts` ISO conversion as "the most probable
silent defect in the whole feature" and proposed a unit test for it; that test was in the
deliberately scoped-out set, so nothing catches it.

### S2 — Dark-mode text contrast below 4.5:1 on user-visible copy

`src/index.css:33-46` activates a dark palette (`--bg: #16171d`), and
`trainingSessions.css` hardcodes light-mode-only colors:

- `--ts-danger: #b32424` on `#16171d` ~ **2.7:1** — every field error, the form-level
  create error, and the list error message.
- `--ts-muted: #5b6270` on `#16171d` ~ **2.9:1** — `.training-sessions__row-time`,
  `.training-sessions__empty`, `.training-sessions__loading`.

The validation errors are the lowest-contrast text in the feature, which inverts the
intent of the "errors are announced / associated" criterion for sighted low-vision users.

Focus rings (`trainingSessions.css:56-59`, `outline: 3px solid #2563eb`) are correctly
implemented; the "visible focus" criterion is met.

## Nits

- `CreateTrainingSessionForm.tsx:40-43` focuses `titleRef` whenever *any* field error
  exists. Submitting with a valid title and an empty date moves focus to the already-valid
  title input rather than the first invalid field.
- `TrainingSessionsScreen.tsx:66-70` mounts the `role="status"` region together with its
  text. A live region that appears at the same time as its content is announced unreliably
  by some screen readers; an always-mounted empty region is the robust form.
- `api.ts` exports three functions (`toIsoStartsAt` added) where plan step 5 said "exactly
  two". Harmless and arguably better for testability, but undeclared.

## Deviations from the plan

Declared by the coder in `workflow-log.md` and confirmed present, benign, and
lint-motivated:

- `formatting.ts` extraction (react-refresh/only-export-components).
- `loading` reset moved into `reload()` (`useTrainingSessions.ts:50-53`).
- `emptyVariant: 'collection' | 'filtered'` instead of a boolean prop
  (`TrainingSessionsList.tsx:7`).

Undeclared:

- **B1** — the plan forbade this coupling by construction; it was not listed in the
  workflow log.
- Test scope: plan tests 1, 3, 4, 5, 7, 8 are absent. Explicitly authorized by the prompt
  recorded in the workflow log, so a sanctioned scope cut rather than an unauthorized
  deviation.

## Deletion / cleanup review

Correctly deleted per plan step 9, zero remaining references under `app/src` and
`app/index.html`: `src/App.css`, `src/assets/hero.png`, `src/assets/react.svg`,
`src/assets/vite.svg`. `src/index.css` correctly kept.

Missed cleanup:

- `app/public/icons.svg` is orphaned — its only consumer was the deleted starter markup
  (`<use href="/icons.svg#documentation-icon">` in the old `App.tsx`). It still ships to
  `dist`.
- `src/index.css` retains dead starter-only rules: `#social .button-icon` (line 48),
  `.counter` (line 99), and the `#root` starter shell (lines 53-63:
  `width: 1126px; text-align: center; border-inline: 1px solid var(--border)`), which
  still draws two vertical rules around the new screen and centres text that
  `trainingSessions.css:8` then overrides with `text-align: left`.

## Residual coverage gaps

No automated coverage for four acceptance criteria: empty state, error + retry,
invalid-submit-blocks-the-POST, failed-create-preserves-values. Also untested: the
`api.ts` ISO conversion (source of S1) and the POST handler ignoring a client-supplied
`status`. The manual `npm run dev` pass over the eight acceptance states listed in the
plan's Verification Commands has not been performed or recorded.

## Developer decision

Fix all of B1 + S1 + S2 + the cleanup items in one scoped `coder` pass. Plan tests
4, 5, 7, 8 stay deferred to `test-generator` as originally scoped.
