# TASK-001: Training Sessions Screen (List, Status Filter, Creation Form)

## Goal

Deliver a single screen that lists internal/corporate training sessions served by a mock API, lets the trainer narrow the list by one status filter, and lets the trainer create a new training session through a validated form.

## Users And Outcome

- **Primary user:** a trainer, the single supported role. The trainer views, filters, and creates training sessions.
- **Outcome:** the trainer can see current training sessions, focus on a single status at a time, and add a new session without leaving the screen, receiving clear inline feedback when input is invalid.
- There is no attendee-facing view and no second role.

## Scope

In scope:

1. Training sessions list view fed by an MSW-backed mock API.
2. Exactly one filter control, filtering by session status client-side over the already-fetched collection.
3. Creation form with exactly two fields (title, start date/time), client-side validation, and a create call to the mock API.
4. Observable list/form states: loading, empty, error, filtered-empty, submitting, submit success, submit failure.
5. At least one behavior-level automated test covering the status filter or successful creation.

Out of scope: everything listed under Non-Goals.

## Acceptance Criteria

### List

- [ ] On screen entry the app requests the training sessions collection from the mock API and shows a loading indicator while the request is pending.
- [ ] On success the screen renders one row per training session; each row shows the session title, start date/time, and status.
- [ ] When the mock API returns zero sessions, the screen shows an empty-state message instead of an empty table/list body.
- [ ] When the mock API returns an error, the screen shows an error message and a retry affordance; retry re-issues the request.
- [ ] The list is reachable without a full page reload after a successful creation (new session is visible in the list).

### Status Filter

- [ ] Exactly one filter control is present and it filters by session status.
- [ ] The filter offers exactly four options: "All", `scheduled`, `completed`, `cancelled`. "All" is the default selection on first load.
- [ ] Filtering is applied client-side to the already-fetched collection; changing the filter issues no new request to the mock API.
- [ ] The filter selection is component state only: it resets to "All" after a reload and is not written to the URL.
- [ ] Selecting a status shows only sessions whose status equals the selection; selecting "All" restores the full set.
- [ ] When a status selection yields zero matches, a filtered-empty message is shown and the filter can still be changed back.
- [ ] The filter control has an accessible label and is operable with keyboard only.

### Creation Form

- [ ] The screen exposes a way to open/reach a training session creation form.
- [ ] The form collects exactly two fields: title and start date/time. No status, duration, trainer, location, capacity, description, or category field is present.
- [ ] Both fields are required; an empty field on submit blocks submission and renders a field-level error message.
- [ ] Title validation: trimmed length must be at least 3 and at most 80 characters. Values outside that range are rejected with a field-level error.
- [ ] Start date/time validation: must be a valid date/time and must be strictly in the future relative to submit time. A past or current timestamp is rejected. There is no upper bound on how far ahead the start may be.
- [ ] A newly created session always has status `scheduled`; the user cannot choose or override the status on create.
- [ ] Validation errors are announced to assistive technology and each error is programmatically associated with its input.
- [ ] Submitting a valid form issues the create call to the mock API; the submit control is disabled (or shows pending state) while in flight to prevent duplicate submissions.
- [ ] On a successful create, the form resets or closes and the new session appears in the list without a manual page refresh. No toast or confirmation banner is required.
- [ ] On a failed create, a form-level error is shown and the user's entered values are preserved.

### Cross-Cutting

- [ ] All interactive controls are reachable and operable by keyboard, with visible focus.
- [ ] No console errors are produced during the list load, filter change, and create flows.
- [ ] The mock API seeds a fixed set of roughly 8 sessions covering all three statuses with at least two sessions per status.
- [ ] Empty and error scenarios are exercised by overriding the mock handlers in tests, not by any in-UI toggle.
- [ ] At least one behavior-level test (Vitest + Testing Library) covers either the status filter or the successful creation flow, and it passes.

## Constraints

- Application Root: `/Users/michaelpetrusha/Desktop/Files/Projects/frontend-acselerator/app` (only frontend candidate in this repository).
- Existing stack (facts from `app/package.json`): React 19, TypeScript, Vite, ESLint, Vitest + Testing Library, MSW.
- "Mock API" is served in-app by MSW; MSW is already a dependency and `app/public/mockServiceWorker.js` exists, so no external backend is required.
- The API contract is deliberately provisional and will be pinned down in the implementation plan, not by a separate `api-integration` pass. It is limited to a collection read and a create call served by MSW behind a replaceable request boundary. Do not specify a fuller contract than that.
- Filtering is client-side; status is never sent to the mock API as a query parameter.
- No design system and no Figma source exist. Plain CSS in the app is acceptable and no `ui-designer` pass is planned.
- Automated coverage is part of the definition of done (see Cross-Cutting criteria).
- No architecture, folder structure, state-management, form-library, or styling-library decisions are made in this document.

