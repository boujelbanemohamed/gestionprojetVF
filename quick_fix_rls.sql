-- Script de correction rapide pour les politiques RLS
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. DÉSACTIVER COMPLÈTEMENT RLS sur la table users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES POLITIQUES existantes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
    END LOOP;
END $$;

-- 3. CRÉER UNE SEULE POLITIQUE SIMPLE
CREATE POLICY "users_allow_all" ON public.users
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. RÉACTIVER RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. INSÉRER/METTRE À JOUR L'UTILISATEUR SUPER_ADMIN
INSERT INTO public.users (
    id,
    email,
    nom,
    prenom,
    fonction,
    role,
    departement_id,
    created_at,
    updated_at
) VALUES (
    '0bf38c7d-ebdf-4145-8205-7780286a2e55',
    'boujelbane@gmail.com',
    'BOUJELBANE',
    'Mohamed',
    'Super Administrateur',
    'SUPER_ADMIN',
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
    email = EXCLUDED.email,
    nom = EXCLUDED.nom,
    prenom = EXCLUDED.prenom,
    fonction = EXCLUDED.fonction,
    role = EXCLUDED.role,
    departement_id = EXCLUDED.departement_id,
    updated_at = NOW();

-- 6. VÉRIFIER QUE TOUT FONCTIONNE
SELECT 
    'RLS Status' as check_type,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public'

UNION ALL

SELECT 
    'User Count' as check_type,
    COUNT(*)::text as status
FROM public.users

UNION ALL

SELECT 
    'Super Admin User' as check_type,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTS' ELSE 'MISSING' END as status
FROM public.users 
WHERE id = '0bf38c7d-ebdf-4145-8205-7780286a2e55' AND role = 'SUPER_ADMIN';
