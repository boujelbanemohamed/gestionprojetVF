-- Script de vérification de la table task_users
-- Exécuter ce script pour vérifier que la table task_users existe et fonctionne

-- 1. Vérifier l'existence de la table
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'task_users' 
AND table_schema = 'public';

-- 2. Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'task_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'task_users'
AND tc.table_schema = 'public';

-- 4. Vérifier les index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'task_users'
AND schemaname = 'public';

-- 5. Vérifier les politiques RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'task_users'
AND schemaname = 'public';

-- 6. Compter les enregistrements
SELECT COUNT(*) as total_assignments FROM task_users;

-- 7. Vérifier quelques exemples d'assignations
SELECT 
    tu.id,
    tu.task_id,
    t.nom as task_name,
    tu.user_id,
    u.nom as user_name,
    u.prenom as user_surname,
    tu.assigned_at
FROM task_users tu
JOIN taches t ON tu.task_id = t.id
JOIN users u ON tu.user_id = u.id
LIMIT 10;
