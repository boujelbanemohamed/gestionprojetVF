-- Script pour vérifier que les tâches sont bien sauvegardées avec tous leurs éléments

-- 1. Vérifier la structure de la table taches
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'taches' 
ORDER BY ordinal_position;

-- 1b. Vérifier la structure de la table commentaires
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'commentaires' 
ORDER BY ordinal_position;

-- 2. Compter le nombre total de tâches
SELECT COUNT(*) as total_taches FROM taches;

-- 3. Vérifier les tâches avec leurs assignations
SELECT 
    t.id,
    t.nom,
    t.description,
    t.scenario_execution,
    t.criteres_acceptation,
    t.etat,
    t.date_realisation,
    t.projet_id,
    t.created_at,
    t.updated_at,
    COUNT(tu.user_id) as nombre_utilisateurs_assignes
FROM taches t
LEFT JOIN task_users tu ON t.id = tu.task_id
GROUP BY t.id, t.nom, t.description, t.scenario_execution, t.criteres_acceptation, t.etat, t.date_realisation, t.projet_id, t.created_at, t.updated_at
ORDER BY t.created_at DESC;

-- 4. Vérifier les assignations d'utilisateurs aux tâches
SELECT 
    tu.id,
    tu.task_id,
    tu.user_id,
    tu.assigned_at,
    tu.assigned_by,
    t.nom as task_name,
    u.nom as user_name,
    u.prenom as user_prenom
FROM task_users tu
JOIN taches t ON tu.task_id = t.id
JOIN users u ON tu.user_id = u.id
ORDER BY tu.assigned_at DESC;

-- 5. Vérifier les commentaires des tâches
SELECT 
    c.id,
    c.tache_id,
    c.contenu,
    c.created_at,
    t.nom as task_name,
    u.nom as author_name,
    u.prenom as author_prenom
FROM commentaires c
JOIN taches t ON c.tache_id = t.id
JOIN users u ON c.auteur_id = u.id
ORDER BY c.created_at DESC;

-- 6. Vérifier les projets avec le nombre de tâches
SELECT 
    p.id,
    p.nom,
    p.statut,
    COUNT(t.id) as nombre_taches,
    COUNT(CASE WHEN t.etat = 'cloturee' THEN 1 END) as taches_terminees,
    COUNT(CASE WHEN t.etat = 'en_cours' THEN 1 END) as taches_en_cours,
    COUNT(CASE WHEN t.etat = 'non_debutee' THEN 1 END) as taches_non_debutees
FROM projets p
LEFT JOIN taches t ON p.id = t.projet_id
GROUP BY p.id, p.nom, p.statut
ORDER BY p.created_at DESC;

-- 7. Vérifier les membres des projets
SELECT 
    pm.id,
    pm.projet_id,
    pm.user_id,
    pm.role,
    pm.added_by,
    pm.added_at,
    p.nom as project_name,
    u.nom as member_name,
    u.prenom as member_prenom
FROM projet_membres pm
JOIN projets p ON pm.projet_id = p.id
JOIN users u ON pm.user_id = u.id
ORDER BY pm.added_at DESC;
