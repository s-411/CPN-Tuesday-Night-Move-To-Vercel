# Product Requirements Document: Onboarding Flow

## 1. Introduction/Overview

### Problem Statement
The CPN application currently requires users to sign up before experiencing the core value proposition. This creates friction in the conversion funnel, as users must commit to creating an account before understanding how the app works or seeing their first CPN calculation result.

### Solution
Implement a dedicated onboarding flow that allows users to experience the core functionality (adding a girl profile and calculating CPN) before authenticating. This "try before you buy" approach increases user investment and momentum, leading to higher conversion rates. The flow captures data first, then requests email verification, and finally presents upgrade options at the moment of peak interest.

### Goal
Create a seamless, conversion-optimized onboarding experience that:
- Demonstrates app value immediately
- Builds psychological investment through data entry
- Captures email authentication at the optimal moment
- Preserves entered data for authenticated users
- Does NOT interfere with existing app functionality

## 2. Goals

1. **Increase Conversion Rate**: Improve visitor-to-user conversion by allowing value demonstration before account creation
2. **Maintain Data Integrity**: Ensure all data entered during onboarding is properly associated with the user's account after authentication
3. **Zero Breaking Changes**: Implement as a completely separate flow that doesn't modify existing app functionality
4. **Mobile-First Experience**: Optimize for mobile users (expected primary traffic source from TikTok)
5. **Seamless Stripe Integration**: Connect upgrade flow to existing Stripe checkout without changes to payment infrastructure

## 3. User Stories

### Primary User Journey
**As a** first-time visitor from TikTok
**I want to** immediately start calculating my cost per nut without creating an account
**So that** I can understand the app's value before committing my email address

### Detailed User Flow
1. **As a** visitor, **I want to** land on a clean, simple page where I can immediately add a girl's profile, **so that** I can start using the app without friction
2. **As a** visitor, **I want to** add data entry information (spending, time, nuts) for that girl, **so that** I can see my CPN calculation
3. **As a** visitor, **I want to** verify my email address with a 6-digit code, **so that** I can see my results and save my data
4. **As a** visitor, **I want to** see my calculated CPN results immediately after verification, **so that** I feel the payoff of my time investment
5. **As a** visitor, **I want to** have the option to upgrade to Player Mode at my moment of peak interest, **so that** I can unlock unlimited tracking
6. **As a** user who upgrades, **I want to** see my onboarding data already in my dashboard, **so that** I don't have to re-enter information
7. **As a** user who doesn't upgrade, **I want to** still access the free tier of the app with my data preserved, **so that** I can continue using the app

### Edge Cases
- **As a** user who abandons onboarding mid-flow, **I want to** return later and resume where I left off (within session), **so that** I don't lose my progress
- **As an** authenticated user, **I want to** be redirected to the dashboard if I try to access onboarding, **so that** I don't create duplicate data
- **As a** user who fails email verification, **I want to** be able to retry or request a new code, **so that** I can complete the process

## 4. Functional Requirements

### FR-1: Entry Point & Routing
- **FR-1.1**: Create a `/start` route that serves as the marketing entry point
- **FR-1.2**: `/start` redirects unauthenticated users to `/onboarding/step-1`
- **FR-1.3**: `/start` redirects authenticated users to `/dashboard`
- **FR-1.4**: Implement React Router for onboarding flow routes:
  - `/onboarding/step-1` - Add Girl form
  - `/onboarding/step-2` - Add Data Entry form
  - `/onboarding/step-3` - Email Verification
  - `/onboarding/step-4` - Results & Upgrade Options
  - `/onboarding/welcome-premium` - Post-purchase welcome
  - `/onboarding/welcome-free` - Free tier welcome
- **FR-1.5**: All authenticated users attempting to access any `/onboarding/*` route (except welcome pages) should be redirected to `/dashboard`

### FR-2: Step 1 - Add Girl Profile
- **FR-2.1**: Display a clean, single-column mobile-optimized form containing all fields from existing `AddGirlModal`:
  - Name (required)
  - Age (required, min 18)
  - Hotness Rating (required, 5.0-10.0 scale using RatingTileSelector component)
  - Ethnicity (optional dropdown)
  - Hair Color (optional dropdown)
  - City (optional text)
  - Country (optional text)
