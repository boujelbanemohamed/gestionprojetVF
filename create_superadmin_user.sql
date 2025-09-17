-- Script pour créer l'utilisateur SUPER_ADMIN dans la table users
-- Ce script utilise UPSERT pour éviter les erreurs de clé dupliquée

-- D'abord, vérifier si l'utilisateur existe
SELECT 
    'Vérification initiale' as action,
    id,
    email,
    nom,
    prenom,
    role,
    created_at
FROM public.users 
WHERE id = '0bf38c7d-ebdf-4145-8205-7780286a2e55'
OR email = 'boujelbane@gmail.com';

-- Créer ou mettre à jour l'utilisateur SUPER_ADMIN
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

-- Vérifier que l'utilisateur a été créé/mis à jour
SELECT 
    'Après création/mise à jour' as action,
    id,
    email,
    nom,
    prenom,
    role,
    created_at
FROM public.users 
WHERE id = '0bf38c7d-ebdf-4145-8205-7780286a2e55';

-- Vérifier le nombre total d'utilisateurs
SELECT 
    'Nombre total d\'utilisateurs' as action,
    COUNT(*) as total_users 
FROM public.users;
