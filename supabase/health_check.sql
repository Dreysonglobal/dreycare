-- Quick Database Health Check
-- Run this to verify your Supabase database is set up correctly

-- Check if all tables exist
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected tables:
-- - users
-- - patients
-- - patient_visits
-- - drugs
-- - prescriptions
-- - lab_results
-- - bills
-- - bill_items
-- - messages
-- - online_users

-- ============================================

-- Check if indexes were created
SELECT
    indexname,
    tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================

-- Check if functions exist
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================

-- Check if RLS is enabled
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- All tables should have rowsecurity = true

-- ============================================

-- Check sample data
SELECT 'users' as table_name, COUNT(*) as row_count FROM public.users
UNION ALL
SELECT 'patients', COUNT(*) FROM public.patients
UNION ALL
SELECT 'drugs', COUNT(*) FROM public.drugs
UNION ALL
SELECT 'patient_visits', COUNT(*) FROM public.patient_visits;

-- ============================================

-- Check if auth users are linked
SELECT
    u.id as app_user_id,
    u.email,
    u.role,
    a.id as auth_user_id,
    CASE
        WHEN u.id = a.id THEN '✓ LINKED'
        ELSE '✗ NOT LINKED'
    END as status
FROM public.users u
LEFT JOIN auth.users a ON u.id = a.id OR u.email = a.email
ORDER BY u.email;

-- ============================================

-- Check storage buckets
SELECT id, name, public
FROM storage.buckets
ORDER BY id;

-- Should show 5 buckets for DreyCare

-- ============================================

-- Summary queries for quick verification

-- Count users by role
SELECT role, COUNT(*) as count
FROM public.users
GROUP BY role
ORDER BY role;

-- Check drug inventory status
SELECT
    name,
    stock_quantity,
    reorder_level,
    CASE
        WHEN stock_quantity = 0 THEN 'OUT OF STOCK'
        WHEN stock_quantity <= reorder_level THEN 'LOW STOCK'
        ELSE 'OK'
    END as stock_status
FROM public.drugs
ORDER BY stock_quantity;

-- Count patient visits by status
SELECT status, COUNT(*) as count
FROM public.patient_visits
GROUP BY status
ORDER BY status;
