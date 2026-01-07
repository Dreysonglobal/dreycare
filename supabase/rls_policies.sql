-- Row Level Security (RLS) Policies for DreyCare
-- Run this AFTER the main setup.sql

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE RLS POLICIES
-- ============================================

-- Allow read access for all authenticated users
CREATE POLICY "Users: Allow read for authenticated users"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Allow insert for registration
CREATE POLICY "Users: Allow insert for authenticated users"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own record
CREATE POLICY "Users: Allow update own record"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'admin'
));

-- ============================================
-- PATIENTS TABLE RLS POLICIES
-- ============================================

-- Allow all authenticated users to read patients (hospital staff need access)
CREATE POLICY "Patients: Allow read for authenticated users"
ON public.patients FOR SELECT
TO authenticated
USING (true);

-- Allow frontdesk and admin to insert patients
CREATE POLICY "Patients: Allow insert for frontdesk and admin"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role IN ('frontdesk', 'admin')
    )
);

-- Allow frontdesk and admin to update patients
CREATE POLICY "Patients: Allow update for frontdesk and admin"
ON public.patients FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role IN ('frontdesk', 'admin')
    )
);

-- ============================================
-- PATIENT VISITS TABLE RLS POLICIES
-- ============================================

-- Allow read based on role and assignment
CREATE POLICY "Patient Visits: Allow read for relevant staff"
ON public.patient_visits FOR SELECT
TO authenticated
USING (
    -- Admin sees all
    EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'admin')
    OR
    -- Frontdesk sees all (they need to coordinate)
    EXISTS (SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'frontdesk')
    OR
    -- Doctor sees assigned visits
    (assigned_doctor_id::text = auth.uid()::text)
    OR
    -- Doctor sees visits in their queue (frontdesk sent to them)
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'doctor'
        AND current_location = 'doctor'
    )
    OR
    -- Lab sees lab visits
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'lab'
        AND current_location = 'lab'
    )
    OR
    -- Pharmacy sees pharmacy visits
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'pharmacy'
        AND current_location = 'pharmacy'
    )
    OR
    -- Accounts sees billing visits
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'accounts'
        AND current_location = 'accounts'
    )
    OR
    -- Created by user
    (created_by::text = auth.uid()::text)
);

-- Allow frontdesk to insert visits
CREATE POLICY "Patient Visits: Allow insert for frontdesk"
ON public.patient_visits FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'frontdesk'
    )
    AND created_by::text = auth.uid()::text
);

-- Allow doctor to update diagnosis and send to other departments
CREATE POLICY "Patient Visits: Allow update for doctor"
ON public.patient_visits FOR UPDATE
TO authenticated
USING (
    (assigned_doctor_id::text = auth.uid()::text OR created_by::text = auth.uid()::text)
    AND EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'doctor'
    )
)
WITH CHECK (
    (assigned_doctor_id::text = auth.uid()::text OR created_by::text = auth.uid()::text)
    AND EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'doctor'
    )
);

-- Allow frontdesk to update visit status
CREATE POLICY "Patient Visits: Allow update status for frontdesk"
ON public.patient_visits FOR UPDATE
TO authenticated
USING (
    created_by::text = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'frontdesk'
    )
)
WITH CHECK (
    created_by::text = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'frontdesk'
    )
);

-- Allow lab to update lab results and send back
CREATE POLICY "Patient Visits: Allow update for lab"
ON public.patient_visits FOR UPDATE
TO authenticated
USING (
    current_location = 'lab'
    AND EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'lab'
    )
)
WITH CHECK (
    current_location = 'lab'
    AND EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'lab'
    )
);

-- Allow pharmacy to update when drugs dispensed
CREATE POLICY "Patient Visits: Allow update for pharmacy"
ON public.patient_visits FOR UPDATE
TO authenticated
USING (
    current_location = 'pharmacy'
    AND EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'pharmacy'
    )
)
WITH CHECK (
    current_location = 'pharmacy'
    AND EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'pharmacy'
    )
);

-- Allow accounts to update billing status
CREATE POLICY "Patient Visits: Allow update for accounts"
ON public.patient_visits FOR UPDATE
TO authenticated
USING (
    current_location = 'accounts'
    AND EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'accounts'
    )
)
WITH CHECK (
    current_location = 'accounts'
    AND EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'accounts'
    )
);

-- ============================================
-- DRUGS TABLE RLS POLICIES
-- ============================================

-- Allow read for all authenticated users (inventory visibility)
CREATE POLICY "Drugs: Allow read for authenticated users"
ON public.drugs FOR SELECT
TO authenticated
USING (true);

-- Allow pharmacy and admin to insert drugs
CREATE POLICY "Drugs: Allow insert for pharmacy and admin"
ON public.drugs FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role IN ('pharmacy', 'admin')
    )
);

-- Allow pharmacy to update stock and prices
CREATE POLICY "Drugs: Allow update for pharmacy"
ON public.drugs FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'pharmacy'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'pharmacy'
    )
);

