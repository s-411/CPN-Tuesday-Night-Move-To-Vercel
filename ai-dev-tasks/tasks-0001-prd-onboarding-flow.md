# Task List: Onboarding Flow Implementation

**PRD Reference:** `0001-prd-onboarding-flow.md`

**Status:** Phase 2 Complete - Detailed Sub-Tasks Generated

---

## Current State Assessment

### Existing Infrastructure
- **Framework**: React 18.3 + TypeScript + Vite 5.4
- **Styling**: Tailwind CSS with custom utility classes (card-cpn, input-cpn, btn-cpn, etc.)
- **Auth**: Supabase Auth configured with AuthContext
- **Database**: Supabase with existing schema (users, girls, data_entries tables)
- **Payments**: Stripe integration already configured
- **State Management**: React hooks + Context API (no external state library)
- **Routing**: Currently none - App.tsx manages view state manually
- **Testing**: No testing infrastructure present

### Existing Components to Leverage
- `AddGirlModal.tsx` - Contains girl profile form logic (will extract to page)
- `AddDataModal.tsx` - Contains data entry form logic (will extract to page)
- `RatingTileSelector.tsx` - Can reuse directly for hotness rating
- `UpgradeModal.tsx` - Reference for upgrade UI design
- `SignIn.tsx` / `SignUp.tsx` - Reference for auth form patterns
- `calculations.ts` - CPN calculation functions ready to use
- `stripe/config.ts` - Player Mode pricing already configured

### Key Gaps to Address
1. Need to install React Router v6
2. Need to extend AuthContext for OTP authentication
3. Need to create localStorage utility functions
4. Need to build data sync mechanism
5. Need to create 7 new page components for onboarding flow
6. Need to modify App.tsx to integrate router

---

## Relevant Files

### Files to Create
- `src/pages/onboarding/StartPage.tsx` - Entry point landing page with redirect logic
- `src/pages/onboarding/OnboardingLayout.tsx` - Shared layout wrapper for all onboarding steps
- `src/pages/onboarding/Step1AddGirl.tsx` - Add girl profile form page
- `src/pages/onboarding/Step2AddData.tsx` - Add data entry form page
- `src/pages/onboarding/Step3EmailVerify.tsx` - Email verification with OTP
- `src/pages/onboarding/Step4Results.tsx` - CPN results display and upgrade options
- `src/pages/onboarding/WelcomePremium.tsx` - Post-purchase welcome for premium users
- `src/pages/onboarding/WelcomeFree.tsx` - Welcome page for free tier users
- `src/hooks/useOnboardingData.ts` - Custom hook for localStorage management and step navigation
- `src/lib/onboarding/storage.ts` - localStorage utility functions for onboarding data
- `src/lib/onboarding/sync.ts` - Data synchronization logic (localStorage → Supabase)
- `src/lib/onboarding/validation.ts` - Onboarding-specific validation functions
- `src/lib/onboarding/types.ts` - TypeScript types for onboarding data structures

### Files to Modify
- `src/App.tsx` - Add React Router setup and route configuration
- `src/main.tsx` - Wrap App with BrowserRouter
- `src/contexts/AuthContext.tsx` - Add OTP authentication methods (signInWithOtp, verifyOtp)
- `package.json` - Add react-router-dom dependency

### Files to Reference (No Modifications)
- `src/components/AddGirlModal.tsx` - Extract form fields and validation logic
- `src/components/AddDataModal.tsx` - Extract form fields and calculation preview
- `src/components/RatingTileSelector.tsx` - Reuse component as-is
- `src/lib/calculations.ts` - Use existing CPN calculation functions
- `src/lib/stripe/config.ts` - Use existing STRIPE_CONFIG for pricing
- `src/pages/SignIn.tsx` - Reference for form styling and error handling patterns

### Notes
- No test files will be created as the codebase currently has no testing infrastructure
- All new files follow existing TypeScript patterns and naming conventions
- Component styling will use existing Tailwind classes for consistency
- localStorage keys will be namespaced with `onboarding_` prefix

---

## Tasks

### 1.0 Setup: Install Dependencies and Configure Routing Infrastructure
- [ ] 1.1 Install `react-router-dom@^6.20.0` via npm/yarn
- [ ] 1.2 Update `src/main.tsx` to import and wrap `<App />` with `<BrowserRouter>` from react-router-dom
- [ ] 1.3 Create `src/pages/onboarding/` directory structure
- [ ] 1.4 Verify dev server restarts successfully with new dependency
- [ ] 1.5 Run `npm run typecheck` to ensure no TypeScript errors from router types

