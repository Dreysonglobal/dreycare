-- Storage Bucket Creation Script for DreyCare
-- Run this in the Supabase SQL Editor
--
-- ALTERNATIVE: Create buckets manually in the dashboard:
-- 1. Go to Storage section in Supabase dashboard
-- 2. Click "New bucket" for each:
--    - patient-documents (Private)
--    - lab-results (Private)
--    - prescriptions (Private)
--    - medical-images (Private)
--    - insurance-documents (Private)

-- Create storage buckets safely
DO $$
BEGIN
    -- Check if storage.buckets table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'storage'
        AND table_name = 'buckets'
    ) THEN
        -- Insert buckets if they don't exist
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES
            ('patient-documents', 'patient-documents', false, NULL, NULL),
            ('lab-results', 'lab-results', false, NULL, NULL),
            ('prescriptions', 'prescriptions', false, NULL, NULL),
            ('medical-images', 'medical-images', false, NULL, NULL),
            ('insurance-documents', 'insurance-documents', false, NULL, NULL)
        ON CONFLICT (id) DO NOTHING;

        -- Enable RLS on storage tables
        ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'Storage buckets created successfully';
    ELSE
        RAISE NOTICE 'Storage tables not found - please create buckets manually in the dashboard';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Storage setup encountered an error: %', SQLERRM;
END $$;

-- ============================================
-- STORAGE BUCKET RLS POLICIES
-- ============================================

-- Allow authenticated users to view buckets
CREATE POLICY "Authenticated users can view buckets"
ON storage.buckets FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- STORAGE OBJECTS RLS POLICIES
-- ============================================

-- Helper function to check user role
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id::text = auth.uid()::text
        AND role = role_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow users to insert files into their assigned buckets based on role
CREATE POLICY "Users can upload to patient-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'patient-documents'
    AND (has_role('frontdesk') OR has_role('admin'))
);

CREATE POLICY "Users can upload to lab-results"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'lab-results'
    AND (has_role('lab') OR has_role('admin'))
);

CREATE POLICY "Users can upload to prescriptions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'prescriptions'
    AND (has_role('doctor') OR has_role('admin'))
);

CREATE POLICY "Users can upload to medical-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'medical-images'
    AND (has_role('lab') OR has_role('doctor') OR has_role('admin'))
);

CREATE POLICY "Users can upload to insurance-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'insurance-documents'
    AND (has_role('frontdesk') OR has_role('admin'))
);

-- Allow read access based on bucket
CREATE POLICY "Authenticated users can view patient-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'patient-documents'
);

CREATE POLICY "Medical staff can view lab-results"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'lab-results'
    AND (has_role('doctor') OR has_role('lab') OR has_role('admin'))
);

CREATE POLICY "Medical staff can view prescriptions"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'prescriptions'
    AND (has_role('doctor') OR has_role('pharmacy') OR has_role('admin'))
);

CREATE POLICY "Medical staff can view medical-images"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'medical-images'
    AND (has_role('doctor') OR has_role('lab') OR has_role('admin'))
);

CREATE POLICY "Authenticated users can view insurance-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'insurance-documents'
);

-- Allow updates/deletes based on role
CREATE POLICY "Frontdesk and admin can update patient-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'patient-documents'
    AND (has_role('frontdesk') OR has_role('admin'))
);

CREATE POLICY "Lab and admin can update lab-results"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'lab-results'
    AND (has_role('lab') OR has_role('admin'))
);

CREATE POLICY "Admin can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (has_role('admin'));

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run this to verify buckets were created:
-- SELECT * FROM storage.buckets;

-- Run this to verify policies were created:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage';
