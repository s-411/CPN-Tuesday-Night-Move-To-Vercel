## Onboarding Flow Brief (Steps 1–4)

### Confirmed decisions
- **Routing**: Keep SPA. Render steps by `window.location.pathname` in `src/App.tsx`. Add SPA fallback so deep-links like `/step-1` resolve to `index.html`.
- **Visual parity**: Steps 1–2 must match the PNGs exactly; reuse existing field options and validation to stay DB-compliant.
- **Auth**: Default to sign up; if email exists, fall back to sign in. Supabase signups are auto-confirmed. No extra password policy. If already signed in, skip onboarding.
- **Persistence**: Use `sessionStorage` across steps; Step 4 reads from it for speed. Commit to Supabase immediately after auth (non-blocking with retries). If data entry insert fails, do not roll back the girl.
- **Gating**: Enforce sequential steps. Optionally set `users.onboarding_completed_at` after successful commit to prevent re-onboarding.
- **Error UX**: Clear inline errors and a "Skip" control to proceed even if inserts fail.

### Architecture overview
- **UI pages**
  - `src/pages/onboarding/Step1.tsx`
  - `src/pages/onboarding/Step2.tsx`
  - `src/pages/onboarding/Step3.tsx`
  - `src/pages/onboarding/Step4.tsx`
- **Refactored form components**
  - `src/components/forms/GirlForm.tsx` (from `AddGirlModal`)
  - `src/components/forms/DataEntryForm.tsx` (from `AddDataModal`)
- **Onboarding utilities**
  - `src/lib/onboarding/session.ts` – get/set/clear step data in `sessionStorage`
  - `src/lib/onboarding/commit.ts` – commit Step 1/2 to Supabase with retries/backoff
  - `src/lib/onboarding/guard.ts` – helpers for gating and redirects (optional)
- **App integration**
  - Extend `src/App.tsx` to handle `/step-1..4`, redirect `/signup` → `/step-1`, and block steps for signed-in users.

### Session data shape
```json
{
  "onboarding.step1": {
    "name": "string",
    "age": 18,
    "ethnicity": "string|null",
    "hairColor": "string|null",
    "locationCity": "string|null",
    "locationCountry": "string|null",
    "rating": 6.0,
    "v": 1
  },
  "onboarding.step2": {
    "date": "YYYY-MM-DD",
    "amountSpent": "string",
    "hours": "string",
    "minutes": "string (0-59)",
    "numberOfNuts": "string (>=0)",
    "v": 1
  },
  "onboarding.state": { "commitStatus": "idle|in-progress|success|error", "v": 1 }
}
```

## Phased plan with tasks and tests

### Phase 1 — Routing and gating
- **Tasks**
  - Handle `/step-1..4` in `src/App.tsx`; render matching step component.
  - Add `goTo(path)` wrapper around `history.pushState` and a pathname change listener to re-render.
  - If `user` exists and path starts with `/step-`, redirect to `/`.
  - Redirect `/signup` to `/step-1`.
  - Ensure SPA fallback (Vercel rewrite to `index.html`).
- **Tests**
  - Chrome DevTools: direct-load all step URLs without 404.
  - When logged in, visiting `/step-*` redirects to app.
  - `/signup` redirects to `/step-1`.

### Phase 2 — Refactor forms for reuse
- **Tasks**
  - Extract `GirlForm` from `AddGirlModal` fields/validation; reuse `ETHNICITIES`, `HAIR_COLORS`, `RatingTileSelector`.
  - Extract `DataEntryForm` from `AddDataModal` with the same rules (duration > 0, nuts ≥ 0). Allow preview toggle.
  - Update existing modals to use these form components to avoid duplication.
- **Tests**
  - Vitest: unit tests for validation helpers (age ≥ 18, duration > 0, nuts ≥ 0).
  - Manual: open modals and verify no regressions.

### Phase 3 — Step 1 and Step 2 pages (pixel parity)
- **Tasks**
  - Build `Step1.tsx` using `GirlForm` with full-page layout matching `docs/Step 1.png`. On submit: save to `sessionStorage` → navigate `/step-2`.
  - Build `Step2.tsx` using `DataEntryForm` with full-page layout matching `docs/Step 2.png`. On submit: save to `sessionStorage` → navigate `/step-3`.
  - Gating: if Step 1 data missing and user hits `/step-2`, redirect to `/step-1`.
