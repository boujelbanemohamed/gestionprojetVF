/*
  # Create budget and meeting minutes tables

  1. New Tables
    - `budget_categories`
      - `id` (uuid, primary key)
      - `nom` (text, unique)
      - `description` (text, optional)
      - `is_system` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `project_expenses`
      - `id` (uuid, primary key)
      - `projet_id` (uuid, references projets)
      - `date_depense` (date)
      - `intitule` (text)
      - `montant` (numeric)
      - `devise` (text)
      - `taux_conversion` (numeric, optional)
      - `montant_converti` (numeric, optional)
      - `rubrique` (text, optional)
      - `piece_jointe_url` (text, optional)
      - `piece_jointe_nom` (text, optional)
      - `piece_jointe_type` (text, optional)
      - `piece_jointe_taille` (bigint, optional)
      - `created_by` (uuid, references users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `meeting_minutes`
      - `id` (uuid, primary key)
      - `titre` (text)
      - `date_reunion` (date)
      - `description` (text, optional)
      - `nom_fichier` (text)
      - `taille_fichier` (bigint)
      - `type_fichier` (text)
      - `url_fichier` (text)
      - `uploaded_by` (uuid, references users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `meeting_minute_projects` (many-to-many)
      - `id` (uuid, primary key)
      - `meeting_minute_id` (uuid, references meeting_minutes)
      - `projet_id` (uuid, references projets)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Budget categories
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text UNIQUE NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- Project expenses
CREATE TABLE IF NOT EXISTS project_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projet_id uuid REFERENCES projets(id) ON DELETE CASCADE,
  date_depense date NOT NULL,
  intitule text NOT NULL,
  montant numeric NOT NULL,
  devise text NOT NULL,
  taux_conversion numeric,
  montant_converti numeric,
  rubrique text,
  piece_jointe_url text,
  piece_jointe_nom text,
  piece_jointe_type text,
  piece_jointe_taille bigint,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;

-- Meeting minutes
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  date_reunion date NOT NULL,
  description text,
  nom_fichier text NOT NULL,
  taille_fichier bigint NOT NULL,
  type_fichier text NOT NULL,
  url_fichier text NOT NULL,
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Meeting minute projects (many-to-many)
CREATE TABLE IF NOT EXISTS meeting_minute_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_minute_id uuid REFERENCES meeting_minutes(id) ON DELETE CASCADE,
  projet_id uuid REFERENCES projets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(meeting_minute_id, projet_id)
);

ALTER TABLE meeting_minute_projects ENABLE ROW LEVEL SECURITY;

-- Insert default budget categories
INSERT INTO budget_categories (nom, description, is_system) VALUES 
  ('Ressources Humaines', 'Salaires, formations, consultants', true),
  ('Matériel', 'Équipements, fournitures', true),
  ('Prestations externes', 'Services externes, sous-traitance', true),
  ('Logiciels', 'Licences, abonnements', true),
  ('Déplacements', 'Voyages, hébergement, transport', false),
  ('Communication', 'Marketing, publicité', false),
  ('Formation', 'Formations, certifications', false),
  ('Autres', 'Dépenses diverses', false)
ON CONFLICT (nom) DO NOTHING;

-- Policies for budget categories
CREATE POLICY "All authenticated users can read budget categories"
  ON budget_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage budget categories"
  ON budget_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Policies for project expenses
CREATE POLICY "Users can view expenses for their projects"
  ON project_expenses
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
      WHERE t.projet_id = project_expenses.projet_id
      AND tu.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage project expenses"
  ON project_expenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Policies for meeting minutes
CREATE POLICY "Users can view meeting minutes"
  ON meeting_minutes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create meeting minutes"
  ON meeting_minutes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own meeting minutes or admins can update any"
  ON meeting_minutes
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Users can delete own meeting minutes or admins can delete any"
  ON meeting_minutes
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Policies for meeting minute projects
CREATE POLICY "Users can view meeting minute project associations"
  ON meeting_minute_projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage meeting minute project associations"
  ON meeting_minute_projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meeting_minutes mm
      WHERE mm.id = meeting_minute_projects.meeting_minute_id
      AND (
        mm.uploaded_by = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid()
          AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
      )
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_budget_categories_updated_at 
  BEFORE UPDATE ON budget_categories
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_project_expenses_updated_at 
  BEFORE UPDATE ON project_expenses
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_meeting_minutes_updated_at 
  BEFORE UPDATE ON meeting_minutes
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();