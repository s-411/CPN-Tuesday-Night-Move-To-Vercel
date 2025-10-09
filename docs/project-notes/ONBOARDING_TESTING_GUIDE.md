# Onboarding Flow Testing Guide

## Quick Start Testing

### 1. Prerequisites
```bash
# Ensure dev server is running
npm run dev

# Or if using different command
# yarn dev / pnpm dev
```

### 2. Test the Happy Path (5 minutes)

#### Step 1: Navigate to Onboarding
1. Open browser to `http://localhost:5173/step-1` (or your dev URL)
2. You should see:
   - "CPN" logo at top
   - "Step 1 of 4" subtitle
   - "Add Girl" heading
   - Girl profile form with rating selector

#### Step 2: Fill Step 1
1. Enter girl information:
   - Name: "Test Girl" (required)
   - Age: 25 (required, must be 18+)
   - Rating: Click a rating tile (5.0-10.0)
   - Optional fields: ethnicity, hair color, location
2. Click "Continue"
3. You should see:
   - ✅ Green success message "Saved! Moving to next step..."
   - Button changes to "Redirecting..."
   - Auto-redirect to `/step-2` after ~800ms

#### Step 3: Fill Step 2
1. You should see:
   - "Step 2 of 4"
   - "Add Data" heading
   - Data entry form with preview
2. Enter data:
   - Date: Use date picker (defaults to today)
   - Amount Spent: $50 (required)
   - Hours: 2
   - Minutes: 30 (optional)
   - Number of Nuts: 3 (required)
3. Notice:
   - Live CPN preview appears below form
   - Shows Cost/Nut, Time/Nut, Cost/Hour
4. Click "Continue"
5. You should see:
   - ✅ Green success message
   - Auto-redirect to `/step-3` after ~800ms

#### Step 4: Create Account (Step 3)
1. You should see:
   - "Step 3 of 4"
   - "Create Your Account" heading
   - Three input fields
2. Enter account info:
   - Name: "Your Name" (new field!)
   - Email: Use a test email (e.g., `test+$(date +%s)@example.com`)
   - Password: Min 6 characters
3. Click "Create Account"
4. You should see:
   - Button text changes to "Creating Account..."
   - ✅ "Account created! Loading your results..." message
   - Auto-redirect to `/step-4` after ~800ms

#### Step 5: View Results & Choose Plan (Step 4)
1. You should see:
   - "Step 4 of 4"
   - "Your CPN Result" heading with girl's name
   - Three large metric boxes (Cost/Nut emphasized in yellow)
   - ✅ Green "Saved to your account!" message
   - Three subscription cards below

2. Subscription cards should show:
   - **Left**: Boyfriend Mode (Free) - gray border
   - **Center**: Player Mode Weekly ($1.99/week) - yellow border, "RECOMMENDED" badge
   - **Right**: Player Mode Annual ($27/year) - "Save 74%" badge

#### Step 6: Test Free Flow
1. Click "Keep Free" button
2. You should:
   - Be redirected to `/` (main app dashboard)
   - See the girl you just added in your profile list
   - See the data entry you added

### 3. Test Payment Flow (Stripe Test Mode)

#### Prerequisites
- Ensure Stripe is in test mode
- Have test card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

#### Steps
1. Navigate back to `/step-4` (or redo onboarding with new email)
2. Click "Activate Weekly" or "Activate Annual"
3. You should:
   - Be redirected to Stripe Checkout page
   - See correct plan name and price
4. Fill in Stripe test card info
5. Click "Subscribe"
6. You should:
   - Be redirected to `/welcome-premium`
   - See congratulations message
   - See "Welcome to Player Mode!" heading
   - See "What's Next?" guidance
7. Click "Get Started"
8. You should:
   - Be redirected to `/` (main app)
   - Have Player Mode activated
   - See all premium features unlocked

---

## 4. Test Error Scenarios

### Step 1 Validation
- Try age < 18 → Should show error "Age must be 18 or older"
- Try empty name → Should show required field error
- Form should NOT redirect on validation errors

### Step 2 Validation
- Try 0 hours and 0 minutes → Should show "Duration must be greater than 0"
- Try negative amount → Should show error
- Form should NOT redirect on validation errors

### Step 3 Validation
- Try empty name → Should show "Please enter your name"
- Try short password (< 6 chars) → Should show "Password must be at least 6 characters"
- Try invalid email format → Should show validation error
- Try existing email with wrong password → Should show "Authentication failed"

### Step 4 Error Recovery
1. If you see red error message "Failed to save data"
2. Click "Retry Save" button
3. Should attempt to save again
4. Check if data appears in database

---

## 5. Test Data Persistence

### SessionStorage Persistence
1. Fill Step 1 completely
2. Open browser DevTools → Application → Session Storage
3. Find key `onboarding.step1` → Should contain your form data
4. Refresh page (F5)
5. Form should still have your data filled in
6. Click Continue to Step 2
7. Fill Step 2
8. Check `onboarding.step2` in SessionStorage
9. Navigate back to Step 1 using back button
10. Data should still be there

