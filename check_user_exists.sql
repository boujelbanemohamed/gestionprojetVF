-- Vérifier si l'utilisateur SUPER_ADMIN existe dans la table users
SELECT 
    id,
    email,
    nom,
    prenom,
    role,
    created_at
FROM public.users 
WHERE id = '0bf38c7d-ebdf-4145-8205-7780286a2e55'
OR email = 'boujelbane@gmail.com';

-- Vérifier le nombre total d'utilisateurs
SELECT COUNT(*) as total_users FROM public.users;

-- Vérifier les politiques RLS sur la table users
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';
