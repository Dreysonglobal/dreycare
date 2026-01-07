# DreyCare Setup Guide

This guide will help you set up the DreyCare Hospital Management System with your Supabase account.

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd "dreycare open code/dreycare"
npm install --legacy-peer-deps
```

### Step 2: Run the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Step 3: Configure Supabase Database

#### 3.1 Open Your Supabase Dashboard
Go to: https://supabase.com/dashboard/project/kmkkenqfcqhjwjmatnhz

#### 3.2 Run Database Setup Script

1. Click on **SQL Editor** in the left sidebar
2. Open the file `supabase/setup.sql` from your project
3. Copy the entire content
4. Paste it into the SQL Editor
5. Click **Run** (top right button)
6. Wait for "Success" message

This creates:
- All database tables (users, patients, visits, drugs, prescriptions, lab results, bills, messages)
- Indexes for performance
- Sample users and drugs
- Views for common queries
- Triggers for automatic timestamp updates

#### 3.3 Enable Row Level Security

1. Open the file `supabase/rls_policies.sql`
2. Copy the entire content
3. Open a new query in SQL Editor
4. Paste and run the script

This ensures:
- Users can only access their own dashboard
- Front desk can manage patients
- Doctors can manage consultations
- Pharmacy can manage inventory
- Admin has full access

#### 3.4 Create Storage Buckets

1. Open the file `supabase/storage_buckets.sql`
2. Copy the entire content
3. Open a new query in SQL Editor
4. Paste and run the script

This creates storage buckets for:
- Patient documents
- Lab results
- Prescriptions
- Medical images
- Insurance documents

#### 3.5 Create Database Functions

1. Open the file `supabase/functions.sql`
2. Copy the entire content
3. Open a new query in SQL Editor
4. Paste and run the script

This creates functions for:
- Reducing drug stock
- Increasing drug stock
- Getting low stock alerts
- Daily statistics
- User online/offline management

### Step 4: Create Authentication Users

#### 4.1 Configure Auth Settings

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Click on **URL Configuration**
4. Set:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`
5. Save

#### 4.2 Create Users

Go to **Authentication** → **Users** and click **Add User** → **Create new user**

Create these users (same password for all):

| Email | Role | Password |
|-------|------|----------|
| admin@dreycare.com | Administrator | Hospital@123 |
| doctor1@dreycare.com | Doctor | Hospital@123 |
| doctor2@dreycare.com | Doctor | Hospital@123 |
| pharmacy@dreycare.com | Pharmacist | Hospital@123 |
| lab@dreycare.com | Lab Technician | Hospital@123 |
| frontdesk@dreycare.com | Front Desk | Hospital@123 |
| accounts@dreycare.com | Accounts | Hospital@123 |

**Important**: Check **Auto Confirm User** for each user to skip email verification.

#### 4.3 Link Auth Users to Application Users

1. Go to **SQL Editor**
2. Run this query to link the users:

```sql
-- This links the auth.users to public.users table
UPDATE public.users u
SET id = (SELECT id FROM auth.users WHERE email = u.email)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = u.email);
```

**Note**: If this doesn't work, you may need to manually update the user IDs:
1. Go to **Table Editor** → public.users
2. For each user, update the ID to match the auth user ID
3. Get auth user IDs from **Authentication** → **Users** (click on a user to see ID)

### Step 5: Test the Application

#### 5.1 Login as Admin

1. Open http://localhost:3000
2. Enter: admin@dreycare.com
3. Password: Hospital@123
4. Click Sign In

You should see the Admin Dashboard with statistics and stock information.

#### 5.2 Test Full Workflow

**Front Desk Workflow:**
1. Logout and login as frontdesk@dreycare.com
2. Register a new patient
3. Create a visit with vitals
4. Assign to a doctor
5. Send to doctor

**Doctor Workflow:**
1. Logout and login as doctor1@dreycare.com
2. See the pending patient
3. Enter diagnosis
4. Prescribe medications
5. Send to lab or pharmacy

**Pharmacy Workflow:**
1. Logout and login as pharmacy@dreycare.com
2. View pending prescriptions
3. Dispense medications (stock should reduce)
4. View inventory and add new drugs

**Lab Workflow:**
1. Logout and login as lab@dreycare.com
2. View lab requests
3. Enter test results
4. Send back to doctor

**Accounts Workflow:**
1. Logout and login as accounts@dreycare.com
2. View pending bills
3. Process payment
4. Print receipt

## Troubleshooting

### "Login Failed"
- Check that user exists in both auth.users and public.users tables
- Verify email is exactly the same in both tables
- Check password is correct

### "Dashboard not loading"
- Open browser console (F12) for errors
- Verify environment variables are set
- Check Supabase connection is working

### "No pending visits"
- Ensure a patient visit has been created from front desk
- Check visit status is correct
- Verify doctor is assigned

### "Can't dispense drugs"
- Check drug has stock available
- Verify RLS policies are set correctly
- Ensure pharmacy user has proper permissions

### "Users not showing as online"
- This is automatic when users log in
- Check online_users table has entries
- Verify set_user_online function exists

## SQL Query Reference

### Useful SQL Queries for Troubleshooting

**Check all users:**
```sql
SELECT * FROM public.users;
SELECT * FROM auth.users;
```

**Check if users are linked:**
```sql
SELECT u.id, u.email, u.role, u.is_online
FROM public.users u
LEFT JOIN auth.users a ON u.id = a.id;
```

**Check patient visits:**
```sql
SELECT * FROM public.patient_visits ORDER BY visit_date DESC LIMIT 10;
```

**Check drug inventory:**
```sql
SELECT * FROM public.drugs ORDER BY stock_quantity ASC;
```

**Check online doctors:**
```sql
SELECT * FROM public.users WHERE role = 'doctor' AND is_online = true;
```

**Reset all visits (use with caution):**
```sql
TRUNCATE public.patient_visits CASCADE;
```

**Reset all data (use with extreme caution):**
```sql
TRUNCATE public.patient_visits CASCADE;
TRUNCATE public.prescriptions CASCADE;
TRUNCATE public.lab_results CASCADE;
TRUNCATE public.bills CASCADE;
TRUNCATE public.bill_items CASCADE;
TRUNCATE public.messages CASCADE;
```

## Next Steps

After successful setup:

1. **Customize Users**: Update user names and emails to match your actual staff
2. **Add More Drugs**: Populate the pharmacy with your actual drug inventory
3. **Configure Pricing**: Update drug prices and service fees
4. **Set Up Storage**: Upload documents to storage buckets as needed
5. **Test All Workflows**: Ensure each role works as expected
6. **Deploy to Production**: Follow deployment instructions in README.md

## Support

If you encounter issues:

1. Check the Supabase logs in the dashboard
2. Review browser console for errors
3. Verify all SQL scripts executed successfully
4. Ensure users are properly linked between auth and public tables
5. Check that RLS policies are working correctly

Happy using DreyCare! 🏥
