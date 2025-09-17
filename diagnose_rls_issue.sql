-- Script de diagnostic pour vérifier l'état des politiques RLS
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier l'état RLS de la table users
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 2. Lister toutes les politiques sur la table users
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- 3. Vérifier si l'utilisateur existe dans la table users
SELECT 
    id,
    email,
    nom,
    prenom,
    role,
    created_at
FROM public.users 
WHERE id = '0bf38c7d-ebdf-4145-8205-7780286a2e55';

-- 4. Tester une requête simple sur la table users
SELECT COUNT(*) as total_users FROM public.users;
