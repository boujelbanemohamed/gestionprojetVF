-- Vérifier la structure de la table projet_membres
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projet_membres' 
ORDER BY ordinal_position;

-- Vérifier si la table existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projet_membres') 
        THEN 'Table projet_membres existe'
        ELSE 'Table projet_membres n''existe pas'
    END as table_status;