### 2.0 Core Infrastructure: Create Onboarding Data Management System
- [ ] 2.1 Create `src/lib/onboarding/types.ts` and define TypeScript interfaces:
  - [ ] 2.1.1 Define `OnboardingGirlData` interface matching girl form fields (name, age, ethnicity, hair_color, location_city, location_country, rating)
  - [ ] 2.1.2 Define `OnboardingDataEntry` interface matching data entry fields (date, amount_spent, duration_minutes, number_of_nuts)
  - [ ] 2.1.3 Define `STORAGE_KEYS` constant object with localStorage key names
- [ ] 2.2 Create `src/lib/onboarding/storage.ts` with localStorage utility functions:
  - [ ] 2.2.1 Write `saveGirlData(data: OnboardingGirlData): void` function
  - [ ] 2.2.2 Write `getGirlData(): OnboardingGirlData | null` function with error handling for invalid JSON
  - [ ] 2.2.3 Write `saveDataEntry(data: OnboardingDataEntry): void` function
  - [ ] 2.2.4 Write `getDataEntry(): OnboardingDataEntry | null` function
  - [ ] 2.2.5 Write `saveEmail(email: string): void` function
  - [ ] 2.2.6 Write `getEmail(): string | null` function
  - [ ] 2.2.7 Write `clearOnboardingData(): void` function to remove all onboarding keys
  - [ ] 2.2.8 Add try-catch error handling for localStorage quota exceeded scenarios
- [ ] 2.3 Create `src/lib/onboarding/validation.ts` with validation helper functions:
  - [ ] 2.3.1 Write `validateGirlData(data: Partial<OnboardingGirlData>): { valid: boolean; errors: string[] }` function
  - [ ] 2.3.2 Write `validateDataEntry(data: Partial<OnboardingDataEntry>): { valid: boolean; errors: string[] }` function
  - [ ] 2.3.3 Implement age validation (min 18, max 120)
  - [ ] 2.3.4 Implement rating validation (5.0 - 10.0 range)
  - [ ] 2.3.5 Implement numeric field validations (amount_spent >= 0, duration_minutes > 0, number_of_nuts >= 0)
- [ ] 2.4 Create `src/hooks/useOnboardingData.ts` custom hook:
  - [ ] 2.4.1 Import storage utility functions
  - [ ] 2.4.2 Create hook that returns `{ girlData, dataEntry, saveGirl, saveEntry, clear }` methods
  - [ ] 2.4.3 Add React state management for cached data to avoid repeated localStorage reads
  - [ ] 2.4.4 Add `useEffect` to load initial data from localStorage on mount

### 3.0 Authentication: Extend AuthContext with OTP Support
- [ ] 3.1 Open `src/contexts/AuthContext.tsx` and locate the `AuthContextType` interface
- [ ] 3.2 Add new method signatures to `AuthContextType`:
  - [ ] 3.2.1 Add `signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>`
  - [ ] 3.2.2 Add `verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>`
  - [ ] 3.2.3 Add `resendOtp: (email: string) => Promise<{ error: AuthError | null }>`
- [ ] 3.3 Implement `signInWithOtp` function in AuthProvider component:
  - [ ] 3.3.1 Call `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`
  - [ ] 3.3.2 Return error object in consistent format `{ error }`
  - [ ] 3.3.3 Add console logging for debugging OTP send attempts
- [ ] 3.4 Implement `verifyOtp` function in AuthProvider component:
  - [ ] 3.4.1 Call `supabase.auth.verifyOtp({ email, token, type: 'email' })`
  - [ ] 3.4.2 On success, session is automatically set by Supabase auth listener
  - [ ] 3.4.3 Return error object if verification fails
  - [ ] 3.4.4 Handle edge cases: expired code, invalid code, too many attempts
- [ ] 3.5 Implement `resendOtp` function (wrapper for `signInWithOtp` with same email)
- [ ] 3.6 Add new methods to the `value` object returned by AuthContext.Provider
- [ ] 3.7 Test OTP flow in browser console to verify Supabase connection works