- **FR-2.2**: Use the same validation rules as the existing add girl functionality
- **FR-2.3**: Store form data in browser localStorage under key `onboarding_girl_data`
- **FR-2.4**: Button text: "Add Data" (instead of "Add Girl")
- **FR-2.5**: On successful form submission, navigate to `/onboarding/step-2`
- **FR-2.6**: No authentication required for this step
- **FR-2.7**: If localStorage already contains girl data, pre-populate the form

### FR-3: Step 2 - Add Data Entry
- **FR-3.1**: Display the girl's name from Step 1 at the top of the page (e.g., "Add Data for Sarah")
- **FR-3.2**: Display a clean form containing core data entry fields:
  - Date (default to today, optional in onboarding)
  - Amount Spent (required, numeric, min 0)
  - Duration - Hours (required, numeric, min 0)
  - Duration - Minutes (optional, numeric, 0-59)
  - Number of Nuts (required, numeric, min 0)
- **FR-3.3**: Store form data in browser localStorage under key `onboarding_data_entry`
- **FR-3.4**: Button text: "Calculate CPN"
- **FR-3.5**: On successful form submission, navigate to `/onboarding/step-3`
- **FR-3.6**: Include a "Back" button that returns to Step 1 without losing data
- **FR-3.7**: No authentication required for this step
- **FR-3.8**: If localStorage already contains data entry, pre-populate the form

### FR-4: Step 3 - Email Verification
- **FR-4.1**: Display clear messaging explaining why email is needed (to see results and save data)
- **FR-4.2**: Present an email input field
- **FR-4.3**: On email submission, use Supabase `signInWithOtp()` to send a 6-digit verification code
- **FR-4.4**: Display a 6-digit code input field (can be a single input or 6 separate inputs)
- **FR-4.5**: On code submission, use Supabase `verifyOtp()` to authenticate the user
- **FR-4.6**: Store email in localStorage under key `onboarding_email` before sending OTP
- **FR-4.7**: Handle verification errors gracefully with clear error messages:
  - "Invalid code. Please try again."
  - "Code expired. Request a new code."
  - "Too many attempts. Please try again later."
- **FR-4.8**: Include a "Resend Code" button (with cooldown timer, e.g., 30 seconds)
- **FR-4.9**: On successful verification:
  - Set `onboarding_verified` flag in localStorage
  - Navigate to `/onboarding/step-4`
- **FR-4.10**: Include a "Back" button that returns to Step 2 without losing data
- **FR-4.11**: Do NOT create a password for the user (passwordless authentication only for onboarding)

### FR-5: Step 4 - Results & Upgrade
- **FR-5.1**: Calculate and display CPN metrics using existing calculation functions:
  - Cost Per Nut (primary metric, large display)
  - Time Per Nut
  - Cost Per Hour
- **FR-5.2**: Display the metrics in a visually appealing card/stat format
- **FR-5.3**: Show the girl's name and basic info from Step 1
- **FR-5.4**: Display upgrade options as prominent call-to-action cards:
  - Player Mode Weekly ($1.99/week)
  - Player Mode Annual ($27/year - Save 74%)
- **FR-5.5**: Use existing Stripe price IDs from `STRIPE_CONFIG`
- **FR-5.6**: Wording: "Unlock Player Mode" or "Activate Player Mode" (not "Upgrade")
- **FR-5.7**: Include a "Continue with Free Mode" option (smaller, secondary styling)
- **FR-5.8**: On upgrade button click:
  - Trigger existing Stripe checkout flow
  - Pass `onboarding=true` flag in metadata
  - Set `redirect_success_url` to `/onboarding/welcome-premium`
- **FR-5.9**: On "Continue with Free Mode" click:
  - Navigate to `/onboarding/welcome-free`
- **FR-5.10**: Do NOT allow user to proceed without choosing an option or going back

### FR-6: Data Persistence & Synchronization
- **FR-6.1**: After successful email verification (Step 3), trigger data sync process
- **FR-6.2**: Data sync should:
  - Read `onboarding_girl_data` from localStorage
  - Read `onboarding_data_entry` from localStorage
  - Insert girl record into `girls` table with `user_id = auth.uid()`
  - Insert data entry record into `data_entries` table with `girl_id` from previous insert
  - Set `onboarding_completed_at` timestamp in `users` table
