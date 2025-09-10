-- Créer la table des membres de projet
CREATE TABLE IF NOT EXISTS projet_membres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projet_id UUID REFERENCES projets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'membre',
    added_by UUID REFERENCES users(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(projet_id, user_id)
);

-- Activer RLS
ALTER TABLE projet_membres ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Allow read for authenticated users" ON projet_membres
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre l'insertion aux utilisateurs authentifiés
CREATE POLICY "Allow insert for authenticated users" ON projet_membres
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Allow update for authenticated users" ON projet_membres
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Allow delete for authenticated users" ON projet_membres
    FOR DELETE USING (auth.role() = 'authenticated');

-- Index pour améliorer les performances
CREATE INDEX idx_projet_membres_projet_id ON projet_membres(projet_id);
CREATE INDEX idx_projet_membres_user_id ON projet_membres(user_id);