### 4.0 UI Implementation: Build Onboarding Step Pages (Steps 1-4)
- [ ] 4.1 Create `src/pages/onboarding/OnboardingLayout.tsx`:
  - [ ] 4.1.1 Import `Outlet` from react-router-dom
  - [ ] 4.1.2 Create layout component with minimal header (CPN logo) and `<Outlet />` for child routes
  - [ ] 4.1.3 Add progress indicator component showing "Step X of 4" (calculate from current route)
  - [ ] 4.1.4 Style with existing Tailwind classes (bg-cpn-dark, etc.)
  - [ ] 4.1.5 Add mobile-first responsive container (max-w-md mx-auto px-4)
- [ ] 4.2 Create `src/pages/onboarding/Step1AddGirl.tsx`:
  - [ ] 4.2.1 Reference `AddGirlModal.tsx` and extract all form fields to full-page layout
  - [ ] 4.2.2 Import and use `RatingTileSelector` component for rating input
  - [ ] 4.2.3 Create form state management with React useState for all fields (name, age, ethnicity, hair_color, location_city, location_country, rating)
  - [ ] 4.2.4 Implement form validation on submit (name required, age >= 18, rating 5.0-10.0)
  - [ ] 4.2.5 Add ethnicity dropdown using existing ETHNICITIES array from AddGirlModal
  - [ ] 4.2.6 Add hair color dropdown using existing HAIR_COLORS array from AddGirlModal
  - [ ] 4.2.7 On form submit, call `saveGirlData()` from useOnboardingData hook
  - [ ] 4.2.8 After successful save, use `useNavigate()` to navigate to `/onboarding/step-2`
  - [ ] 4.2.9 Add button with text "Add Data" (styled with btn-cpn class)
  - [ ] 4.2.10 Pre-populate form if localStorage already contains girl data (for back navigation)
  - [ ] 4.2.11 Add error display component for validation errors (red border, text-red-400)
  - [ ] 4.2.12 Style all inputs with input-cpn and select-cpn classes for consistency
- [ ] 4.3 Create `src/pages/onboarding/Step2AddData.tsx`:
  - [ ] 4.3.1 Reference `AddDataModal.tsx` and extract data entry form fields
  - [ ] 4.3.2 Import girl name from localStorage using `useOnboardingData` hook
  - [ ] 4.3.3 Display girl name at top of page (e.g., "Add Data for Sarah")
  - [ ] 4.3.4 Create form state for: date, amount_spent, hours, minutes, number_of_nuts
  - [ ] 4.3.5 Calculate `duration_minutes = hours * 60 + minutes` on state change
  - [ ] 4.3.6 Import CPN calculation functions: `calculateCostPerNut`, `calculateTimePerNut`, `calculateCostPerHour`
  - [ ] 4.3.7 Display live calculation preview below form (same as AddDataModal preview section)
  - [ ] 4.3.8 Implement form validation: amount >= 0, duration > 0, nuts >= 0
  - [ ] 4.3.9 On submit, save data entry to localStorage via `saveEntry()` from hook
  - [ ] 4.3.10 Navigate to `/onboarding/step-3` on successful save
  - [ ] 4.3.11 Add "Back" button that navigates to `/onboarding/step-1` without clearing data
  - [ ] 4.3.12 Add submit button with text "Calculate CPN" (btn-cpn class)
  - [ ] 4.3.13 Pre-populate form if localStorage contains data entry (back navigation support)
  - [ ] 4.3.14 Set default date to today's date using `new Date().toISOString().split('T')[0]`