- **FR-6.3**: Data sync should occur in the background on Step 4 page load
- **FR-6.4**: Handle sync errors gracefully:
  - Retry logic (3 attempts with exponential backoff)
  - If sync fails after retries, store error state but allow user to proceed
  - Display notification: "We're still syncing your data. Please check your dashboard in a moment."
- **FR-6.5**: After successful sync, clear localStorage keys:
  - `onboarding_girl_data`
  - `onboarding_data_entry`
  - `onboarding_email`
  - `onboarding_verified`
- **FR-6.6**: If user navigates away and returns, check if data is already synced (via database query) before attempting re-sync

### FR-7: Welcome Premium Page
- **FR-7.1**: Display congratulatory messaging for upgrading to Player Mode
- **FR-7.2**: Briefly highlight key Player Mode features:
  - Unlimited profiles
  - Full analytics
  - Leaderboards
  - Share features
- **FR-7.3**: Show a prominent "Go to Dashboard" button
- **FR-7.4**: On button click, navigate to `/dashboard`
- **FR-7.5**: Dashboard should show the girl and data entry from onboarding
- **FR-7.6**: Verify that subscription status is properly synced (existing Stripe webhook handles this)

### FR-8: Welcome Free Page
- **FR-8.1**: Display welcoming messaging for free tier users
- **FR-8.2**: Briefly explain free tier limitations:
  - Track 1 active profile
  - Basic data entry
  - Limited analytics
- **FR-8.3**: Include a subtle "Upgrade anytime" message (not pushy)
- **FR-8.4**: Show a prominent "Go to Dashboard" button
- **FR-8.5**: On button click, navigate to `/dashboard`
- **FR-8.6**: Dashboard should show the girl and data entry from onboarding

### FR-9: Navigation & Progress Indication
- **FR-9.1**: Display step progress indicator on Steps 1-4 (e.g., "Step 1 of 4")
- **FR-9.2**: Prevent users from skipping ahead via URL manipulation:
  - Step 2 requires localStorage key `onboarding_girl_data`
  - Step 3 requires localStorage key `onboarding_data_entry`
  - Step 4 requires authentication (`user !== null`)
- **FR-9.3**: If user tries to access a step without prerequisites, redirect to appropriate earlier step
- **FR-9.4**: Do not allow browser back button to navigate from Step 4 to earlier steps (use `window.history.replaceState`)

### FR-10: Mobile Optimization
- **FR-10.1**: All forms must be mobile-first, single-column layout
- **FR-10.2**: Form inputs should be large enough for mobile touch (min 44px height)
- **FR-10.3**: Use mobile-optimized number keyboards for numeric inputs
- **FR-10.4**: Ensure verification code input works well on mobile (consider autofill from SMS)
- **FR-10.5**: Optimize button sizes and spacing for thumb-friendly interaction
- **FR-10.6**: Test on viewport sizes down to 320px width

### FR-11: Error Handling & Validation
- **FR-11.1**: All form validation errors must be displayed inline and clearly
- **FR-11.2**: Network errors should be caught and displayed with retry options
- **FR-11.3**: If user closes browser during onboarding:
  - Data persists in localStorage for 24 hours
  - User can resume from where they left off
- **FR-11.4**: If localStorage is full or unavailable:
  - Display clear error message
  - Suggest clearing browser data or using a different browser
  - Provide fallback to traditional sign-up flow
- **FR-11.5**: If OTP system is down or experiencing issues:
  - Display apologetic error message
  - Provide alternative: "Sign up with password" link to existing sign-up page

## 5. Non-Goals (Out of Scope)

### What This Feature Will NOT Include:
1. **Multi-girl onboarding**: Users can only add ONE girl during onboarding (they can add more after upgrading)
2. **Social login**: No Google/Apple/Facebook sign-in during onboarding (email OTP only)
3. **Onboarding for existing users**: Existing authenticated users cannot re-enter the onboarding flow
4. **Profile customization**: Users cannot customize their profile (avatar, display name) during onboarding
5. **Data editing during onboarding**: Once data is entered in a step, users can return via back button but cannot edit without restarting
6. **Analytics preview**: Step 4 only shows basic CPN metrics, not full analytics suite
7. **Leaderboard integration**: No leaderboard data during onboarding flow
8. **Email preferences**: Users cannot customize email notification settings during onboarding
9. **Password recovery**: Since onboarding is passwordless, no password reset flow needed
10. **Account deletion**: No account deletion option during onboarding
11. **Multi-language support**: English only for v1
12. **A/B testing infrastructure**: Onboarding will have a single flow (no variants) for v1

