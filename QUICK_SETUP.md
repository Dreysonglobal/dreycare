# DreyCare Setup - Quick & Simple Guide

Follow these steps to set up DreyCare Hospital Management System.

## Pre-Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Project cloned/downloaded

## Step 1: Install Dependencies

```bash
cd "dreycare open code/dreycare"
npm install --legacy-peer-deps
```

## Step 2: Start Development Server

```bash
npm run dev
```

App running at: http://localhost:3000

Keep this running while you set up the database.

## Step 3: Setup Supabase Database

Go to your Supabase dashboard:
https://supabase.com/dashboard/project/kmkkenqfcqhjwjmatnhz

### 3.1 Run Main Setup Script

1. Click **SQL Editor** (left sidebar)
2. Open file: `supabase/setup.sql`
3. Copy entire content
4. Paste into SQL Editor
5. Click **Run** (top right)
6. Wait for "Success" message

**This creates:**
- All database tables
- Indexes for performance
- Sample users and drugs
- Views and triggers

### 3.2 Enable Row Level Security

1. Open file: `supabase/rls_policies.sql`
2. Copy entire content
3. Open new query in SQL Editor (click + New)
4. Paste and click **Run**

**This creates:**
- Security policies
- Role-based access control
- Permission rules

### 3.3 Setup Storage (Optional)

**Option A: Create via Dashboard (Recommended)**

1. Click **Storage** (left sidebar)
2. Click **"New bucket"** (top right)
3. Create these 5 buckets (all as **Private**):
   - patient-documents
   - lab-results
   - prescriptions
   - medical-images
   - insurance-documents
4. For each bucket:
   - Enter name
   - Uncheck "Public bucket"
   - Click "Create bucket"

**Option B: Run SQL Script**

1. Open file: `supabase/storage_buckets.sql`
2. Copy entire content
3. Open new query in SQL Editor
4. Paste and click **Run**

**Note**: If this fails, use Option A (dashboard). Storage is optional for basic functionality.

### 3.4 Create Database Functions

1. Open file: `supabase/functions.sql`
2. Copy entire content
3. Open new query in SQL Editor
4. Paste and click **Run**

**This creates:**
- Stock management functions
- User online/offline functions
- Statistics functions

## Step 4: Configure Authentication

### 4.1 Enable Email Provider