- [ ] 4.4 Create `src/pages/onboarding/Step3EmailVerify.tsx`:
  - [ ] 4.4.1 Create two-phase UI: email input phase and code verification phase
  - [ ] 4.4.2 Add state management for: email, verificationCode, phase ('email' | 'verify'), error, loading, countdown
  - [ ] 4.4.3 Import `signInWithOtp`, `verifyOtp` from useAuth hook
  - [ ] 4.4.4 Phase 1 - Email Input:
    - [ ] 4.4.4.1 Create email input field (type="email", required)
    - [ ] 4.4.4.2 Add submit button "Send Verification Code"
    - [ ] 4.4.4.3 On submit, call `signInWithOtp(email)`
    - [ ] 4.4.4.4 On success, save email to localStorage and switch to 'verify' phase
    - [ ] 4.4.4.5 Display loading state while OTP is being sent
    - [ ] 4.4.4.6 Handle errors: invalid email, rate limit exceeded, network error
  - [ ] 4.4.5 Phase 2 - Code Verification:
    - [ ] 4.4.5.1 Display message: "We sent a 6-digit code to {email}"
    - [ ] 4.4.5.2 Create 6-digit code input (single input field, type="text", maxLength=6, pattern="[0-9]*")
    - [ ] 4.4.5.3 Add submit button "Verify Code"
    - [ ] 4.4.5.4 On submit, call `verifyOtp(email, code)`
    - [ ] 4.4.5.5 On success, navigate to `/onboarding/step-4`
    - [ ] 4.4.5.6 On error, display specific messages: "Invalid code", "Code expired", "Too many attempts"
  - [ ] 4.4.6 Add "Resend Code" button with countdown timer (30 seconds cooldown):
    - [ ] 4.4.6.1 Disable button during countdown
    - [ ] 4.4.6.2 Display countdown: "Resend Code (23s)" while counting
    - [ ] 4.4.6.3 Call `resendOtp(email)` when clicked after cooldown
    - [ ] 4.4.6.4 Reset countdown timer after resend
  - [ ] 4.4.7 Add "Back" button to return to Step 2 (phase 1 only)
  - [ ] 4.4.8 Add "Change Email" link/button in phase 2 to return to phase 1
  - [ ] 4.4.9 Style with existing form classes (input-cpn, btn-cpn, btn-secondary)
  - [ ] 4.4.10 Add explanation text: "We need your email to save your data and show results"
- [ ] 4.5 Create `src/pages/onboarding/Step4Results.tsx`:
  - [ ] 4.5.1 Add route guard: redirect to step-1 if user is not authenticated (check `user` from useAuth)
  - [ ] 4.5.2 Load girl data and data entry from localStorage using `useOnboardingData` hook
  - [ ] 4.5.3 Calculate CPN metrics using imported calculation functions:
    - [ ] 4.5.3.1 Calculate `costPerNut = calculateCostPerNut(amount_spent, number_of_nuts)`
    - [ ] 4.5.3.2 Calculate `timePerNut = calculateTimePerNut(duration_minutes, number_of_nuts)`
    - [ ] 4.5.3.3 Calculate `costPerHour = calculateCostPerHour(amount_spent, duration_minutes)`
  - [ ] 4.5.4 Display girl name at top (e.g., "Sarah's Results")
  - [ ] 4.5.5 Create large, prominent display for Cost Per Nut (primary metric):
    - [ ] 4.5.5.1 Use large text size (text-4xl or text-5xl)
    - [ ] 4.5.5.2 Style with cpn-yellow color
    - [ ] 4.5.5.3 Format currency with `formatCurrency()` helper
  - [ ] 4.5.6 Display secondary metrics in smaller cards/stats (Time Per Nut, Cost Per Hour)
  - [ ] 4.5.7 Create upgrade options section with two pricing cards:
    - [ ] 4.5.7.1 Card 1: Player Mode Weekly - Import price from `STRIPE_CONFIG.plans.playerWeekly`
    - [ ] 4.5.7.2 Card 2: Player Mode Annual - Import price from `STRIPE_CONFIG.plans.playerAnnual`
    - [ ] 4.5.7.3 Display price, billing period, and "Save 74%" badge for annual
    - [ ] 4.5.7.4 List key features (unlimited profiles, full analytics, etc.) from STRIPE_CONFIG
    - [ ] 4.5.7.5 Style annual card with highlight border or gradient to emphasize
  - [ ] 4.5.8 Add button text "Unlock Player Mode" or "Activate Player Mode" (not "Upgrade")
  - [ ] 4.5.9 Add onClick handlers for upgrade buttons (will implement Stripe integration in Task 7)
  - [ ] 4.5.10 Add "Continue with Free Mode" button (secondary styling, smaller)
  - [ ] 4.5.11 On "Continue with Free Mode" click, navigate to `/onboarding/welcome-free`
  - [ ] 4.5.12 Prevent browser back button navigation using `useEffect` with `window.history.replaceState`
  - [ ] 4.5.13 Add loading state while metrics are being calculated
  - [ ] 4.5.14 Style entire page with card-cpn containers and mobile-first responsive layout

