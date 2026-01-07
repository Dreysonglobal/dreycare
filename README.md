# DreyCare - Hospital Management System

A comprehensive web-based hospital management system built with Next.js, TypeScript, and Supabase. DreyCare handles patient information, doctor prescriptions, pharmacy management, and drug inventory with role-based access control.

## Features

### Role-Based Dashboards
- **Admin Dashboard**: Overview of hospital operations, staff monitoring, pharmacy stock status
- **Doctor Dashboard**: Patient consultations, diagnosis writing, prescription creation
- **Pharmacy Dashboard**: Drug inventory management, prescription dispensing, automatic stock reduction
- **Lab Technician Dashboard**: Lab test requests, result entry, test result reporting
- **Front Desk Dashboard**: Patient registration, vitals capture, doctor assignment
- **Accounts Dashboard**: Billing, payment processing, receipt generation

### Key Capabilities
- 🔐 Secure authentication with Supabase
- 👥 Role-based access control (RBAC)
- 📋 Complete patient medical records
- 💊 Pharmacy inventory management with stock tracking
- 🧪 Laboratory test results management
- 💰 Billing and payment processing
- 🔔 Real-time online status tracking for doctors
- 📤 Seamless workflow between departments
- 📊 Admin dashboard with comprehensive statistics
- 🎨 Modern, responsive UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL database + Auth)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Project Structure

```
dreycare/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── admin/       # Admin dashboard
│   │   │   ├── doctor/      # Doctor consultation dashboard
│   │   │   ├── pharmacy/    # Pharmacy management
│   │   │   ├── lab/         # Lab technician dashboard
│   │   │   ├── frontdesk/   # Front desk operations
│   │   │   └── accounts/    # Billing dashboard
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx        # Login page
│   ├── components/          # Reusable components
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication context
│   ├── lib/
│   │   ├── auth.ts          # Auth functions
│   │   ├── database.ts      # Database operations
│   │   └── supabase.ts     # Supabase client
│   └── types/
│       └── index.ts         # TypeScript types
├── supabase/
│   ├── setup.sql            # Database schema creation
│   ├── rls_policies.sql     # Row Level Security policies
│   ├── storage_buckets.sql   # Storage bucket setup
│   └── functions.sql        # Database functions
├── .env.local               # Environment variables
└── package.json
```

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account

### Installation

```bash
cd dreycare
npm install --legacy-peer-deps
```

### Database Setup

1. Open your Supabase project: https://supabase.com/dashboard/project/kmkkenqfcqhjwjmatnhz
2. Go to **SQL Editor**
3. Run these scripts in order:
   - `supabase/setup.sql` - Creates database schema
   - `supabase/rls_policies.sql` - Sets up security policies
   - `supabase/storage_buckets.sql` - Creates storage buckets
   - `supabase/functions.sql` - Creates database functions

### Create Users

Go to **Authentication** → **Users** in Supabase dashboard and create:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dreycare.com | Hospital@123 |
| Doctor | doctor1@dreycare.com | Hospital@123 |
| Pharmacy | pharmacy@dreycare.com | Hospital@123 |
| Lab | lab@dreycare.com | Hospital@123 |
| Front Desk | frontdesk@dreycare.com | Hospital@123 |
| Accounts | accounts@dreycare.com | Hospital@123 |

Then run this in SQL Editor to link auth users:
```sql
UPDATE public.users u
SET id = (SELECT id FROM auth.users WHERE email = u.email)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = u.email);
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## User Workflows

### Front Desk
1. Search or register patient
2. Capture vitals (weight, BP, temperature, pulse)
3. Document chief complaint
4. Assign to available doctor
5. Send to doctor

### Doctor
1. Review patient vitals and complaint
2. Consult with patient
3. Enter diagnosis and notes
4. Prescribe medications
5. Send to lab, pharmacy, or accounts

### Lab Technician
1. Receive lab requests
2. Perform tests
3. Enter test results
4. Send back to doctor or front desk

### Pharmacy
1. View pending prescriptions
2. Dispense medications (auto-reduces stock)
3. Manage inventory
4. Send to accounts

### Admin
1. Monitor hospital operations
2. View staff online status
3. Track pharmacy stock levels
4. Review visit history

## License

This project is proprietary. All rights reserved.
