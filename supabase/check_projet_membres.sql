-- Script de vérification de la table projet_membres

-- Vérifier si la table existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projet_membres') 
        THEN 'Table projet_membres existe'
        ELSE 'Table projet_membres n''existe pas'
    END as table_status;

-- Vérifier la structure de la table si elle existe
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projet_membres' 
ORDER BY ordinal_position;

-- Vérifier les index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'projet_membres';

-- Vérifier les politiques RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'projet_membres';

-- Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'projet_membres';
