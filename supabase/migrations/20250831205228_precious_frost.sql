/*
  # Create projects table

  1. New Tables
    - `projets`
      - `id` (uuid, primary key)
      - `nom` (text)
      - `type_projet` (text, optional)
      - `description` (text, optional)
      - `responsable_id` (uuid, references users)
      - `budget_initial` (numeric, optional)
      - `devise` (text, optional)
      - `prestataire_externe` (text, optional)
      - `nouvelles_fonctionnalites` (text, optional)
      - `avantages` (text, optional)
      - `departement_id` (uuid, references departements)
      - `date_debut` (date, optional)
      - `date_fin` (date, optional)
      - `statut` (enum: actif, cloture)
      - `date_cloture` (timestamp, optional)
      - `cloture_par` (uuid, references users, optional)
      - `date_reouverture` (timestamp, optional)
      - `reouvert_par` (uuid, references users, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `projets` table
    - Add policies for project access based on user roles and assignments
*/

CREATE TABLE IF NOT EXISTS projets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type_projet text,
  description text,
  responsable_id uuid REFERENCES users(id),
  budget_initial numeric,
  devise text,
  prestataire_externe text,
  nouvelles_fonctionnalites text,
  avantages text,
  departement_id uuid REFERENCES departements(id),
  date_debut date,
  date_fin date,
  statut text CHECK (statut IN ('actif', 'cloture')) DEFAULT 'actif',
  date_cloture timestamptz,
  cloture_par uuid REFERENCES users(id),
  date_reouverture timestamptz,
  reouvert_par uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projets ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all projects
CREATE POLICY "Admins can manage all projects"
  ON projets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Policy for users to view projects they're assigned to
CREATE POLICY "Users can view assigned projects"
  ON projets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
    OR
    EXISTS (
      SELECT 1 FROM taches t
      JOIN tache_utilisateurs tu ON t.id = tu.tache_id
      WHERE t.projet_id = projets.id
      AND tu.user_id = auth.uid()
    )
    OR
    responsable_id = auth.uid()
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for projects
CREATE OR REPLACE TRIGGER update_projets_updated_at 
  BEFORE UPDATE ON projets
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();