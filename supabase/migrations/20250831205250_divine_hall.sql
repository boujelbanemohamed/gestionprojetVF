/*
  # Create comments and attachments tables

  1. New Tables
    - `commentaires`
      - `id` (uuid, primary key)
      - `contenu` (text)
      - `tache_id` (uuid, references taches)
      - `auteur_id` (uuid, references users)
      - `created_at` (timestamp)
    - `projet_attachments`
      - `id` (uuid, primary key)
      - `nom` (text)
      - `taille` (bigint)
      - `type` (text)
      - `url` (text)
      - `projet_id` (uuid, references projets)
      - `uploaded_by` (uuid, references users)
      - `uploaded_at` (timestamp)
    - `tache_attachments`
      - Similar structure for task attachments
    - `commentaire_attachments`
      - Similar structure for comment attachments
    - `tache_history`
      - `id` (uuid, primary key)
      - `tache_id` (uuid, references taches)
      - `action` (text)
      - `description` (text)
      - `auteur_id` (uuid, references users)
      - `details` (jsonb, optional)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Comments table
CREATE TABLE IF NOT EXISTS commentaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contenu text NOT NULL,
  tache_id uuid REFERENCES taches(id) ON DELETE CASCADE,
  auteur_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commentaires ENABLE ROW LEVEL SECURITY;

-- Project attachments
CREATE TABLE IF NOT EXISTS projet_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  taille bigint NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  projet_id uuid REFERENCES projets(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE projet_attachments ENABLE ROW LEVEL SECURITY;

-- Task attachments
CREATE TABLE IF NOT EXISTS tache_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  taille bigint NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  tache_id uuid REFERENCES taches(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE tache_attachments ENABLE ROW LEVEL SECURITY;

-- Comment attachments
CREATE TABLE IF NOT EXISTS commentaire_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  taille bigint NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  commentaire_id uuid REFERENCES commentaires(id) ON DELETE CASCADE,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE commentaire_attachments ENABLE ROW LEVEL SECURITY;

-- Task history
CREATE TABLE IF NOT EXISTS tache_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tache_id uuid REFERENCES taches(id) ON DELETE CASCADE,
  action text NOT NULL,
  description text NOT NULL,
  auteur_id uuid REFERENCES users(id),
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tache_history ENABLE ROW LEVEL SECURITY;

-- Policies for commentaires
CREATE POLICY "Users can view comments on assigned tasks"
  ON commentaires
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
      WHERE tu.tache_id = commentaires.tache_id
      AND tu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on assigned tasks"
  ON commentaires
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tache_utilisateurs tu
      WHERE tu.tache_id = commentaires.tache_id
      AND tu.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Users can delete own comments or admins can delete any"
  ON commentaires
  FOR DELETE
  TO authenticated
  USING (
    auteur_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Policies for attachments (similar pattern for all attachment tables)
CREATE POLICY "Users can view project attachments"
  ON projet_attachments
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
      WHERE t.projet_id = projet_attachments.projet_id
      AND tu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload project attachments"
  ON projet_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
    OR
    EXISTS (
      SELECT 1 FROM taches t
      JOIN tache_utilisateurs tu ON t.id = tu.tache_id
      WHERE t.projet_id = projet_attachments.projet_id
      AND tu.user_id = auth.uid()
    )
  );

-- Similar policies for task and comment attachments
CREATE POLICY "Users can view task attachments"
  ON tache_attachments
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
      WHERE tu.tache_id = tache_attachments.tache_id
      AND tu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload task attachments"
  ON tache_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tache_utilisateurs tu
      WHERE tu.tache_id = tache_attachments.tache_id
      AND tu.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Users can view comment attachments"
  ON commentaire_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM commentaires c
      JOIN tache_utilisateurs tu ON c.tache_id = tu.tache_id
      WHERE c.id = commentaire_attachments.commentaire_id
      AND tu.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Policies for task history
CREATE POLICY "Users can view task history"
  ON tache_history
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
      WHERE tu.tache_id = tache_history.tache_id
      AND tu.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create task history"
  ON tache_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tache_utilisateurs tu
      WHERE tu.tache_id = tache_history.tache_id
      AND tu.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );