# Storage Setup Instructions for DreyCare

If the SQL script for storage buckets fails, follow these manual instructions:

## Option 1: Create Storage Buckets via Dashboard (Recommended)

1. **Go to Storage Section**
   - Login to your Supabase dashboard
   - Navigate to https://supabase.com/dashboard/project/kmkkenqfcqhjwjmatnhz/storage
   - Or click "Storage" in the left sidebar

2. **Create Each Bucket**
   For each bucket below:
   - Click **"New bucket"** button (top right)
   - Enter the bucket name
   - Set **"Public bucket"** to OFF (unchecked)
   - Click **"Create bucket"**

   **Create these 5 buckets:**
   - `patient-documents` (Private)
   - `lab-results` (Private)
   - `prescriptions` (Private)
   - `medical-images` (Private)
   - `insurance-documents` (Private)

3. **Verify Buckets Created**
   - You should see all 5 buckets listed
   - Each should show as "Private"

## Option 2: Run Simplified SQL Script

If you prefer SQL, run this simplified version in SQL Editor:

```sql
-- Enable storage and create buckets
DO $$
BEGIN
    -- Create buckets
    INSERT INTO storage.buckets (id, name, public)
    VALUES
        ('patient-documents', 'patient-documents', false),
        ('lab-results', 'lab-results', false),
        ('prescriptions', 'prescriptions', false),
        ('medical-images', 'medical-images', false),
        ('insurance-documents', 'insurance-documents', false)
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Buckets created successfully';
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error creating buckets: %', SQLERRM;
END $$;

-- Enable RLS on storage
ALTER TABLE IF EXISTS storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- Basic policy for bucket access
CREATE POLICY IF NOT EXISTS "Public read access to buckets"
ON storage.buckets FOR SELECT
TO public
USING (true);

-- Basic policy for authenticated users
CREATE POLICY IF NOT EXISTS "Auth users can read objects"
ON storage.objects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "Auth users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);
```

## Option 3: Skip Storage for Now

**Storage buckets are optional** for the initial version of DreyCare. The application will work without storage buckets for:
- ✅ User authentication
- ✅ Patient registration and visits
- ✅ Doctor consultations
- ✅ Lab results (stored in database)
- ✅ Pharmacy inventory
- ✅ Billing and payments

**Storage buckets are only needed for:**
- Uploading patient documents (PDF files)
- Storing lab result images/scans
- Saving prescription PDFs
- Medical imaging (X-rays, MRIs)
- Insurance document uploads

You can skip storage setup now and add it later when needed.

## After Creating Buckets

Once buckets are created, the application can:
1. Upload patient documents during registration
2. Attach lab result scans to patient visits
3. Store prescription PDFs
4. Upload medical images (X-rays, etc.)
5. Save insurance documentation

## Troubleshooting

### "Storage not enabled" Error
- Go to Extensions in Supabase dashboard
- Enable "storage" extension if not enabled
- Reload page and try again

### "Permission denied" Error
- Ensure you're using the project owner account
- Check that storage extension is available
- Try creating buckets via dashboard instead

### "Bucket already exists" Error
- This is normal - bucket already created
- You can skip this step
- Or verify bucket in Storage section

## Verification

To verify buckets are created:
1. Go to Storage section in dashboard
2. Check that all 5 buckets are listed
3. Each should show as "Private"

To verify via SQL:
```sql
SELECT id, name, public FROM storage.buckets;
```

Expected output:
```
id                    | name                   | public
----------------------+------------------------+--------
patient-documents     | patient-documents       | false
lab-results            | lab-results            | false
prescriptions         | prescriptions         | false
medical-images        | medical-images        | false
insurance-documents   | insurance-documents   | false
```

## Recommended Next Steps

1. Create buckets (either via dashboard or SQL)
2. Test uploading a file via the application
3. Verify RLS policies are working
4. Set up folder structure within each bucket

## Folder Structure Suggestion

Once buckets are created, organize files like this:

```
patient-documents/
  ├── {patient_uuid}/
  │   ├── personal-info.pdf
  │   └── documents/

lab-results/
  ├── {patient_uuid}/
  │   └── {visit_uuid}/
  │       ├── blood-work.pdf
  │       └── xray.jpg

prescriptions/
  ├── {patient_uuid}/
  │   └── {visit_uuid}/
  │       └── prescription-{date}.pdf

medical-images/
  ├── {patient_uuid}/
  │   └── {visit_uuid}/
  │       ├── xray/
  │       ├── mri/
  │       └── ultrasound/

insurance-documents/
  ├── {patient_uuid}/
  │   ├── policy-{number}.pdf
  │   └── claim-{id}.pdf
```

This structure keeps files organized and easy to manage.
