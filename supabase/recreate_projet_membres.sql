-- Script pour recréer complètement la table projet_membres

-- Supprimer la table si elle existe (ATTENTION: cela supprimera toutes les données)
DROP TABLE IF EXISTS projet_membres CASCADE;

-- Créer la table avec la structure correcte
CREATE TABLE projet_membres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projet_id UUID NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'membre',
    added_by UUID REFERENCES users(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(projet_id, user_id)
);

-- Activer RLS
ALTER TABLE projet_membres ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Allow read for authenticated users" ON projet_membres
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON projet_membres
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON projet_membres
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" ON projet_membres
    FOR DELETE USING (auth.role() = 'authenticated');

-- Créer les index
CREATE INDEX idx_projet_membres_projet_id ON projet_membres(projet_id);
CREATE INDEX idx_projet_membres_user_id ON projet_membres(user_id);
CREATE INDEX idx_projet_membres_added_by ON projet_membres(added_by);

-- Vérifier la structure créée
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projet_membres' 
ORDER BY ordinal_position;

-- Insérer un membre de test pour vérifier que tout fonctionne
INSERT INTO projet_membres (projet_id, user_id, added_by, role)
SELECT 
    (SELECT id FROM projets LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'membre'
WHERE EXISTS (SELECT 1 FROM projets) AND EXISTS (SELECT 1 FROM users);

-- Vérifier l'insertion
SELECT 'Table projet_membres créée et testée avec succès' as status;
