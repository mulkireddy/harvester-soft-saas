
-- ==============================================================================
-- CLEANUP SCRIPT: Delete Load Test Users & Data
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Copy the content of this file.
-- 2. Go to your Supabase Dashboard -> https://supabase.com/dashboard/project/_/sql
-- 3. Paste and Run.
-- ==============================================================================

BEGIN;

-- 1. DELETE PROFILES (Linked to auth.users)
DELETE FROM public.profiles 
WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE 'loadtest_%'
);

-- 2. EXPENSES linked to test users
DELETE FROM public.expenses 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'loadtest_%'
);

-- 2. PAYMENTS linked to jobs of test users
DELETE FROM public.payments 
WHERE job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.farmers f ON j.farmer_id = f.id
    JOIN auth.users u ON f.user_id = u.id
    WHERE u.email LIKE 'loadtest_%'
);

-- 3. JOBS linked to test users
DELETE FROM public.jobs 
WHERE farmer_id IN (
    SELECT f.id FROM public.farmers f
    JOIN auth.users u ON f.user_id = u.id
    WHERE u.email LIKE 'loadtest_%'
);

-- 4. MACHINES (If any were created by test users)
DELETE FROM public.machines 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'loadtest_%'
);

-- 5. FARMERS linked to test users
DELETE FROM public.farmers 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'loadtest_%'
);

-- 6. AUTH USERS (The actual logins)
DELETE FROM auth.users 
WHERE email LIKE 'loadtest_%';

COMMIT;

-- ==============================================================================
-- Verification
-- SELECT count(*) FROM auth.users WHERE email LIKE 'loadtest_%';
-- Should return 0
-- ==============================================================================
