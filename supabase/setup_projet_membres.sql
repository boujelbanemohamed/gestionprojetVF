-- Script SQL robuste pour créer la table projet_membres
-- Gère les cas où certains éléments existent déjà

-- Créer la table des membres de projet (seulement si elle n'existe pas)
CREATE TABLE IF NOT EXISTS projet_membres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'membre',
    added_by UUID REFERENCES users(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(projet_id, user_id)
);

-- Activer RLS (idempotent)
ALTER TABLE projet_membres ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Allow read for authenticated users" ON projet_membres;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON projet_membres;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON projet_membres;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON projet_membres;

-- Créer les politiques RLS
CREATE POLICY "Allow read for authenticated users" ON projet_membres
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON projet_membres
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON projet_membres
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON projet_membres
    FOR DELETE USING (auth.role() = 'authenticated');

-- Supprimer les index existants s'ils existent
DROP INDEX IF EXISTS idx_projet_membres_projet_id;
DROP INDEX IF EXISTS idx_projet_membres_user_id;

-- Créer les index pour améliorer les performances
CREATE INDEX idx_projet_membres_projet_id ON projet_membres(projet_id);
CREATE INDEX idx_projet_membres_user_id ON projet_membres(user_id);

-- Vérifier que la table est bien créée
SELECT 'Table projet_membres créée avec succès' as status;