## 6. Design Considerations

### UI/UX Requirements

#### Visual Design
- **Consistency**: Reuse existing design system, color scheme, and components from the main app
- **Key Colors** (from existing codebase):
  - Primary: Yellow (`#FCD34D` / `cpn-yellow`)
  - Background: Dark (`#0A0A0A` / `cpn-dark`)
  - Text: White for primary, gray for secondary
- **Typography**: Match existing app typography (likely system fonts)
- **Spacing**: Generous whitespace, mobile-friendly padding

#### Component Reuse
- **RatingTileSelector**: Use existing component from `src/components/RatingTileSelector.tsx`
- **Modal.tsx**: Do NOT use modal component (onboarding uses full-page layouts)
- **Form Styling**: Use existing CSS classes:
  - `input-cpn` for text inputs
  - `select-cpn` for dropdowns
  - `btn-cpn` for primary buttons
  - `btn-secondary` for secondary buttons
- **Card Styling**: Use `card-cpn` class for card containers

#### Step-Specific Design Notes

**Step 1 & 2: Forms**
- Clean, minimal design with clear labels
- Required fields marked with asterisk (*)
- Error messages appear below fields in red
- Progress indicator at top
- Large "Continue" button at bottom

**Step 3: Email Verification**
- Center-aligned layout
- Clear explanation of why email is needed
- Large, easy-to-tap code input fields
- Visual feedback on code entry (each digit fills in)
- Resend button with countdown timer display

**Step 4: Results**
- Bold, eye-catching CPN display (large font)
- Secondary metrics below in smaller cards
- Upgrade options as visually distinct cards (use gradient or border)
- Annual option should have "Best Value" badge
- Free option should be less prominent but still accessible

**Welcome Pages**
- Celebratory/welcoming hero section
- Brief feature list with icons
- Large, prominent CTA button

### Responsive Breakpoints
- Mobile: 320px - 640px (primary target)
- Tablet: 641px - 1024px
- Desktop: 1025px+ (nice-to-have)

### Animations & Interactions
- Smooth transitions between steps (fade in/out or slide)
- Button hover states (existing app styling)
- Loading states with spinners for async actions
- Success/error toast notifications (use existing Toast component if available)

### Accessibility
- Semantic HTML (proper heading hierarchy)
- ARIA labels for form fields
- Keyboard navigation support
- Focus states on all interactive elements
- Color contrast ratios meeting WCAG AA standards

## 7. Technical Considerations

### Technology Stack
- **Frontend**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **Routing**: React Router v6 (NEW - needs to be installed)
- **Styling**: Tailwind CSS (existing)
- **Backend**: Supabase (existing)
- **Authentication**: Supabase Auth with OTP
- **Payments**: Stripe (existing integration)
- **State Management**: React useState/useContext (no Redux needed)

### Dependencies to Install
```json
{
  "react-router-dom": "^6.20.0"
}
```

### File Structure
```
src/
├── pages/
│   └── onboarding/
│       ├── OnboardingLayout.tsx       # Shared layout for all steps
│       ├── Step1AddGirl.tsx           # Step 1 page component
│       ├── Step2AddData.tsx           # Step 2 page component
│       ├── Step3EmailVerify.tsx       # Step 3 page component
│       ├── Step4Results.tsx           # Step 4 page component
│       ├── WelcomePremium.tsx         # Post-purchase welcome
│       ├── WelcomeFree.tsx            # Free tier welcome
│       └── StartPage.tsx              # Landing page (/start)
├── hooks/
│   └── useOnboardingData.ts           # Custom hook for localStorage management
├── lib/
│   └── onboarding/
│       ├── storage.ts                 # localStorage utility functions
│       ├── sync.ts                    # Data sync logic
│       └── validation.ts              # Onboarding-specific validation
└── App.tsx                             # Updated to include router
```

