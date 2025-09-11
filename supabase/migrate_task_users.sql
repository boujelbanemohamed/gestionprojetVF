-- Script de migration pour migrer les données de tache_utilisateurs vers task_users
-- Exécuter ce script après avoir créé la table task_users

-- Vérifier si la table tache_utilisateurs existe et migrer les données
DO $$
BEGIN
    -- Vérifier si la table tache_utilisateurs existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tache_utilisateurs') THEN
        -- Migrer les données existantes
        INSERT INTO task_users (task_id, user_id, assigned_at)
        SELECT 
            tache_id as task_id,
            user_id,
            NOW() as assigned_at
        FROM tache_utilisateurs
        ON CONFLICT (task_id, user_id) DO NOTHING;
        
        -- Afficher le nombre de lignes migrées
        RAISE NOTICE 'Migrated % rows from tache_utilisateurs to task_users', 
            (SELECT COUNT(*) FROM tache_utilisateurs);
    ELSE
        RAISE NOTICE 'Table tache_utilisateurs does not exist, no migration needed';
    END IF;
END $$;

-- Optionnel : supprimer l'ancienne table après migration (décommentez si vous voulez)
-- DROP TABLE IF EXISTS tache_utilisateurs;