### 5.0 Welcome Pages: Build Post-Onboarding Welcome Flows
- [ ] 5.1 Create `src/pages/onboarding/WelcomePremium.tsx`:
  - [ ] 5.1.1 Create congratulatory hero section with celebratory message (e.g., "Welcome to Player Mode! 🎉")
  - [ ] 5.1.2 Display brief feature list highlighting premium benefits:
    - [ ] 5.1.2.1 "Unlimited Profiles" with icon
    - [ ] 5.1.2.2 "Full Analytics Access" with icon
    - [ ] 5.1.2.3 "Leaderboards & Competitions" with icon
    - [ ] 5.1.2.4 "Share Features" with icon
  - [ ] 5.1.3 Add large "Go to Dashboard" button (btn-cpn, full-width on mobile)
  - [ ] 5.1.4 Import `useNavigate` and navigate to `/dashboard` on button click
  - [ ] 5.1.5 Use lucide-react icons for visual appeal (Trophy, BarChart, Users, Share2)
  - [ ] 5.1.6 Style with cpn-yellow accents and dark background
  - [ ] 5.1.7 Add route guard: only accessible to authenticated users
- [ ] 5.2 Create `src/pages/onboarding/WelcomeFree.tsx`:
  - [ ] 5.2.1 Create welcoming hero section (e.g., "Welcome to CPN!")
  - [ ] 5.2.2 Display brief explanation of free tier features:
    - [ ] 5.2.2.1 "Track 1 active profile"
    - [ ] 5.2.2.2 "Basic data entry"
    - [ ] 5.2.2.3 "Limited analytics preview"
  - [ ] 5.2.3 Add subtle upgrade prompt: "Upgrade anytime to unlock unlimited profiles and advanced features"
  - [ ] 5.2.4 Add large "Go to Dashboard" button (btn-cpn)
  - [ ] 5.2.5 Navigate to `/dashboard` on button click
  - [ ] 5.2.6 Use more neutral styling (less celebratory than premium page)
  - [ ] 5.2.7 Add route guard: only accessible to authenticated users
- [ ] 5.3 Create `src/pages/onboarding/StartPage.tsx`:
  - [ ] 5.3.1 Import `useAuth` and `useNavigate` hooks
  - [ ] 5.3.2 Add `useEffect` hook that runs on component mount
  - [ ] 5.3.3 Check if user is authenticated: `if (user) navigate('/dashboard')`
  - [ ] 5.3.4 If not authenticated: `navigate('/onboarding/step-1')`
  - [ ] 5.3.5 Display loading spinner while redirect logic runs
  - [ ] 5.3.6 Add brief delay (100ms) to prevent flash of content
  - [ ] 5.3.7 Handle edge case: loading state from AuthContext (wait until loading === false)

### 6.0 Data Synchronization: Implement localStorage to Database Sync
- [ ] 6.1 Create `src/lib/onboarding/sync.ts` with data sync functions:
  - [ ] 6.1.1 Import supabase client and onboarding types
  - [ ] 6.1.2 Define `syncOnboardingData(userId: string): Promise<{ success: boolean; error?: string }>` function
  - [ ] 6.1.3 Implement girl data insertion:
    - [ ] 6.1.3.1 Load girl data from localStorage via `getGirlData()`
    - [ ] 6.1.3.2 If no data exists, return error
    - [ ] 6.1.3.3 Call `supabase.from('girls').insert({ ...girlData, user_id: userId, is_active: true }).select().single()`
    - [ ] 6.1.3.4 Store returned girl.id for next step
    - [ ] 6.1.3.5 Handle insertion errors (RLS violations, constraint failures)
  - [ ] 6.1.4 Implement data entry insertion:
    - [ ] 6.1.4.1 Load data entry from localStorage via `getDataEntry()`
    - [ ] 6.1.4.2 Call `supabase.from('data_entries').insert({ ...entryData, girl_id: girlId })`
    - [ ] 6.1.4.3 Handle insertion errors
  - [ ] 6.1.5 Update user's onboarding_completed_at timestamp:
    - [ ] 6.1.5.1 Call `supabase.from('users').update({ onboarding_completed_at: new Date().toISOString() }).eq('id', userId)`
  - [ ] 6.1.6 On success, clear localStorage via `clearOnboardingData()`
  - [ ] 6.1.7 Return success/error status object
  - [ ] 6.1.8 Add comprehensive error handling with try-catch blocks
  - [ ] 6.1.9 Add retry logic with exponential backoff (3 attempts):
    - [ ] 6.1.9.1 Create `retryWithBackoff` helper function
    - [ ] 6.1.9.2 Wrap database calls in retry logic
    - [ ] 6.1.9.3 Wait times: 1s, 2s, 4s between retries