## Non-Goals

- Editing, deleting, duplicating, or cancelling an existing training session.
- Session detail page or drill-down navigation.
- Authentication, authorization, or role-based visibility.
- Real backend integration or persistence beyond the mock API's lifetime.
- Pagination, sorting, free-text search, or any second filter.
- Attendee/enrollment management, notifications, calendar export, localization.
- Attendee-facing views or any role other than trainer.
- Filter persistence across reload, URL/query-param state, toasts or confirmation banners.
- In-UI toggles for demonstrating empty or error states.
- A formal or versioned API contract document.

## Facts

### Product Decisions (confirmed by the requester)

- Domain: internal/corporate training sessions. Single role: trainer. No attendee-facing view.
- Status set is exactly `scheduled | completed | cancelled`. Closed set; no other values exist.
- Creation form fields are exactly title and start date/time.
- New sessions are always created with status `scheduled`; status is not user-selectable on create.
- Title: trimmed length >= 3 and <= 80 characters. Start date/time: strictly future relative to submit time, no upper bound; past or current timestamps are rejected.
- Mock seed: roughly 8 sessions, all three statuses represented, at least two per status. Empty and error scenarios are exercised by overriding mock handlers in tests, not via UI toggles.
- Filter state is component state only — no reload persistence, no URL reflection.
- Success feedback is the new row appearing in the list; the form closes or resets. No toast or banner.
- Definition of done includes at least one passing behavior-level test covering the status filter or successful creation.
- The API contract is provisional: a collection read and a create call served by MSW behind a replaceable request boundary, to be pinned down in the implementation plan. No separate `api-integration` pass.
- Filtering is client-side over the already-fetched collection.
- No design system, no Figma source. Plain CSS is acceptable. No `ui-designer` pass is planned.

### Repository Observations

- `app/package.json` declares React 19.2.x, react-dom, TypeScript ~6.0, Vite ^8.3, Vitest ^5, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, and `msw` ^2.15 with `msw.workerDirectory: ["public"]`.
- `app/public/mockServiceWorker.js` is present; no MSW handler files exist yet under `app/src`.
- `app/src` currently contains only `App.tsx`, `main.tsx`, `App.css`, `index.css`, `assets/`, and `test/setup.ts` — this feature is greenfield.
- Scripts available: `dev`, `build`, `lint`, `preview`, `test`, `test:watch`, `typecheck`.
- `tasks/TASK-001/workflow-log.md` exists and is empty apart from its heading.

## Assumptions

Remaining assumptions are presentational or environmental only; none of them gate planning.

- The list and the creation form live on the same screen. Whether the form is inline, in a modal, or in a drawer is left to the implementation plan.
- Creation is not optimistic: the list reflects the mock API's state after a successful create.
- Session records carry a stable identifier and a status field beyond the two user-entered fields; the list displays title, start date/time, and status.
- Single-locale, English-only UI; no localization requirements.
- Desktop-first; the screen should not break on narrow viewports, but no dedicated mobile design is specified.

## Open Questions — All Resolved

All twelve previously open questions (domain meaning, status set, field set, status on create, validation bounds, mock data shape, mock data volume, filter persistence, filtering location, success feedback, visual direction, test expectations) were answered by the requester and are recorded under Facts / Product Decisions.

No blocking questions remain. Two minor items are deliberately deferred to the implementation plan rather than left unanswered here:

- Exact endpoint paths, payload shape, and error shape of the MSW mock — deferred by explicit decision; the contract is provisional and belongs to the plan.
- Whether the creation form is rendered inline, in a modal, or in a drawer — a presentation choice with no effect on the acceptance criteria.

## Readiness

**Ready for planning.** Every product decision that shapes a testable criterion is settled: the role, the closed status set, the exact two-field form, the always-`scheduled` create behavior, the title and start-date validation bounds, the client-side filtering model, the non-persistent filter state, the mock seed shape, the absence of toasts, and the test-coverage bar. The remaining deferred items are implementation-plan concerns by explicit decision, and no `api-integration` or `ui-designer` pass is required.
