-- Script pour insérer manuellement l'utilisateur SUPER_ADMIN
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- 1. Désactiver temporairement RLS pour permettre l'insertion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Utiliser UPSERT pour créer ou mettre à jour l'utilisateur SUPER_ADMIN
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
    NULL, -- Pas de département spécifique pour le super admin
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

-- 4. Réactiver RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Vérifier que l'utilisateur a été créé
SELECT 
    id,
    email,
    nom,
    prenom,
    fonction,
    role,
    created_at
FROM public.users 
WHERE id = '0bf38c7d-ebdf-4145-8205-7780286a2e55';
