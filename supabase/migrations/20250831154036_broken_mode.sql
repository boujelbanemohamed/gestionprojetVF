/*
  # Module PV de Réunion

  1. Nouvelles tables
    - `pv_reunions` - Stocke les procès-verbaux de réunion
    - `pv_projets` - Association many-to-many entre PV et projets

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques appropriées pour chaque rôle
*/

-- Créer la table des PV de réunion
CREATE TABLE IF NOT EXISTS pv_reunions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titre VARCHAR(255) NOT NULL,
    date_reunion DATE NOT NULL,
    description TEXT,
    nom_fichier VARCHAR(255) NOT NULL,
    taille_fichier BIGINT NOT NULL,
    type_fichier VARCHAR(100) NOT NULL,
    url_fichier VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE pv_reunions ENABLE ROW LEVEL SECURITY;

-- Créer la table d'association PV-Projets (many-to-many)
CREATE TABLE IF NOT EXISTS pv_projets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pv_id UUID REFERENCES pv_reunions(id) ON DELETE CASCADE,
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pv_id, projet_id)
);

-- Activer RLS
ALTER TABLE pv_projets ENABLE ROW LEVEL SECURITY;

-- Ajouter des triggers pour updated_at
CREATE TRIGGER update_pv_reunions_updated_at BEFORE UPDATE ON pv_reunions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ajouter des index pour les performances
CREATE INDEX IF NOT EXISTS idx_pv_reunions_date ON pv_reunions(date_reunion);
CREATE INDEX IF NOT EXISTS idx_pv_reunions_uploaded_by ON pv_reunions(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_pv_projets_pv_id ON pv_projets(pv_id);
CREATE INDEX IF NOT EXISTS idx_pv_projets_projet_id ON pv_projets(projet_id);

-- Politiques RLS pour pv_reunions

-- Les admins peuvent tout faire sur les PV
CREATE POLICY "Admins peuvent gérer tous les PV"
    ON pv_reunions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Les utilisateurs peuvent voir les PV des projets auxquels ils sont assignés
CREATE POLICY "Utilisateurs peuvent voir les PV de leurs projets"
    ON pv_reunions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM pv_projets pp
            JOIN taches t ON pp.projet_id = t.projet_id
            JOIN tache_utilisateurs tu ON t.id = tu.tache_id
            WHERE pp.pv_id = pv_reunions.id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Les utilisateurs peuvent créer des PV pour leurs projets
CREATE POLICY "Utilisateurs peuvent créer des PV"
    ON pv_reunions FOR INSERT
    TO authenticated
    WITH CHECK (
        uploaded_by = auth.uid()
    );

-- Les utilisateurs peuvent modifier leurs propres PV ou les admins peuvent tout modifier
CREATE POLICY "Utilisateurs peuvent modifier leurs PV"
    ON pv_reunions FOR UPDATE
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

-- Seuls les créateurs et admins peuvent supprimer
CREATE POLICY "Seuls créateurs et admins peuvent supprimer les PV"
    ON pv_reunions FOR DELETE
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

-- Politiques RLS pour pv_projets

-- Les utilisateurs peuvent voir les associations de leurs projets
CREATE POLICY "Utilisateurs peuvent voir les associations PV-Projets"
    ON pv_projets FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM taches t
            JOIN tache_utilisateurs tu ON t.id = tu.tache_id
            WHERE t.projet_id = pv_projets.projet_id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Les utilisateurs peuvent créer des associations pour leurs projets
CREATE POLICY "Utilisateurs peuvent associer PV à leurs projets"
    ON pv_projets FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM taches t
            JOIN tache_utilisateurs tu ON t.id = tu.tache_id
            WHERE t.projet_id = pv_projets.projet_id
            AND tu.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Les utilisateurs peuvent modifier les associations de leurs projets
CREATE POLICY "Utilisateurs peuvent modifier associations de leurs projets"
    ON pv_projets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM pv_reunions pv
            WHERE pv.id = pv_projets.pv_id
            AND pv.uploaded_by = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );