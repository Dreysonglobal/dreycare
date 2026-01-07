-- DreyCare Hospital Management System - Supabase Database Setup
-- Run this script in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Hospital Staff)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'pharmacy', 'lab', 'frontdesk', 'accounts')),
    name TEXT NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PATIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    address TEXT,
    emergency_contact TEXT,
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PATIENT VISITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.patient_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    weight NUMERIC,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    temperature NUMERIC,
    pulse_rate INTEGER,
    respiratory_rate INTEGER,
    chief_complaint TEXT,
    visit_date TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES public.users(id),
    assigned_doctor_id UUID REFERENCES public.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_consultation', 'lab_requested', 'pharmacy_requested', 'completed', 'billing')),
    current_location TEXT NOT NULL DEFAULT 'frontdesk' CHECK (current_location IN ('frontdesk', 'doctor', 'lab', 'pharmacy', 'accounts')),
    diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. DRUGS TABLE (Pharmacy Inventory)
-- ============================================
CREATE TABLE IF NOT EXISTS public.drugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    generic_name TEXT,
    description TEXT,
    category TEXT,
    purchase_price NUMERIC NOT NULL CHECK (purchase_price >= 0),
    sales_price NUMERIC NOT NULL CHECK (sales_price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    reorder_level INTEGER DEFAULT 10,
    unit TEXT DEFAULT 'tablets',
    expiry_date DATE,
    manufacturer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. PRESCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES public.patient_visits(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES public.drugs(id),
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. LAB RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES public.patient_visits(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    test_result TEXT NOT NULL,
    reference_range TEXT,
    notes TEXT,
    performed_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. BILLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES public.patient_visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id),
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial')),
    amount_paid NUMERIC DEFAULT 0 CHECK (amount_paid >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- ============================================
-- 8. BILL ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('consultation', 'lab_test', 'drug')),
    item_id UUID NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. MESSAGES TABLE (Internal Communication)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES public.users(id),
    to_user_id UUID REFERENCES public.users(id),
    to_role TEXT CHECK (to_role IN ('admin', 'doctor', 'pharmacy', 'lab', 'frontdesk', 'accounts')),
    visit_id UUID NOT NULL REFERENCES public.patient_visits(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. ONLINE USERS TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.online_users (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_patients_search ON public.patients(first_name, last_name, phone_number);
CREATE INDEX IF NOT EXISTS idx_patient_visits_patient ON public.patient_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_doctor ON public.patient_visits(assigned_doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_visits_status ON public.patient_visits(status);
CREATE INDEX IF NOT EXISTS idx_patient_visits_location ON public.patient_visits(current_location);
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit ON public.prescriptions(visit_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_drug ON public.prescriptions(drug_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_visit ON public.lab_results(visit_id);
CREATE INDEX IF NOT EXISTS idx_bills_patient ON public.bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_bills_visit ON public.bills(visit_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON public.messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_role ON public.messages(to_role);
CREATE INDEX IF NOT EXISTS idx_drugs_name ON public.drugs(name);
CREATE INDEX IF NOT EXISTS idx_drugs_stock ON public.drugs(stock_quantity);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_visits_updated_at BEFORE UPDATE ON public.patient_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drugs_updated_at BEFORE UPDATE ON public.drugs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reduce drug stock when prescription is dispensed
CREATE OR REPLACE FUNCTION reduce_drug_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.drugs
    SET stock_quantity = stock_quantity - 1
    WHERE id = NEW.drug_id AND stock_quantity > 0;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: You'll create this trigger when drugs are actually dispensed
-- CREATE TRIGGER reduce_stock_on_dispense AFTER INSERT ON public.prescriptions
--     FOR EACH ROW WHEN (NEW.dispensed = TRUE) EXECUTE FUNCTION reduce_drug_stock();

-- Function to clean up expired online users
CREATE OR REPLACE FUNCTION cleanup_online_users()
RETURNS void AS $$
BEGIN
    DELETE FROM public.online_users WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- ============================================
-- INSERT SAMPLE USERS (Passwords are hashed)
-- For production, use proper password hashing (bcrypt)
-- ============================================
-- These are sample credentials - change these in production!
-- Password for all: Hospital@123 (hashed example)
INSERT INTO public.users (email, password_hash, role, name) VALUES
('admin@dreycare.com', '$2b$10$ hashed_password_here_replace_with_real_hash', 'admin', 'Admin User'),
('doctor1@dreycare.com', '$2b$10$ hashed_password_here_replace_with_real_hash', 'doctor', 'Dr. Sarah Johnson'),
('doctor2@dreycare.com', '$2b$10$ hashed_password_here_replace_with_real_hash', 'doctor', 'Dr. Michael Chen'),
('pharmacy@dreycare.com', '$2b$10$ hashed_password_here_replace_with_real_hash', 'pharmacy', 'Pharmacist Jane Doe'),
('lab@dreycare.com', '$2b$10$ hashed_password_here_replace_with_real_hash', 'lab', 'Lab Technician Bob Smith'),
('frontdesk@dreycare.com', '$2b$10$ hashed_password_here_replace_with_real_hash', 'frontdesk', 'Front Desk Mary Wilson'),
('accounts@dreycare.com', '$2b$10$ hashed_password_here_replace_with_real_hash', 'accounts', 'Accounts John Brown')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- INSERT SAMPLE DRUGS
-- ============================================
INSERT INTO public.drugs (name, generic_name, description, category, purchase_price, sales_price, stock_quantity, reorder_level, unit) VALUES
('Paracetamol 500mg', 'Acetaminophen', 'Pain reliever and fever reducer', 'Analgesic', 50.00, 75.00, 500, 50, 'tablets'),
('Amoxicillin 500mg', 'Amoxicillin', 'Antibiotic for bacterial infections', 'Antibiotic', 150.00, 200.00, 300, 30, 'capsules'),
('Ibuprofen 400mg', 'Ibuprofen', 'NSAID for pain and inflammation', 'Analgesic', 80.00, 120.00, 400, 40, 'tablets'),
('Omeprazole 20mg', 'Omeprazole', 'Proton pump inhibitor for acid reflux', 'Antacid', 100.00, 150.00, 200, 20, 'capsules'),
('Metformin 500mg', 'Metformin', 'Diabetes medication', 'Antidiabetic', 60.00, 90.00, 350, 35, 'tablets'),
('Cetirizine 10mg', 'Cetirizine', 'Antihistamine for allergies', 'Antihistamine', 45.00, 70.00, 250, 25, 'tablets'),
('Azithromycin 250mg', 'Azithromycin', 'Antibiotic for respiratory infections', 'Antibiotic', 200.00, 280.00, 150, 15, 'tablets'),
('Vitamin C 1000mg', 'Ascorbic Acid', 'Vitamin supplement', 'Vitamin', 30.00, 50.00, 600, 60, 'tablets'),
('Lisinopril 10mg', 'Lisinopril', 'ACE inhibitor for hypertension', 'Antihypertensive', 70.00, 110.00, 180, 18, 'tablets'),
('Aspirin 75mg', 'Acetylsalicylic acid', 'Blood thinner and pain reliever', 'Analgesic', 40.00, 65.00, 450, 45, 'tablets')
ON CONFLICT DO NOTHING;

-- ============================================
-- STORAGE BUCKETS (Run these in Storage section)
-- ============================================
-- Create storage bucket for patient documents
-- INSERT INTO storage.buckets (id, name, public) VALUES ('patient-documents', 'patient-documents', false);

-- Create storage bucket for lab results
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lab-results', 'lab-results', false);

-- Create storage bucket for prescriptions
-- INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for patient visit history
CREATE OR REPLACE VIEW patient_visit_history AS
SELECT
    pv.id,
    pv.patient_id,
    p.first_name,
    p.last_name,
    p.phone_number,
    pv.visit_date,
    pv.status,
    pv.current_location,
    u.name as assigned_doctor,
    pv.diagnosis,
    pv.chief_complaint
FROM public.patient_visits pv
JOIN public.patients p ON pv.patient_id = p.id
LEFT JOIN public.users u ON pv.assigned_doctor_id = u.id
ORDER BY pv.visit_date DESC;

-- View for drug inventory status
CREATE OR REPLACE VIEW drug_inventory_status AS
SELECT
    id,
    name,
    generic_name,
    category,
    stock_quantity,
    reorder_level,
    CASE
        WHEN stock_quantity = 0 THEN 'Out of Stock'
        WHEN stock_quantity <= reorder_level THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status,
    sales_price,
    purchase_price
FROM public.drugs
ORDER BY
    CASE
        WHEN stock_quantity = 0 THEN 1
        WHEN stock_quantity <= reorder_level THEN 2
        ELSE 3
    END,
    name;

-- View for online doctors
CREATE OR REPLACE VIEW online_doctors AS
SELECT
    u.id,
    u.name,
    u.email,
    ou.last_seen
FROM public.users u
JOIN public.online_users ou ON u.id = ou.user_id
WHERE u.role = 'doctor' AND ou.expires_at > NOW()
ORDER BY ou.last_seen DESC;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.users IS 'Hospital staff users with role-based access';
COMMENT ON TABLE public.patients IS 'Patient demographic and medical information';
COMMENT ON TABLE public.patient_visits IS 'Patient visit records with vitals, diagnosis, and status tracking';
COMMENT ON TABLE public.drugs IS 'Pharmacy drug inventory with pricing and stock management';
COMMENT ON TABLE public.prescriptions IS 'Drug prescriptions linked to patient visits';
COMMENT ON TABLE public.lab_results IS 'Laboratory test results for patient visits';
COMMENT ON TABLE public.bills IS 'Patient billing information';
COMMENT ON TABLE public.bill_items IS 'Individual items in a bill';
COMMENT ON TABLE public.messages IS 'Internal communication between hospital staff';
COMMENT ON TABLE public.online_users IS 'Real-time online status tracking';

-- ============================================
-- GRANTS
-- ============================================
-- Grant necessary permissions (adjust based on your security requirements)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;
