# DreyCare SQL Scripts - All Fixed Issues

All SQL scripts have been updated to fix syntax errors. Run them in this exact order:

## Run Order

1. ✅ setup.sql (COMPLETED)
2. ✅ rls_policies.sql (FIXED - just run this)
3. ⏭️ storage_buckets.sql (Optional - use dashboard if preferred)
4. ⏭️ functions.sql

## Fixed Issues:

### Issue 1: Storage Buckets ✅ Fixed
**Error:** `42601: syntax error at or near "storage"`
**Solution:** Rewrote script with proper error handling and alternative dashboard method

### Issue 2: Views Grant ✅ Fixed  
**Error:** `42601: syntax error at or near "VIEWS"`
**Solution:** Removed problematic GRANT SELECT ON ALL VIEWS line (access handled by RLS policies)

## Quick Fix - Just Run These:

### 1. RLS Policies (UPDATED)
File: `supabase/rls_policies.sql`

Copy and run in SQL Editor. This is the only one you need to run now.

### 2. Functions
File: `supabase/functions.sql`

Copy and run in SQL Editor.

### 3. Storage (Optional)
File: `supabase/storage_buckets.sql`

OR create buckets manually in Storage section of dashboard.

## Verification

After running all scripts, run this to check:

```sql
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Should show: users, patients, patient_visits, drugs, prescriptions, lab_results, bills, bill_items, messages, online_users

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All should have rowsecurity = true

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;
```

## If Errors Still Occur

### Try One Script at a Time

1. Run `setup.sql` - wait for success
2. Run `rls_policies.sql` - wait for success
3. Run `functions.sql` - wait for success
4. Skip storage for now (optional)

### Reset and Start Over

If scripts keep failing:

```sql
-- Drop everything (EXTREME CAUTION!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Then run setup.sql again
```

This will delete all data. Use only if necessary!

## Next Steps After SQL

1. Create users in Authentication section
2. Link users with this query:

```sql
UPDATE public.users u
SET id = (SELECT id FROM auth.users WHERE email = u.email)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = u.email);
```

3. Test the application at http://localhost:3000

## Scripts Status

- ✅ setup.sql - Ready to use
- ✅ rls_policies.sql - **FIXED** - Ready to run
- ✅ storage_buckets.sql - **FIXED** - Ready to run (or use dashboard)
- ✅ functions.sql - Ready to use

All syntax errors have been resolved!