### Routing Implementation
```typescript
// Pseudo-code structure for App.tsx routing
<BrowserRouter>
  <Routes>
    {/* Onboarding Routes */}
    <Route path="/start" element={<StartPage />} />
    <Route path="/onboarding" element={<OnboardingLayout />}>
      <Route path="step-1" element={<Step1AddGirl />} />
      <Route path="step-2" element={<Step2AddData />} />
      <Route path="step-3" element={<Step3EmailVerify />} />
      <Route path="step-4" element={<Step4Results />} />
      <Route path="welcome-premium" element={<WelcomePremium />} />
      <Route path="welcome-free" element={<WelcomeFree />} />
    </Route>

    {/* Existing App Routes */}
    <Route path="/" element={<AuthWrapper />}>
      <Route path="dashboard" element={<Dashboard />} />
      {/* ... other existing routes */}
    </Route>
  </Routes>
</BrowserRouter>
```

### Authentication Flow
1. **Step 3**: User enters email → `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`
2. Supabase sends 6-digit code to email
3. User enters code → `supabase.auth.verifyOtp({ email, token, type: 'email' })`
4. On success, Supabase creates user session
5. Existing `handle_new_user()` trigger automatically creates user profile in `users` table
6. Session persists in Supabase (localStorage)

### Data Sync Implementation
```typescript
// Pseudo-code for data sync on Step 4
async function syncOnboardingData(userId: string) {
  const girlData = JSON.parse(localStorage.getItem('onboarding_girl_data'));
  const entryData = JSON.parse(localStorage.getItem('onboarding_data_entry'));

  // Insert girl
  const { data: girl, error: girlError } = await supabase
    .from('girls')
    .insert({ ...girlData, user_id: userId })
    .select()
    .single();

  if (girlError) throw girlError;

  // Insert data entry
  const { error: entryError } = await supabase
    .from('data_entries')
    .insert({ ...entryData, girl_id: girl.id });

  if (entryError) throw entryError;

  // Mark onboarding complete
  await supabase
    .from('users')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', userId);

  // Clear localStorage
  localStorage.removeItem('onboarding_girl_data');
  localStorage.removeItem('onboarding_data_entry');
  localStorage.removeItem('onboarding_email');
  localStorage.removeItem('onboarding_verified');
}
```

### LocalStorage Schema
```typescript
// Type definitions for localStorage
interface OnboardingGirlData {
  name: string;
  age: number;
  ethnicity?: string;
  hair_color?: string;
  location_city?: string;
  location_country?: string;
  rating: number;
}

interface OnboardingDataEntry {
  date: string; // ISO date string
  amount_spent: number;
  duration_minutes: number;
  number_of_nuts: number;
}

// Keys
const STORAGE_KEYS = {
  GIRL_DATA: 'onboarding_girl_data',
  DATA_ENTRY: 'onboarding_data_entry',
  EMAIL: 'onboarding_email',
  VERIFIED: 'onboarding_verified'
};
```

### Database Requirements
- **No schema changes required** - All existing tables support the onboarding flow
- **Required tables** (already exist):
  - `users` - User profile created automatically by trigger
  - `girls` - For storing girl profiles
  - `data_entries` - For storing data entries
- **Subscription tier enforcement** - Existing trigger `check_profile_limit()` ensures free users are limited to 1 active profile

### Stripe Integration
- **Use existing setup**: No changes to Stripe configuration needed
- **Checkout session creation**: Use existing Supabase Edge Function `stripe-checkout`
- **Metadata**: Pass `{ onboarding: true }` in checkout session metadata
- **Webhook**: Existing `stripe-webhook` function handles subscription creation
- **Success URL**: Set to `/onboarding/welcome-premium` instead of default success page
- **Cancel URL**: Set to `/onboarding/step-4` (return to results page)

### Security Considerations
1. **Row Level Security (RLS)**: Existing policies already enforce user data isolation
2. **OTP Rate Limiting**: Supabase has built-in rate limiting for OTP requests
3. **localStorage Security**:
   - Data is not sensitive (no PII beyond email)
   - Clear localStorage after successful sync
   - Set 24-hour expiration on data
4. **Route Protection**: Implement guards to prevent skipping steps
5. **CSRF Protection**: Supabase handles CSRF automatically
6. **Input Validation**: Validate all inputs on both client and server (RLS + constraints)