- [ ] 6.2 Integrate sync into Step4Results page:
  - [ ] 6.2.1 Import `syncOnboardingData` function
  - [ ] 6.2.2 Add sync state: `syncStatus: 'pending' | 'syncing' | 'success' | 'error'`
  - [ ] 6.2.3 Add `useEffect` hook that triggers sync on page load:
    - [ ] 6.2.3.1 Check if user is authenticated
    - [ ] 6.2.3.2 Call `syncOnboardingData(user.id)`
    - [ ] 6.2.3.3 Update syncStatus based on result
  - [ ] 6.2.4 Display sync status indicator:
    - [ ] 6.2.4.1 Show loading spinner during sync
    - [ ] 6.2.4.2 Show success checkmark on successful sync
    - [ ] 6.2.4.3 Show error message with retry button on failure
  - [ ] 6.2.5 If sync fails after all retries, allow user to proceed but show warning:
    - [ ] 6.2.5.1 Display: "We're still syncing your data. Please check your dashboard in a moment."
    - [ ] 6.2.5.2 Still allow upgrade buttons to be clickable
  - [ ] 6.2.6 Add manual retry button for failed syncs that calls syncOnboardingData again

### 7.0 Integration: Connect Stripe Checkout and Route Guards
- [ ] 7.1 Implement Stripe checkout integration in Step4Results:
  - [ ] 7.1.1 Import existing Stripe checkout function/logic from codebase (check UpgradeModal or SubscriptionPage for reference)
  - [ ] 7.1.2 Add state for checkout loading: `checkoutLoading: 'weekly' | 'annual' | null`
  - [ ] 7.1.3 Create `handleUpgrade` function accepting planType parameter ('weekly' | 'annual')
  - [ ] 7.1.4 Call Supabase edge function to create Stripe checkout session:
    - [ ] 7.1.4.1 Determine priceId from STRIPE_CONFIG based on planType
    - [ ] 7.1.4.2 Call `supabase.functions.invoke('stripe-checkout', { body: { priceId, metadata: { onboarding: true } } })`
    - [ ] 7.1.4.3 Set success_url to `${window.location.origin}/onboarding/welcome-premium`
    - [ ] 7.1.4.4 Set cancel_url to `${window.location.origin}/onboarding/step-4`
  - [ ] 7.1.5 On successful session creation, redirect to Stripe Checkout URL via `window.location.href = sessionUrl`
  - [ ] 7.1.6 Handle checkout errors: display error message, allow retry
  - [ ] 7.1.7 Add loading states to upgrade buttons while checkout session is being created
  - [ ] 7.1.8 Attach `handleUpgrade('weekly')` to weekly plan button onClick
  - [ ] 7.1.9 Attach `handleUpgrade('annual')` to annual plan button onClick
- [ ] 7.2 Implement route guards for onboarding flow:
  - [ ] 7.2.1 Create `src/lib/onboarding/guards.ts` utility file
  - [ ] 7.2.2 Write `checkStep2Access(): boolean` - verifies girl data exists in localStorage
  - [ ] 7.2.3 Write `checkStep3Access(): boolean` - verifies both girl data and data entry exist
  - [ ] 7.2.4 Write `checkStep4Access(user: User | null): boolean` - verifies user is authenticated
  - [ ] 7.2.5 Integrate guards into each step component:
    - [ ] 7.2.5.1 Step2AddData: add useEffect that calls checkStep2Access(), redirect to step-1 if false
    - [ ] 7.2.5.2 Step3EmailVerify: add useEffect that calls checkStep3Access(), redirect to step-1 if false
    - [ ] 7.2.5.3 Step4Results: already has user check, enhance to use guard function
  - [ ] 7.2.6 Add guard to prevent authenticated users from accessing Steps 1-3:
    - [ ] 7.2.6.1 Add useEffect to Step1, Step2, Step3 that checks if user exists
    - [ ] 7.2.6.2 If authenticated user detected, navigate to '/dashboard'