- **Tests**
  - Chrome DevTools: verify `sessionStorage` keys and persistence on refresh.
  - Visual comparison to PNGs; verify field and error states.

### Phase 4 — Auth page (Step 3)
- **Tasks**
  - Build `Step3.tsx` per `docs/Step 3.png` with email + password (no preview here).
  - On submit:
    - Try `signUp(email, password)`.
    - If error indicates existing user, auto `signIn(email, password)`.
    - Handle errors inline; never store password in `sessionStorage`.
    - On success: set onboarding commit status to `in-progress`, start commit (Phase 5), and immediately navigate to `/step-4`.
  - Add "Skip" to proceed to `/step-4` even if auth/commit not completed.
- **Tests**
  - New email: signs up and proceeds to Step 4.
  - Existing email + correct password: signs in and proceeds.
  - Wrong password: inline error; stays on Step 3.

### Phase 5 — Commit onboarding data to Supabase
- **Tasks**
  - `commitOnboardingToSupabase(step1, step2)`:
    - Ensure auth session present; otherwise set error and return.
    - Optional retry until `public.users` row is visible (up to 3 attempts, 400–600ms backoff).
    - Insert into `girls` (`.select().single()` to get `id`), with `is_active = true`.
    - Insert into `data_entries` with that `girl_id`. Respect `duration_minutes > 0`, `number_of_nuts ≥ 0`.
    - If entry insert fails, do not delete the girl. Record error status and keep `girl_id` so we can message: "Profile saved; add the entry later in the app."
    - On success, set `users.onboarding_completed_at = now()` for current user.
    - Update `sessionStorage.onboarding.state.commitStatus` to `success|error`.
  - Resilience: retry with exponential backoff for transient errors; show friendly message for profile limit violations.
- **Tests**
  - Supabase: verify 1 `users` row (on signup), 1 `girls` row, 1 `data_entries` row after flow.
  - Offline/network simulations: graceful error and non-blocking Skip.
  - Vitest: unit test pure payload mapping from Step1/2 → DB inserts.

### Phase 6 — Results page (Step 4)
- **Tasks**
  - `Step4.tsx`:
    - Read Step 1 + Step 2 from `sessionStorage`.
    - Compute with `calculateCostPerNut`, `calculateTimePerNut`, `calculateCostPerHour`.
    - Display girl name and three metrics; visually emphasize Cost/Nut.
    - Show commit status badge: Saving / Saved / Error.
    - "Finish" navigates to `/` and clears onboarding session keys.
  - If data missing, redirect to earliest missing step.
- **Tests**
  - Metrics match calculations.
  - Status transitions reflect background commit.
  - After Finish, session keys cleared; app shows inserted data when commit succeeded.

### Phase 7 — Re-entry prevention and polish
- **Tasks**
  - If signed in, block `/step-*` and redirect to app.
  - If `onboarding_completed_at` exists for signed-in user, also block `/step-*`.
  - Redirect `/signup` → `/step-1`.
  - Logging: console warnings for commit errors (no PII), short correlation id.
- **Tests**
  - Signed-in user visiting `/step-1` is redirected to app.
  - Fresh user completes onboarding; revisiting steps redirects.

## Risks and mitigations
- **Auth-to-profile propagation delay**: Add short retries before inserts.
- **Free-tier profile limit**: If insertion blocked, show guidance and allow Skip.
- **Deep-link 404s**: Ensure SPA fallback rewrite on hosting.
- **Duplication drift**: Refactor to shared form components and reuse in modals.

## SPA fallback (Vercel)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Phase gates (what to verify)
- **Phase 1**: All step routes render; redirects OK.
- **Phase 2**: Modals unchanged; validation helpers pass.
- **Phase 3**: Step 1/2 match PNGs; `sessionStorage` persists across refresh.
- **Phase 4**: Sign up/sign in fallback works; errors are clear; Skip available.
- **Phase 5**: DB rows appear as expected; commit resilient to transient errors.
- **Phase 6**: Step 4 metrics correct; status updates; Finish clears session and lands in app.
- **Phase 7**: Re-entry blocked for signed-in or completed-onboarding users.