### Performance Considerations
1. **Code Splitting**: Lazy load onboarding routes to reduce main bundle size
2. **Image Optimization**: Minimize image assets on onboarding pages
3. **Analytics**: Consider lightweight analytics (e.g., PostHog, Mixpanel) to track funnel drop-off
4. **Lighthouse Score**: Target 90+ on mobile for onboarding pages

### Error Recovery
1. **Network Errors**: Implement retry logic with exponential backoff
2. **Sync Failures**: Store sync error state, allow user to manually retry from dashboard
3. **Partial Data**: If only girl syncs but entry fails, don't show entry in UI (or show with error badge)
4. **OTP Failures**: Provide clear error messages and resend option

### Testing Requirements
1. **Unit Tests**: Test validation functions, localStorage utilities, calculations
2. **Integration Tests**: Test OTP flow, data sync process, Stripe checkout
3. **E2E Tests**: Test complete onboarding flow from Step 1 to Dashboard
4. **Mobile Testing**: Test on real devices (iOS Safari, Android Chrome)
5. **Edge Cases**: Test localStorage full, network offline, OTP expired, etc.

### Backwards Compatibility
- **Existing Users**: Not affected - they use existing auth flow
- **Existing Routes**: No changes to existing routes
- **Existing Components**: Reused but not modified
- **Database**: No breaking schema changes

## 8. Success Metrics

### Primary Metrics
1. **Conversion Rate**: % of visitors who complete email verification (Step 3)
   - **Target**: 40%+ (vs. ~15-20% for traditional sign-up)
   - **Measurement**: Track Step 1 loads vs. Step 3 completions

2. **Upgrade Rate**: % of verified users who purchase Player Mode
   - **Target**: 15%+ from Step 4
   - **Measurement**: Track Step 4 loads vs. Stripe checkout completions

3. **Data Sync Success Rate**: % of verified users whose data syncs successfully
   - **Target**: 99%+
   - **Measurement**: Track sync attempts vs. successful syncs

### Secondary Metrics
4. **Time to Complete Onboarding**: Average time from Step 1 to Step 4 completion
   - **Target**: < 3 minutes median
   - **Measurement**: Track timestamps between step loads

5. **Step Drop-off Rate**: % of users who abandon at each step
   - **Target**:
     - Step 1→2: < 30% drop-off
     - Step 2→3: < 40% drop-off
     - Step 3→4: < 10% drop-off (post-verification)
   - **Measurement**: Track page loads per step

6. **Mobile vs. Desktop Completion**: Completion rate comparison
   - **Target**: Mobile completion rate within 10% of desktop
   - **Measurement**: Track device type + completion status

7. **OTP Success Rate**: % of OTP requests that result in successful verification
   - **Target**: 85%+ (accounting for user error, expired codes)
   - **Measurement**: Track OTP sends vs. successful verifications

### Leading Indicators
8. **Form Completion Time**: Time spent on Steps 1 & 2
   - **Insight**: If too short, users may be entering fake data
   - **Target**: 30+ seconds per form (indicates thoughtful entry)

9. **Resend Code Usage**: % of users who request OTP resend
   - **Insight**: High rate indicates code delivery issues
   - **Target**: < 20% of users need resend

10. **Return Visitor Rate**: % of users who start but don't finish, then return
    - **Insight**: localStorage persistence is working
    - **Target**: 10%+ of incomplete sessions return

### Business Metrics
11. **Revenue from Onboarding Upgrades**: Total revenue from users who upgrade during onboarding
    - **Target**: 20%+ of total subscription revenue within 3 months

12. **LTV of Onboarding Users**: Lifetime value comparison between onboarding users vs. traditional sign-up users
    - **Target**: Onboarding users have equal or higher LTV
    - **Measurement**: Track retention + subscription renewals by acquisition source

13. **Customer Acquisition Cost (CAC)**: Cost per acquired user via onboarding flow
    - **Target**: < $10 per user (assuming TikTok ad traffic)
    - **Measurement**: Ad spend / completed onboardings