### Database Persistence
1. Complete entire flow (all 4 steps)
2. Open Supabase dashboard
3. Check `girls` table → Should have new row with your girl
4. Check `data_entries` table → Should have new row with your data
5. Check `users` table → Should have your account with `onboarding_completed_at` timestamp

---

## 6. Test Mobile Responsiveness

### Chrome DevTools Device Emulation
1. Open DevTools (F12)
2. Click device emulation button (phone icon)
3. Select "iPhone SE" (375px width)
4. Go through all 4 steps
5. Verify:
   - All forms are usable
   - No horizontal scroll
   - Buttons are touch-friendly
   - Subscription cards stack vertically
   - Text is readable

### Tablet Size
1. Select "iPad" (768px width)
2. Verify layout looks good
3. Subscription cards should show 2-3 columns

---

## 7. Test Auto-Redirects

### Timing Test
1. Fill Step 1 and click Continue
2. Use stopwatch or DevTools Performance
3. Measure time between click and redirect
4. Should be approximately 800ms (0.8 seconds)
5. Repeat for Steps 2 and 3

### Success Message Test
1. Each step should show success message BEFORE redirect
2. Message should be visible for ~800ms
3. Button text should change to "Redirecting..."
4. Green checkmark (✓) should appear

---

## 8. Test Navigation Guards

### Step Skipping Prevention
1. Try to manually navigate to `/step-2` without completing Step 1
2. Should auto-redirect back to `/step-1`
3. Try to navigate to `/step-3` without completing Step 2
4. Should redirect to appropriate step

### Authenticated User Behavior
1. Complete onboarding and log in
2. Try to visit `/step-1`, `/step-2`, or `/step-3`
3. Should redirect to `/step-4` (if onboarding data in session)
4. Or redirect to `/` (if no onboarding data)

---

## 9. Test Stripe Integration

### Checkout Flow
1. Click "Activate Weekly"
2. Verify:
   - Redirects to Stripe Checkout
   - Shows correct product name
   - Shows correct price ($1.99)
   - Shows "Weekly" billing interval
3. Click "Activate Annual"
4. Verify:
   - Shows correct price ($27)
   - Shows "Yearly" billing interval

### Cancel Flow
1. On Stripe Checkout page, click browser back button
2. Should return to `/step-4`
3. Can try checkout again

### Success Flow
1. Complete payment with test card
2. Should redirect to `/welcome-premium`
3. Check Supabase `users` table
4. `subscription_tier` should be updated to "player"
5. `subscription_status` should be "active"
6. `stripe_customer_id` should be populated

---

## 10. Performance Testing

### Page Load Times
- Step 1: < 2 seconds
- Step 2: < 2 seconds
- Step 3: < 2 seconds
- Step 4: < 3 seconds (shows CPN calculations)

### Form Submission Times
- Step 1 → Step 2: < 1 second (just sessionStorage)
- Step 2 → Step 3: < 1 second (just sessionStorage)
- Step 3 → Step 4: < 3 seconds (auth + database commit)

---

## 🐛 Common Issues & Solutions

### Issue: Auto-redirect not working
**Solution**: Check browser console for JavaScript errors

### Issue: Data not persisting
**Solution**: Check if sessionStorage is enabled in browser

### Issue: Database commit fails
**Solution**: 
- Check Supabase connection
- Verify RLS policies allow inserts
- Check browser console for error messages
- Use retry button in Step 4

### Issue: Stripe redirect not working
**Solution**:
- Verify Stripe publishable key is set
- Check price IDs in environment variables
- Ensure `/api/checkout` endpoint is accessible

### Issue: TypeScript/Linter errors
**Solution**: These are configuration warnings, not code errors. App should still run.

---

## ✅ Success Criteria

All of the following should work without errors:

- [ ] Can access all 4 steps as unauthenticated user
- [ ] Auto-redirects work after each step
- [ ] Success messages appear before redirects
- [ ] Data persists in sessionStorage
- [ ] Data commits to database after Step 3
- [ ] CPN calculations display correctly in Step 4
- [ ] Can choose "Keep Free" and enter app
- [ ] Can activate paid plan via Stripe
- [ ] Redirected to `/welcome-premium` after payment
- [ ] Data appears in main app after onboarding
- [ ] Mobile responsive on all screen sizes
- [ ] No console errors during flow

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

✅ = Pass | ❌ = Fail | ⚠️ = Issue (but works)

[ ] Step 1: Form submission and auto-redirect
[ ] Step 2: Data entry with preview and auto-redirect
[ ] Step 3: Account creation with name field
[ ] Step 4: Results display and subscription options
[ ] Free flow: Keep Free → Main app
[ ] Paid flow: Stripe checkout → Welcome page
[ ] Data persistence: SessionStorage
[ ] Data persistence: Database
[ ] Mobile: iPhone SE (375px)
[ ] Mobile: iPad (768px)
[ ] Error handling: Validation
[ ] Error handling: Network failures

Notes:
_______________________________________
_______________________________________
_______________________________________
```

---

**Happy Testing!** 🚀

If you encounter any issues, check the browser console for errors and refer to the implementation summary document.

