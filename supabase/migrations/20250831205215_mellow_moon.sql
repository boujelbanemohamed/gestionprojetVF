/*
  # Create departments table

  1. New Tables
    - `departements`
      - `id` (uuid, primary key)
      - `nom` (text, unique)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `departements` table
    - Add policy for authenticated users to read departments
    - Add policy for admins to manage departments
*/

CREATE TABLE IF NOT EXISTS departements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departements ENABLE ROW LEVEL SECURITY;

-- Policy for reading departments (all authenticated users)
CREATE POLICY "Authenticated users can read departments"
  ON departements
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for managing departments (admins only)
CREATE POLICY "Admins can manage departments"
  ON departements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Insert default departments
INSERT INTO departements (nom) VALUES 
  ('IT'),
  ('Design'),
  ('Marketing'),
  ('Qualité'),
  ('RH')
ON CONFLICT (nom) DO NOTHING;