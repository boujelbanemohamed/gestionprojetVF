-- Script pour corriger les politiques RLS de toutes les autres tables
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. CORRIGER LA TABLE PROJETS
ALTER TABLE public.projets DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projets' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.projets';
    END LOOP;
END $$;

-- Créer une politique simple
CREATE POLICY "projets_allow_all" ON public.projets
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Réactiver RLS
ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY;

-- 2. CORRIGER LA TABLE DEPARTEMENTS
ALTER TABLE public.departements DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'departements' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.departements';
    END LOOP;
END $$;

-- Créer une politique simple
CREATE POLICY "departements_allow_all" ON public.departements
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Réactiver RLS
ALTER TABLE public.departements ENABLE ROW LEVEL SECURITY;

-- 3. CORRIGER LA TABLE TACHES
ALTER TABLE public.taches DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'taches' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.taches';
    END LOOP;
END $$;

-- Créer une politique simple
CREATE POLICY "taches_allow_all" ON public.taches
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Réactiver RLS
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;

-- 4. CORRIGER LA TABLE PROJET_MEMBRES
ALTER TABLE public.projet_membres DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projet_membres' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.projet_membres';
    END LOOP;
END $$;

-- Créer une politique simple
CREATE POLICY "projet_membres_allow_all" ON public.projet_membres
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Réactiver RLS
ALTER TABLE public.projet_membres ENABLE ROW LEVEL SECURITY;

-- 5. CORRIGER LA TABLE TASK_USERS (si elle existe)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_users' AND table_schema = 'public') THEN
        ALTER TABLE public.task_users DISABLE ROW LEVEL SECURITY;
        
        -- Supprimer toutes les politiques existantes
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'task_users' AND schemaname = 'public') LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.task_users';
        END LOOP;
        
        -- Créer une politique simple
        EXECUTE 'CREATE POLICY "task_users_allow_all" ON public.task_users FOR ALL TO authenticated USING (true) WITH CHECK (true)';
        
        -- Réactiver RLS
        ALTER TABLE public.task_users ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 6. VÉRIFIER QUE TOUTES LES TABLES SONT ACCESSIBLES
SELECT 
    'Table Status' as check_type,
    tablename as table_name,
    CASE WHEN rowsecurity THEN 'RLS_ENABLED' ELSE 'RLS_DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'projets', 'departements', 'taches', 'projet_membres')
ORDER BY tablename;

-- 7. TESTER L'ACCÈS AUX DONNÉES
SELECT 'Data Count Check' as check_type, 'projets' as table_name, COUNT(*)::text as count FROM public.projets
UNION ALL
SELECT 'Data Count Check' as check_type, 'departements' as table_name, COUNT(*)::text as count FROM public.departements
UNION ALL
SELECT 'Data Count Check' as check_type, 'users' as table_name, COUNT(*)::text as count FROM public.users
UNION ALL
SELECT 'Data Count Check' as check_type, 'taches' as table_name, COUNT(*)::text as count FROM public.taches
UNION ALL
SELECT 'Data Count Check' as check_type, 'projet_membres' as table_name, COUNT(*)::text as count FROM public.projet_membres;