1. Go to **Authentication** → **Providers**
2. Click on **Email**
3. Ensure it's enabled (should be by default)
4. Click **URL Configuration**
5. Set:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/**`
6. Click **Save**

### 4.2 Create Users

Go to **Authentication** → **Users** → **Add User** → **Create new user**

Create these users (password for all: `Hospital@123`):

| Role | Email |
|------|--------|
| Admin | admin@dreycare.com |
| Doctor 1 | doctor1@dreycare.com |
| Doctor 2 | doctor2@dreycare.com |
| Pharmacy | pharmacy@dreycare.com |
| Lab Technician | lab@dreycare.com |
| Front Desk | frontdesk@dreycare.com |
| Accounts | accounts@dreycare.com |

**For each user:**
1. Enter email and password
2. Check **"Auto Confirm User"** (important!)
3. Click **"Create User"**
4. Repeat for all 7 users

### 4.3 Link Auth Users to App Users

After creating all auth users, run this in SQL Editor:

```sql
UPDATE public.users u
SET id = (SELECT id FROM auth.users WHERE email = u.email)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = u.email);
```

**This links** auth users (login credentials) with public.users (application data).

## Step 5: Verify Setup

Run health check to verify everything is set up:

1. Open file: `supabase/health_check.sql`
2. Copy and run in SQL Editor

**Expected results:**
- All tables listed
- All indexes created
- RLS enabled on all tables
- Users linked correctly
- Storage buckets created (if setup)

## Step 6: Test Application

### 6.1 Test Admin Login

1. Open http://localhost:3000
2. Email: `admin@dreycare.com`
3. Password: `Hospital@123`
4. Click **"Sign In"**

**You should see:**
- Admin Dashboard
- Statistics (patients, visits, drugs, staff)
- Stock status alerts
- Recent visits list
- Online staff list

### 6.2 Test Full Workflow

**Test 1: Front Desk**
1. Logout
2. Login as: `frontdesk@dreycare.com`
3. Click **"New Patient"**
4. Fill in patient details
5. Create visit with vitals
6. Assign to doctor
7. Send to doctor

**Test 2: Doctor**
1. Logout
2. Login as: `doctor1@dreycare.com`
3. See pending patient
4. Enter diagnosis
5. Prescribe medications
6. Send to lab or pharmacy

**Test 3: Pharmacy**
1. Logout
2. Login as: `pharmacy@dreycare.com`
3. View pending prescriptions
4. Dispense drugs
5. Check stock reduced
6. Send to accounts

**Test 4: Accounts**
1. Logout
2. Login as: `accounts@dreycare.com`
3. View bill
4. Process payment
5. Print receipt

## Troubleshooting

### "SQL Error: relation does not exist"
- Run setup.sql again
- Check if all tables were created
- Verify you're in the correct project

### "Login Failed"
- Check user exists in both auth.users and public.users
- Run the linking query again
- Verify email and password are correct
- Ensure "Auto Confirm User" was checked

### "Dashboard shows nothing"
- Refresh the page
- Check browser console (F12) for errors
- Verify environment variables are correct
- Ensure database tables have data

### "Storage buckets not created"
- Use dashboard method (Option A)
- Storage is optional - app works without it
- Try creating one bucket at a time

### "Doctors not appearing online"
- This is automatic when they log in
- Check if doctor users are linked correctly
- Wait a few seconds after login

### "Stock not reducing"
- Ensure drug has stock before dispensing
- Check reduce_stock function exists
- Verify pharmacy user has permissions

## Common SQL Errors & Solutions

### "42601: syntax error"
- Check for missing semicolons
- Ensure all parentheses are closed
- Copy entire file content, not part of it

### "42P01: relation does not exist"
- Run setup.sql first
- Tables might not be created yet
- Check spelling of table names

### "42501: permission denied"
- Ensure you're using project owner account
- Check RLS policies are set correctly
- Verify user has proper role

### "23505: unique constraint violation"
- User/email already exists
- Use different email or update existing
- Check ON CONFLICT clauses in inserts

## Support Resources

### Check Database Status
Run `supabase/health_check.sql` to diagnose issues

### Reset Database (Use with Caution!)
If you need to start over:
```sql
TRUNCATE public.online_users CASCADE;
TRUNCATE public.messages CASCADE;
TRUNCATE public.bill_items CASCADE;
TRUNCATE public.bills CASCADE;
TRUNCATE public.lab_results CASCADE;
TRUNCATE public.prescriptions CASCADE;
TRUNCATE public.patient_visits CASCADE;
TRUNCATE public.patients CASCADE;
```

**Don't truncate users, drugs, or other reference tables unless needed**

## Next Steps After Setup

1. ✅ Test all user roles
2. ✅ Verify complete workflow works
3. ✅ Customize drug inventory
4. ✅ Update pricing if needed
5. ✅ Add more staff users
6. ✅ Set up proper email provider for production
7. ✅ Configure custom domain
8. ✅ Deploy to production (Vercel, etc.)

## Quick Reference

### All Users (Password: Hospital@123)
- admin@dreycare.com
- doctor1@dreycare.com
- doctor2@dreycare.com
- pharmacy@dreycare.com
- lab@dreycare.com
- frontdesk@dreycare.com
- accounts@dreycare.com

### SQL Scripts (Run in order)
1. setup.sql
2. rls_policies.sql
3. storage_buckets.sql (or use dashboard)
4. functions.sql

### Important URLs
- App: http://localhost:3000
- Supabase Dashboard: https://supabase.com/dashboard/project/kmkkenqfcqhjwjmatnhz
- SQL Editor: https://supabase.com/dashboard/project/kmkkenqfcqhjwjmatnhz/sql/new

## Success! 🎉

If you've completed all steps and tested the workflow, DreyCare is ready to use!

For questions or issues, check:
- Browser console for JavaScript errors
- Supabase logs for database errors
- Health check SQL for setup issues

Good luck with DreyCare! 🏥
