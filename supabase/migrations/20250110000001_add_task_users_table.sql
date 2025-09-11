/*
  # Migration: Ajout de la table task_users
  
  Cette migration crée la table task_users pour gérer les assignations
  utilisateurs-tâches avec une structure optimisée et migre les données
  existantes de tache_utilisateurs.
*/

-- Créer la table task_users
CREATE TABLE IF NOT EXISTS task_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES taches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, user_id)
);

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_task_users_task_id ON task_users(task_id);
CREATE INDEX IF NOT EXISTS idx_task_users_user_id ON task_users(user_id);
CREATE INDEX IF NOT EXISTS idx_task_users_assigned_by ON task_users(assigned_by);

-- Activer RLS
ALTER TABLE task_users ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs peuvent voir les assignations des tâches de leurs projets
CREATE POLICY "Users can view task assignments for their projects" ON task_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM taches t
            JOIN projets p ON t.projet_id = p.id
            WHERE t.id = task_users.task_id
            AND (
                p.responsable_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM projet_membres pm
                    WHERE pm.projet_id = p.id
                    AND pm.user_id = auth.uid()
                )
            )
        )
    );

-- Politique RLS : les utilisateurs peuvent créer des assignations pour les tâches de leurs projets
CREATE POLICY "Users can create task assignments for their projects" ON task_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM taches t
            JOIN projets p ON t.projet_id = p.id
            WHERE t.id = task_users.task_id
            AND (
                p.responsable_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM projet_membres pm
                    WHERE pm.projet_id = p.id
                    AND pm.user_id = auth.uid()
                )
            )
        )
    );

-- Politique RLS : les utilisateurs peuvent modifier les assignations des tâches de leurs projets
CREATE POLICY "Users can update task assignments for their projects" ON task_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM taches t
            JOIN projets p ON t.projet_id = p.id
            WHERE t.id = task_users.task_id
            AND (
                p.responsable_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM projet_membres pm
                    WHERE pm.projet_id = p.id
                    AND pm.user_id = auth.uid()
                )
            )
        )
    );

-- Politique RLS : les utilisateurs peuvent supprimer les assignations des tâches de leurs projets
CREATE POLICY "Users can delete task assignments for their projects" ON task_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM taches t
            JOIN projets p ON t.projet_id = p.id
            WHERE t.id = task_users.task_id
            AND (
                p.responsable_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM projet_membres pm
                    WHERE pm.projet_id = p.id
                    AND pm.user_id = auth.uid()
                )
            )
        )
    );

-- Migrer les données existantes de tache_utilisateurs vers task_users
INSERT INTO task_users (task_id, user_id, assigned_at, created_at)
SELECT 
    tache_id as task_id,
    user_id,
    created_at as assigned_at,
    created_at
FROM tache_utilisateurs
WHERE NOT EXISTS (
    SELECT 1 FROM task_users tu 
    WHERE tu.task_id = tache_utilisateurs.tache_id 
    AND tu.user_id = tache_utilisateurs.user_id
)
ON CONFLICT (task_id, user_id) DO NOTHING;

-- Afficher le nombre de lignes migrées
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM tache_utilisateurs;
    RAISE NOTICE 'Migration completed: % rows migrated from tache_utilisateurs to task_users', migrated_count;
END $$;