### Tracking Implementation
- **Analytics Tool**: Implement PostHog, Mixpanel, or Amplitude (lightweight, privacy-focused)
- **Event Tracking**:
  ```typescript
  // Example events to track
  track('onboarding_started', { source: 'tiktok' });
  track('onboarding_step_completed', { step: 1, duration_seconds: 45 });
  track('onboarding_step_abandoned', { step: 2, duration_seconds: 12 });
  track('onboarding_email_submitted', { email_domain: 'gmail.com' });
  track('onboarding_otp_verified', { attempts: 1 });
  track('onboarding_upgrade_clicked', { plan: 'annual' });
  track('onboarding_completed', { upgraded: true, total_duration_seconds: 180 });
  ```

## 9. Open Questions

### Technical Decisions Needed
1. **React Router Version**: Should we use React Router v6 or v7 (just released)?
   - **Recommendation**: v6 (stable, well-documented)

2. **localStorage Fallback**: What happens if browser doesn't support localStorage?
   - **Proposed Solution**: Display error message + redirect to traditional sign-up
   - **Need to decide**: Build fallback flow or just block users with old browsers?

3. **OTP Code Format**: Single input or 6 separate digit inputs?
   - **User preference needed**: Which provides better UX?
   - **Recommendation**: 6 separate inputs (better visual feedback, easier mobile entry)

4. **Analytics Tool**: Which analytics platform should we use?
   - **Options**: PostHog (self-hosted option), Mixpanel, Amplitude
   - **Recommendation**: PostHog (privacy-friendly, affordable)

5. **Code Splitting Strategy**: Should onboarding be a separate bundle?
   - **Recommendation**: Yes - lazy load entire onboarding flow to keep main bundle small

### Business Decisions Needed
6. **Free Trial vs. Freemium**: Should Step 4 offer a free trial of Player Mode?
   - **Current**: User sees results, can choose to upgrade or use free tier
   - **Alternative**: Offer 7-day free trial of Player Mode (requires Stripe configuration)
   - **Need stakeholder decision**

7. **Onboarding Incentive**: Should we offer a discount for users who upgrade during onboarding?
   - **Example**: "Activate Player Mode now and get 20% off"
   - **Pros**: Higher conversion
   - **Cons**: Sets expectation of discounts, reduces revenue per user
   - **Need stakeholder decision**

8. **Remarketing Strategy**: How do we re-engage users who verify email but don't upgrade?
   - **Email drip campaign?**
   - **Retargeting ads?**
   - **In-app prompts?**
   - **Need marketing strategy input**

### UX/Design Questions
9. **Progress Indicator Style**: Linear progress bar vs. step dots vs. "Step X of 4" text?
   - **Recommendation**: Step dots + text (clear and familiar)

10. **CTA Copy Testing**: Should we A/B test different button copy?
    - **Examples**:
      - "Unlock Player Mode" vs. "Upgrade Now"
      - "Continue with Free Mode" vs. "Skip for Now"
    - **Recommendation**: Start with chosen copy, A/B test after 2 weeks

11. **Social Proof**: Should Step 4 show testimonials or user count?
    - **Example**: "Join 10,000+ guys tracking their CPN"
    - **Pros**: Builds trust, increases conversion
    - **Cons**: Requires real data, may look spammy
    - **Need marketing input**

### Future Enhancements (Not v1)
12. **Multi-step Onboarding Data**: Should we allow users to add multiple girls during onboarding?
    - **Current**: Single girl only
    - **Future**: Maybe allow 2-3 girls to demonstrate fuller app value?

13. **Onboarding Personalization**: Should we ask user intent/goals in Step 1?
    - **Example**: "Why are you tracking CPN?" (Budgeting / Self-awareness / Comparison)
    - **Benefit**: Personalized messaging, better targeting
    - **Drawback**: Adds friction

14. **Gamification**: Should we add achievement/milestone messaging during onboarding?
    - **Example**: "You've entered your first CPN calculation! 🎉"
    - **Benefit**: Dopamine hits, increased engagement
    - **Drawback**: May feel cheesy or overused

---

## Appendix: Comparison to Existing Flows

### Current User Flow (Traditional Sign-Up)
1. Visitor lands on landing page
2. Click "Sign Up"
3. Enter email + password
4. Verify email via link
5. Log in
6. See empty dashboard
7. Manually add girl
8. Manually add data entry
9. See CPN results

**Problems**:
- High friction upfront (account creation before value)
- Empty dashboard is demotivating
- No natural upgrade prompt moment

