/*
  # Create tasks and related tables

  1. New Tables
    - `taches`
      - `id` (uuid, primary key)
      - `nom` (text)
      - `description` (text, optional)
      - `scenario_execution` (text, optional)
      - `criteres_acceptation` (text, optional)
      - `etat` (enum: non_debutee, en_cours, cloturee)
      - `date_realisation` (date)
      - `projet_id` (uuid, references projets)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `tache_utilisateurs` (many-to-many relationship)
      - `id` (uuid, primary key)
      - `tache_id` (uuid, references taches)
      - `user_id` (uuid, references users)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on both tables
    - Add policies for task access based on assignments and roles
*/

CREATE TABLE IF NOT EXISTS taches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  description text,
  scenario_execution text,
  criteres_acceptation text,
  etat text CHECK (etat IN ('non_debutee', 'en_cours', 'cloturee')) DEFAULT 'non_debutee',
  date_realisation date NOT NULL,
  projet_id uuid REFERENCES projets(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE taches ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tache_utilisateurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tache_id uuid REFERENCES taches(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tache_id, user_id)
);

ALTER TABLE tache_utilisateurs ENABLE ROW LEVEL SECURITY;

-- Policies for taches
CREATE POLICY "Admins can manage all tasks"
  ON taches
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Users can view assigned tasks"
  ON taches
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
      SELECT 1 FROM tache_utilisateurs tu
      WHERE tu.tache_id = taches.id
      AND tu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assigned tasks"
  ON taches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
    OR
    EXISTS (
      SELECT 1 FROM tache_utilisateurs tu
      WHERE tu.tache_id = taches.id
      AND tu.user_id = auth.uid()
    )
  );

-- Policies for tache_utilisateurs
CREATE POLICY "Admins can manage task assignments"
  ON tache_utilisateurs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Users can view their task assignments"
  ON tache_utilisateurs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Trigger for tasks
CREATE OR REPLACE TRIGGER update_taches_updated_at 
  BEFORE UPDATE ON taches
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();