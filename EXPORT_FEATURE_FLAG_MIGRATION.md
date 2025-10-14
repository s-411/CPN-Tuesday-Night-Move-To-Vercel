# Export Data Feature Flag Migration

## Overview
This document describes how to manage the per-user export data feature flag that was added to comply with data portability regulations (GDPR, CCPA, etc.) while reducing churn from users exporting data before cancellation.

## Database Changes

### Step 1: Add Column to Database
Run this SQL command in your Supabase SQL Editor:

```sql
-- Add the can_export_data column with default FALSE
ALTER TABLE users
ADD COLUMN can_export_data BOOLEAN DEFAULT FALSE;
```

This will:
- Add a new boolean column to the `users` table
- Set default value to `FALSE` for all existing and new users
- Ensure the export feature is hidden by default

### Step 2: Enable Export for Specific User (When Requested)
When a user emails requesting their data export (e.g., johndoe@gmail.com), run:

```sql
-- Enable export for a specific user by email
UPDATE users
SET can_export_data = TRUE
WHERE email = 'johndoe@gmail.com';
```

Or if you have their user ID:

```sql
-- Enable export for a specific user by ID
UPDATE users
SET can_export_data = TRUE
WHERE id = 'user-uuid-here';
```

### Step 3: Verify User Has Export Access
To check if a user has export access enabled:

```sql
-- Check export status for a user
SELECT email, can_export_data
FROM users
WHERE email = 'johndoe@gmail.com';
```

### Step 4: Disable Export for a User (Optional)
If you need to revoke export access:

```sql
-- Disable export for a specific user
UPDATE users
SET can_export_data = FALSE
WHERE email = 'johndoe@gmail.com';
```

## How It Works

### Frontend Behavior
- **Default State**: The "Data Management" section in Settings is hidden for all users
- **When `can_export_data = TRUE`**: The export section becomes visible and functional
- **When `can_export_data = FALSE` or `NULL`**: The export section remains hidden

### Code Changes Made
1. **Database Type Definition** ([src/lib/types/database.ts](src/lib/types/database.ts)):
   - Added `can_export_data: boolean` field to users table type

2. **Settings Page** ([src/App.tsx:977-1000](src/App.tsx#L977-L1000)):
   - Wrapped "Data Management" card in conditional: `{profile?.can_export_data && (...)}`
   - Export functionality remains unchanged when visible

## Rollback Instructions

### Complete Rollback (if needed)
If you need to completely undo this feature:

```sql
-- Remove the column from the database
ALTER TABLE users DROP COLUMN can_export_data;
```

Then revert the code changes in:
- `src/lib/types/database.ts` (remove `can_export_data` field)
- `src/App.tsx` (remove conditional wrapper around Data Management card)

## User Request Workflow

When a user requests data export:

1. **Receive Request**: User emails: "I want to export my data"
2. **Identify User**: Look up their email in Supabase users table
3. **Enable Feature**: Run SQL to set `can_export_data = TRUE` for their account
4. **Notify User**: Email them back: "Your data export feature has been enabled. Please visit Settings to download your data."
5. **User Exports**: User logs in, goes to Settings, sees "Data Management" section, clicks "Export All Data to CSV"
6. **Optional**: After export, you can either:
   - Leave it enabled (no risk, they already have the data)
   - Disable it again by setting `can_export_data = FALSE`

## Compliance Notes

This implementation ensures:
- ✅ **GDPR Compliance**: Users can request and receive their data
- ✅ **Minimal Friction**: Users don't see export option unless they specifically request it
- ✅ **Reduces Churn**: Casual users won't export data before canceling
- ✅ **Audit Trail**: Database tracks which users have export enabled
- ✅ **Reversible**: Feature can be enabled/disabled per user at any time
- ✅ **Secure**: Fails closed (hidden by default if flag is undefined/null)

## Testing

To test this feature:

1. Log in as a test user
2. Navigate to Settings page
3. Verify "Data Management" card is NOT visible
4. Run SQL to enable: `UPDATE users SET can_export_data = TRUE WHERE email = 'test@example.com';`
5. Refresh Settings page
6. Verify "Data Management" card IS NOW visible
7. Test export button works correctly
8. Run SQL to disable: `UPDATE users SET can_export_data = FALSE WHERE email = 'test@example.com';`
9. Refresh Settings page
10. Verify "Data Management" card is hidden again