-- Allow admin to update anything
CREATE POLICY "Drugs: Allow update for admin"
ON public.drugs FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- ============================================
-- PRESCRIPTIONS TABLE RLS POLICIES
-- ============================================

-- Allow read for doctors, pharmacy, admin
CREATE POLICY "Prescriptions: Allow read for doctors, pharmacy, admin"
ON public.prescriptions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role IN ('doctor', 'pharmacy', 'admin')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.patient_visits pv
        WHERE pv.id = visit_id
        AND (pv.assigned_doctor_id::text = auth.uid()::text OR pv.created_by::text = auth.uid()::text)
    )
);

-- Allow doctors to create prescriptions
CREATE POLICY "Prescriptions: Allow insert for doctors"
ON public.prescriptions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'doctor'
    )
);

-- Allow pharmacy to update (mark as dispensed)
CREATE POLICY "Prescriptions: Allow update for pharmacy"
ON public.prescriptions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'pharmacy'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'pharmacy'
    )
);

-- ============================================
-- LAB RESULTS TABLE RLS POLICIES
-- ============================================

-- Allow read for doctors, lab, admin
CREATE POLICY "Lab Results: Allow read for doctors, lab, admin"
ON public.lab_results FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role IN ('doctor', 'lab', 'admin')
    )
    OR
    EXISTS (
        SELECT 1 FROM public.patient_visits pv
        WHERE pv.id = visit_id
        AND (pv.assigned_doctor_id::text = auth.uid()::text OR pv.created_by::text = auth.uid()::text)
    )
);

-- Allow lab technicians to create results
CREATE POLICY "Lab Results: Allow insert for lab"
ON public.lab_results FOR INSERT
TO authenticated
WITH CHECK (
    performed_by::text = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'lab'
    )
);

-- ============================================
-- BILLS TABLE RLS POLICIES
-- ============================================

-- Allow read for accounts, admin, pharmacy
CREATE POLICY "Bills: Allow read for accounts, admin, pharmacy"
ON public.bills FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role IN ('accounts', 'admin', 'pharmacy')
    )
);

-- Allow accounts to create and update bills
CREATE POLICY "Bills: Allow insert for accounts"
ON public.bills FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'accounts'
    )
);

CREATE POLICY "Bills: Allow update for accounts"
ON public.bills FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'accounts'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'accounts'
    )
);

-- ============================================
-- BILL ITEMS TABLE RLS POLICIES
-- ============================================

-- Allow read for accounts, admin, pharmacy
CREATE POLICY "Bill Items: Allow read for accounts, admin, pharmacy"
ON public.bill_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role IN ('accounts', 'admin', 'pharmacy')
    )
);

-- Allow accounts to insert and update
CREATE POLICY "Bill Items: Allow insert for accounts"
ON public.bill_items FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'accounts'
    )
);

CREATE POLICY "Bill Items: Allow update for accounts"
ON public.bill_items FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'accounts'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = 'accounts'
    )
);

-- ============================================
-- MESSAGES TABLE RLS POLICIES
-- ============================================

-- Allow read for sender and recipient
CREATE POLICY "Messages: Allow read for sender and recipient"
ON public.messages FOR SELECT
TO authenticated
USING (
    from_user_id::text = auth.uid()::text
    OR to_user_id::text = auth.uid()::text
    OR EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = to_role
    )
);

-- Allow insert for authenticated users
CREATE POLICY "Messages: Allow insert for authenticated users"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    from_user_id::text = auth.uid()::text
);

-- Allow recipient to mark as read
CREATE POLICY "Messages: Allow update for recipient"
ON public.messages FOR UPDATE
TO authenticated
USING (
    to_user_id::text = auth.uid()::text
    OR EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = to_role
    )
)
WITH CHECK (
    to_user_id::text = auth.uid()::text
    OR EXISTS (
        SELECT 1 FROM public.users WHERE id::text = auth.uid()::text AND role = to_role
    )
);

-- ============================================
-- ONLINE USERS TABLE RLS POLICIES
-- ============================================

-- Allow read for all authenticated users
CREATE POLICY "Online Users: Allow read for authenticated users"
ON public.online_users FOR SELECT
TO authenticated
USING (true);

-- Allow insert for authenticated users
CREATE POLICY "Online Users: Allow insert for authenticated users"
ON public.online_users FOR INSERT
TO authenticated
WITH CHECK (
    user_id::text = auth.uid()::text
);

-- Allow users to update their own status
CREATE POLICY "Online Users: Allow update own record"
ON public.online_users FOR UPDATE
TO authenticated
USING (
    user_id::text = auth.uid()::text
)
WITH CHECK (
    user_id::text = auth.uid()::text
);

-- Allow cleanup trigger to delete
CREATE POLICY "Online Users: Allow delete for system"
ON public.online_users FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_online_users() TO authenticated;

-- Grant read access on tables (views are accessed through RLS policies)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
