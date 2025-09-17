-- Script complet pour corriger toutes les politiques RLS
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. CORRIGER LA TABLE USERS (problème principal)
-- Désactiver RLS temporairement
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;
DROP POLICY IF EXISTS "users_read_all" ON public.users;
DROP POLICY IF EXISTS "users_read_all_auth" ON public.users;

-- Créer des politiques simples
CREATE POLICY "users_read_all_auth" ON public.users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_insert_auth" ON public.users
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "users_update_auth" ON public.users
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "users_delete_auth" ON public.users
    FOR DELETE TO authenticated USING (true);

-- Réactiver RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. CORRIGER LA TABLE PROJETS
-- Désactiver RLS temporairement
ALTER TABLE public.projets DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "projets_read_all_auth" ON public.projets;
DROP POLICY IF EXISTS "projets_read_superadmin" ON public.projets;
DROP POLICY IF EXISTS "projets_insert_auth" ON public.projets;
DROP POLICY IF EXISTS "projets_update_auth" ON public.projets;
DROP POLICY IF EXISTS "projets_delete_auth" ON public.projets;

-- Créer des politiques simples
CREATE POLICY "projets_read_all_auth" ON public.projets
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "projets_insert_auth" ON public.projets
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "projets_update_auth" ON public.projets
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "projets_delete_auth" ON public.projets
    FOR DELETE TO authenticated USING (true);

-- Réactiver RLS
ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY;

-- 3. CORRIGER LA TABLE DEPARTEMENTS
-- Désactiver RLS temporairement
ALTER TABLE public.departements DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "departements_read_auth" ON public.departements;
DROP POLICY IF EXISTS "departements_insert_auth" ON public.departements;
DROP POLICY IF EXISTS "departements_update_auth" ON public.departements;
DROP POLICY IF EXISTS "departements_delete_auth" ON public.departements;

-- Créer des politiques simples
CREATE POLICY "departements_read_auth" ON public.departements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "departements_insert_auth" ON public.departements
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "departements_update_auth" ON public.departements
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "departements_delete_auth" ON public.departements
    FOR DELETE TO authenticated USING (true);

-- Réactiver RLS
ALTER TABLE public.departements ENABLE ROW LEVEL SECURITY;

-- 4. CORRIGER LA TABLE TACHES
-- Désactiver RLS temporairement
ALTER TABLE public.taches DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "taches_read_auth" ON public.taches;
DROP POLICY IF EXISTS "taches_insert_auth" ON public.taches;
DROP POLICY IF EXISTS "taches_update_auth" ON public.taches;
DROP POLICY IF EXISTS "taches_delete_auth" ON public.taches;

-- Créer des politiques simples
CREATE POLICY "taches_read_auth" ON public.taches
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "taches_insert_auth" ON public.taches
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "taches_update_auth" ON public.taches
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "taches_delete_auth" ON public.taches
    FOR DELETE TO authenticated USING (true);

-- Réactiver RLS
ALTER TABLE public.taches ENABLE ROW LEVEL SECURITY;

-- 5. CORRIGER LA TABLE PROJET_MEMBRES
-- Désactiver RLS temporairement
ALTER TABLE public.projet_membres DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "projet_membres_read_auth" ON public.projet_membres;
DROP POLICY IF EXISTS "projet_membres_insert_auth" ON public.projet_membres;
DROP POLICY IF EXISTS "projet_membres_update_auth" ON public.projet_membres;
DROP POLICY IF EXISTS "projet_membres_delete_auth" ON public.projet_membres;

-- Créer des politiques simples
CREATE POLICY "projet_membres_read_auth" ON public.projet_membres
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "projet_membres_insert_auth" ON public.projet_membres
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "projet_membres_update_auth" ON public.projet_membres
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "projet_membres_delete_auth" ON public.projet_membres
    FOR DELETE TO authenticated USING (true);

-- Réactiver RLS
ALTER TABLE public.projet_membres ENABLE ROW LEVEL SECURITY;

-- 6. VÉRIFIER QUE TOUTES LES POLITIQUES SONT CORRECTEMENT CRÉÉES
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