- [ ] 7.3 Update App.tsx to integrate React Router:
  - [ ] 7.3.1 Import routing components: `Routes`, `Route`, `Navigate` from react-router-dom
  - [ ] 7.3.2 Wrap existing app content in `<Routes>` component
  - [ ] 7.3.3 Create onboarding route group:
    - [ ] 7.3.3.1 Add route: `<Route path="/start" element={<StartPage />} />`
    - [ ] 7.3.3.2 Add nested route group with OnboardingLayout:
      ```tsx
      <Route path="/onboarding" element={<OnboardingLayout />}>
        <Route path="step-1" element={<Step1AddGirl />} />
        <Route path="step-2" element={<Step2AddData />} />
        <Route path="step-3" element={<Step3EmailVerify />} />
        <Route path="step-4" element={<Step4Results />} />
        <Route path="welcome-premium" element={<WelcomePremium />} />
        <Route path="welcome-free" element={<WelcomeFree />} />
      </Route>
      ```
  - [ ] 7.3.4 Keep existing app routing logic for authenticated views (dashboard, etc.)
  - [ ] 7.3.5 Add catch-all redirect: authenticated users to dashboard, unauthenticated to /start
  - [ ] 7.3.6 Test navigation between all routes to ensure no conflicts with existing app
- [ ] 7.4 Handle Stripe success webhook (verify existing webhook handles onboarding metadata):
  - [ ] 7.4.1 Check `supabase/functions/stripe-webhook/index.ts` for metadata handling
  - [ ] 7.4.2 Confirm webhook updates user subscription status correctly
  - [ ] 7.4.3 No code changes needed if existing webhook works (just verification)

### 8.0 Testing & Polish: Manual QA and Final Refinements
- [ ] 8.1 Test complete onboarding flow (happy path):
  - [ ] 8.1.1 Start at `/start` URL as unauthenticated user → should redirect to step-1
  - [ ] 8.1.2 Fill out Step 1 girl form → should save to localStorage and navigate to step-2
  - [ ] 8.1.3 Fill out Step 2 data entry → should save to localStorage and navigate to step-3
  - [ ] 8.1.4 Enter email and request OTP → verify email received (check spam folder)
  - [ ] 8.1.5 Enter 6-digit code → should authenticate and navigate to step-4
  - [ ] 8.1.6 Verify CPN calculations display correctly on step-4
  - [ ] 8.1.7 Click "Unlock Player Mode" weekly → should redirect to Stripe checkout
  - [ ] 8.1.8 Complete Stripe test payment → should redirect to welcome-premium page
  - [ ] 8.1.9 Click "Go to Dashboard" → should navigate to dashboard with girl and data visible
  - [ ] 8.1.10 Verify localStorage is cleared after successful sync
- [ ] 8.2 Test free tier flow:
  - [ ] 8.2.1 Complete steps 1-4 but click "Continue with Free Mode"
  - [ ] 8.2.2 Verify navigation to welcome-free page
  - [ ] 8.2.3 Verify dashboard shows girl and data correctly
  - [ ] 8.2.4 Verify user has free tier subscription (check profile)
- [ ] 8.3 Test back button navigation:
  - [ ] 8.3.1 On Step 2, click "Back" → should return to Step 1 with data preserved
  - [ ] 8.3.2 On Step 3 (email phase), click "Back" → should return to Step 2
  - [ ] 8.3.3 Verify browser back button doesn't break flow
  - [ ] 8.3.4 Verify Step 4 prevents back button navigation to earlier steps
- [ ] 8.4 Test route guards:
  - [ ] 8.4.1 Try accessing `/onboarding/step-2` directly without completing step-1 → should redirect to step-1
  - [ ] 8.4.2 Try accessing `/onboarding/step-3` without data entry → should redirect appropriately
  - [ ] 8.4.3 Try accessing `/onboarding/step-4` without authentication → should redirect to step-1
  - [ ] 8.4.4 As authenticated user, try accessing `/start` → should redirect to dashboard
  - [ ] 8.4.5 As authenticated user, try accessing `/onboarding/step-1` → should redirect to dashboard
- [ ] 8.5 Test error scenarios:
  - [ ] 8.5.1 Step 1: Submit form with age < 18 → should show validation error
  - [ ] 8.5.2 Step 1: Submit form without required name → should show error
  - [ ] 8.5.3 Step 2: Submit with negative amount → should show validation error
  - [ ] 8.5.4 Step 2: Submit with 0 duration → should show validation error
  - [ ] 8.5.5 Step 3: Enter invalid email format → should show error
  - [ ] 8.5.6 Step 3: Enter wrong verification code → should show "Invalid code" error
  - [ ] 8.5.7 Step 3: Wait for code to expire (10 min), then try to verify → should show "Code expired" message
  - [ ] 8.5.8 Step 4: Simulate network error during sync → should show retry button
  - [ ] 8.5.9 Step 4: Simulate Stripe checkout failure → should show error and allow retry
