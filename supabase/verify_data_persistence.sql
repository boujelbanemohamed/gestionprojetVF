-- Script de vérification de la persistance des données
-- Ce script vérifie que toutes les données sont bien sauvegardées et accessibles

-- 1. Vérifier les utilisateurs
SELECT 
    'Utilisateurs' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as with_email,
    COUNT(CASE WHEN nom IS NOT NULL AND prenom IS NOT NULL THEN 1 END) as with_names
FROM users;

-- 2. Vérifier les projets
SELECT 
    'Projets' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN statut = 'actif' THEN 1 END) as actifs,
    COUNT(CASE WHEN statut = 'cloture' THEN 1 END) as clotures,
    COUNT(CASE WHEN budget_initial IS NOT NULL THEN 1 END) as with_budget
FROM projets;

-- 3. Vérifier les tâches
SELECT 
    'Tâches' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN etat = 'non_debutee' THEN 1 END) as non_debutees,
    COUNT(CASE WHEN etat = 'en_cours' THEN 1 END) as en_cours,
    COUNT(CASE WHEN etat = 'cloturee' THEN 1 END) as cloturees
FROM taches;

-- 4. Vérifier les assignations de tâches
SELECT 
    'Assignations tâches' as table_name,
    COUNT(*) as total_count,
    COUNT(DISTINCT task_id) as tasks_avec_assignations,
    COUNT(DISTINCT user_id) as users_assignes
FROM task_users;

-- 5. Vérifier les membres de projets
SELECT 
    'Membres projets' as table_name,
    COUNT(*) as total_count,
    COUNT(DISTINCT projet_id) as projets_avec_membres,
    COUNT(DISTINCT user_id) as users_dans_projets
FROM projet_membres;

-- 6. Vérifier les dépenses
SELECT 
    'Dépenses' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN devise = 'EUR' THEN 1 END) as en_euros,
    COUNT(CASE WHEN devise = 'TND' THEN 1 END) as en_tnd,
    COUNT(CASE WHEN montant_converti IS NOT NULL THEN 1 END) as avec_conversion
FROM projet_depenses;

-- 7. Vérifier les commentaires
SELECT 
    'Commentaires' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN auteur_id IS NOT NULL THEN 1 END) as avec_auteur
FROM commentaires;

-- 8. Vérifier les relations entre tables
SELECT 
    'Relations' as info,
    (SELECT COUNT(*) FROM projets p 
     LEFT JOIN taches t ON p.id = t.projet_id 
     WHERE t.id IS NOT NULL) as projets_avec_taches,
    (SELECT COUNT(*) FROM projets p 
     LEFT JOIN projet_membres pm ON p.id = pm.projet_id 
     WHERE pm.id IS NOT NULL) as projets_avec_membres,
    (SELECT COUNT(*) FROM projets p 
     LEFT JOIN projet_depenses pd ON p.id = pd.projet_id 
     WHERE pd.id IS NOT NULL) as projets_avec_depenses;

-- 9. Vérifier les données récentes (dernières 24h)
SELECT 
    'Données récentes' as info,
    (SELECT COUNT(*) FROM taches WHERE created_at > NOW() - INTERVAL '24 hours') as taches_recentes,
    (SELECT COUNT(*) FROM commentaires WHERE created_at > NOW() - INTERVAL '24 hours') as commentaires_recents,
    (SELECT COUNT(*) FROM projet_depenses WHERE created_at > NOW() - INTERVAL '24 hours') as depenses_recentes;

-- 10. Vérifier l'intégrité des clés étrangères
SELECT 
    'Intégrité FK' as info,
    (SELECT COUNT(*) FROM taches t 
     LEFT JOIN projets p ON t.projet_id = p.id 
     WHERE p.id IS NULL) as taches_orphelines,
    (SELECT COUNT(*) FROM task_users tu 
     LEFT JOIN taches t ON tu.task_id = t.id 
     WHERE t.id IS NULL) as assignations_orphelines,
    (SELECT COUNT(*) FROM projet_membres pm 
     LEFT JOIN projets p ON pm.projet_id = p.id 
     WHERE p.id IS NULL) as membres_orphelins;
