-- Script pour corriger la récursion infinie dans les politiques RLS de la table users
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Désactiver temporairement RLS sur la table users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les politiques existantes sur la table users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;
DROP POLICY IF EXISTS "users_read_all" ON public.users;
DROP POLICY IF EXISTS "users_read_all_auth" ON public.users;

-- 3. Recréer des politiques simples sans récursion
-- Politique pour la lecture : tous les utilisateurs authentifiés peuvent lire tous les utilisateurs
CREATE POLICY "users_read_all_auth" ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- Politique pour l'insertion : tous les utilisateurs authentifiés peuvent créer des utilisateurs
CREATE POLICY "users_insert_auth" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Politique pour la mise à jour : tous les utilisateurs authentifiés peuvent modifier tous les utilisateurs
CREATE POLICY "users_update_auth" ON public.users
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Politique pour la suppression : tous les utilisateurs authentifiés peuvent supprimer tous les utilisateurs
CREATE POLICY "users_delete_auth" ON public.users
    FOR DELETE
    TO authenticated
    USING (true);

-- 4. Réactiver RLS sur la table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Vérifier que les politiques sont correctement créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;