- [ ] 8.6 Test OTP functionality:
  - [ ] 8.6.1 Request OTP and verify email delivery time (should be < 30 seconds)
  - [ ] 8.6.2 Click "Resend Code" → verify cooldown timer works
  - [ ] 8.6.3 Try resending multiple times → verify rate limiting doesn't break flow
  - [ ] 8.6.4 Test with different email providers (Gmail, Outlook, etc.)
- [ ] 8.7 Test mobile responsiveness:
  - [ ] 8.7.1 Open onboarding flow on mobile Chrome (or dev tools mobile view)
  - [ ] 8.7.2 Verify all forms are readable and inputs are large enough to tap
  - [ ] 8.7.3 Verify Step 4 results display well on mobile (metrics stack vertically)
  - [ ] 8.7.4 Verify upgrade cards stack on mobile, remain side-by-side on desktop
  - [ ] 8.7.5 Test on actual mobile device if possible (iOS Safari, Android Chrome)
- [ ] 8.8 Test localStorage edge cases:
  - [ ] 8.8.1 Clear browser localStorage mid-flow → verify graceful degradation
  - [ ] 8.8.2 Close browser after Step 1, reopen and visit `/onboarding/step-2` → should have data preserved
  - [ ] 8.8.3 Test in incognito/private mode to ensure works without cookies
- [ ] 8.9 Test data sync edge cases:
  - [ ] 8.9.1 Disconnect internet before Step 4 loads → verify sync fails gracefully with retry option
  - [ ] 8.9.2 Manually trigger sync multiple times → verify no duplicate data created
  - [ ] 8.9.3 Check database to confirm girl and data_entry records created correctly
- [ ] 8.10 Polish and refinements:
  - [ ] 8.10.1 Run `npm run typecheck` to ensure no TypeScript errors
  - [ ] 8.10.2 Run `npm run lint` to catch any linting issues
  - [ ] 8.10.3 Review all pages for consistent styling with main app
  - [ ] 8.10.4 Add loading spinners to all async actions (OTP send, sync, checkout)
  - [ ] 8.10.5 Ensure all error messages are user-friendly (no technical jargon)
  - [ ] 8.10.6 Test with Stripe in test mode using test card numbers
  - [ ] 8.10.7 Verify no console errors in browser during entire flow
  - [ ] 8.10.8 Check that existing app functionality remains unaffected (spot-check dashboard, add girl, etc.)
  - [ ] 8.10.9 Review PRD one final time to ensure all functional requirements are met
  - [ ] 8.10.10 Document any deviations from PRD or known issues in comments

---

## Implementation Notes

### Recommended Implementation Order
Follow the task numbers sequentially. Each task builds upon the previous:
1. Start with infrastructure (Tasks 1-3) to establish foundation
2. Build UI pages (Task 4) once infrastructure is ready
3. Add welcome pages (Task 5) - quick wins
4. Implement sync logic (Task 6) to complete data flow
5. Wire up integrations (Task 7) to connect all pieces
6. Thoroughly test (Task 8) before considering complete

### Development Tips
- **Commit frequently**: After completing each major sub-task (e.g., 2.2, 4.2, etc.)
- **Test incrementally**: Don't wait until Task 8 to test - verify each page as you build it
- **Use browser DevTools**: Check localStorage in Application tab, monitor Network tab for API calls
- **Reference existing code**: Look at SignIn.tsx, AddGirlModal.tsx patterns for consistency
- **Mobile-first**: Build for mobile viewport first, then enhance for desktop

### Common Pitfalls to Avoid
- Don't skip route guards (Task 7.2) - they prevent broken flows
- Don't forget to clear localStorage after sync (Task 6.1.6)
- Ensure OTP email delivery works before building Step 3 UI
- Test Stripe in test mode extensively before switching to live keys
- Verify existing app still works after adding router (Task 7.3)

### Estimated Time per Task (for junior developer)
- Task 1: 1-2 hours
- Task 2: 6-8 hours
- Task 3: 2-3 hours
- Task 4: 12-16 hours (largest task)
- Task 5: 3-4 hours
- Task 6: 4-6 hours
- Task 7: 6-8 hours
- Task 8: 8-12 hours

**Total**: ~45-60 hours (roughly 1.5-2 weeks full-time)

---

**Status:** Ready for implementation. All sub-tasks defined.
