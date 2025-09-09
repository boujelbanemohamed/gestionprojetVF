/*
  # Create storage bucket and policies

  1. Storage Setup
    - Create 'attachments' bucket
    - Configure policies for file upload/download
  2. Security
    - Users can upload files to their projects/tasks
    - Users can download files they have access to
    - Admins have full access
*/

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Policy for uploading files
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'attachments');

-- Policy for viewing files
CREATE POLICY "Users can view files they have access to"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND (
      -- Admins can see all files
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('ADMIN', 'SUPER_ADMIN')
      )
      OR
      -- Users can see files from their projects
      EXISTS (
        SELECT 1 FROM taches t
        JOIN tache_utilisateurs tu ON t.id = tu.tache_id
        WHERE tu.user_id = auth.uid()
        AND (storage.foldername(name))[1] = t.projet_id::text
      )
    )
  );

-- Policy for deleting files
CREATE POLICY "Users can delete their own files or admins can delete any"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND (
      -- File owner can delete
      auth.uid()::text = (storage.foldername(name))[2]
      OR
      -- Admins can delete any file
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('ADMIN', 'SUPER_ADMIN')
      )
    )
  );