### New Onboarding Flow
1. Visitor lands on `/start`
2. Immediately add girl data (no account needed)
3. Immediately add data entry
4. Quick email verification (passwordless)
5. See CPN results + upgrade option
6. Dashboard pre-populated with data

**Benefits**:
- Value demonstrated before commitment
- Psychological investment increases conversion
- Natural upgrade moment at peak interest
- Faster time to "aha moment"

---

## Implementation Checklist

### Phase 1: Setup & Core Routing
- [ ] Install React Router v6
- [ ] Create onboarding page folder structure
- [ ] Set up basic routing in App.tsx
- [ ] Create OnboardingLayout component
- [ ] Implement StartPage with redirect logic
- [ ] Test authenticated user redirect

### Phase 2: Steps 1 & 2 (Data Collection)
- [ ] Create Step1AddGirl page component
- [ ] Implement form with validation
- [ ] Create localStorage utility functions
- [ ] Create useOnboardingData custom hook
- [ ] Implement Step 1 → Step 2 navigation
- [ ] Create Step2AddData page component
- [ ] Implement data entry form
- [ ] Add back button functionality
- [ ] Test localStorage persistence across steps

### Phase 3: Step 3 (Email Verification)
- [ ] Create Step3EmailVerify page component
- [ ] Implement email input UI
- [ ] Integrate Supabase signInWithOtp
- [ ] Create 6-digit code input UI
- [ ] Integrate Supabase verifyOtp
- [ ] Implement resend code functionality with cooldown
- [ ] Add error handling for OTP failures
- [ ] Test OTP flow end-to-end

### Phase 4: Step 4 (Results & Upgrade)
- [ ] Create Step4Results page component
- [ ] Implement CPN calculation display
- [ ] Design upgrade option cards
- [ ] Integrate Stripe checkout for weekly plan
- [ ] Integrate Stripe checkout for annual plan
- [ ] Implement "Continue with Free Mode" flow
- [ ] Test Stripe test mode checkout
- [ ] Implement data sync on page load
- [ ] Add sync error handling and retry logic

### Phase 5: Welcome Pages
- [ ] Create WelcomePremium page component
- [ ] Create WelcomeFree page component
- [ ] Implement navigation to dashboard
- [ ] Test data appears correctly on dashboard
- [ ] Verify subscription status sync

### Phase 6: Polish & Edge Cases
- [ ] Add progress indicators to all steps
- [ ] Implement route guards (prevent skipping steps)
- [ ] Add loading states for async operations
- [ ] Implement mobile optimizations
- [ ] Add error boundaries
- [ ] Test localStorage full scenario
- [ ] Test network offline scenario
- [ ] Test browser refresh on each step
- [ ] Add accessibility improvements (ARIA labels, focus management)

### Phase 7: Testing & QA
- [ ] Manual testing on Chrome mobile
- [ ] Manual testing on Safari mobile
- [ ] Manual testing on desktop browsers
- [ ] Test complete flow with real Stripe test mode
- [ ] Test OTP with real email delivery
- [ ] Test data sync success and failure cases
- [ ] Verify existing app functionality unaffected
- [ ] Run Lighthouse audit on onboarding pages

### Phase 8: Analytics & Launch Prep
- [ ] Install analytics tool (PostHog/Mixpanel)
- [ ] Implement event tracking
- [ ] Set up conversion funnels
- [ ] Create analytics dashboard
- [ ] Document onboarding flow for team
- [ ] Prepare launch announcement (if applicable)
- [ ] Switch Stripe to live mode (when ready for production)

---

## Estimated Development Timeline

**Total Estimated Time**: 3-4 weeks for a solo junior developer

- **Phase 1**: 2-3 days (routing setup)
- **Phase 2**: 4-5 days (forms + localStorage)
- **Phase 3**: 3-4 days (OTP integration + testing)
- **Phase 4**: 4-5 days (results + Stripe + data sync)
- **Phase 5**: 2 days (welcome pages)
- **Phase 6**: 3-4 days (polish + edge cases)
- **Phase 7**: 3-4 days (testing + QA)
- **Phase 8**: 1-2 days (analytics setup)

**Buffer**: 20% for unexpected issues

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | AI Assistant | Initial PRD creation based on stakeholder interview |

---

**Document Status**: ✅ Ready for Development

**Approved By**: [Awaiting Approval]

**Target Launch Date**: [TBD]
