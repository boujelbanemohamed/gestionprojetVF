-- Script de test pour vérifier l'assignation des utilisateurs aux tâches
-- Exécuter ce script pour tester la fonctionnalité d'assignation

-- 1. Créer une tâche de test si elle n'existe pas
INSERT INTO taches (id, nom, description, etat, date_realisation, projet_id)
SELECT 
    'test-task-id-12345',
    'Tâche de test pour assignation',
    'Description de la tâche de test',
    'non_debutee',
    CURRENT_DATE + INTERVAL '7 days',
    (SELECT id FROM projets LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM taches WHERE id = 'test-task-id-12345');

-- 2. Créer un utilisateur de test si il n'existe pas
INSERT INTO users (id, nom, prenom, email, role)
SELECT 
    'test-user-id-12345',
    'Test',
    'User',
    'test.user@example.com',
    'UTILISATEUR'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'test-user-id-12345');

-- 3. Tester l'assignation d'un utilisateur à la tâche
INSERT INTO task_users (task_id, user_id, assigned_by)
VALUES ('test-task-id-12345', 'test-user-id-12345', 'test-user-id-12345')
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 4. Vérifier que l'assignation a été créée
SELECT 
    'Test assignment created' as status,
    tu.id,
    t.nom as task_name,
    u.nom as user_name,
    u.prenom as user_surname
FROM task_users tu
JOIN taches t ON tu.task_id = t.id
JOIN users u ON tu.user_id = u.id
WHERE tu.task_id = 'test-task-id-12345'
AND tu.user_id = 'test-user-id-12345';

-- 5. Tester la suppression d'assignation
DELETE FROM task_users 
WHERE task_id = 'test-task-id-12345' 
AND user_id = 'test-user-id-12345';

-- 6. Vérifier que l'assignation a été supprimée
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'Test assignment deleted successfully'
        ELSE 'ERROR: Assignment still exists'
    END as status
FROM task_users 
WHERE task_id = 'test-task-id-12345' 
AND user_id = 'test-user-id-12345';

-- 7. Nettoyer les données de test
DELETE FROM taches WHERE id = 'test-task-id-12345';
DELETE FROM users WHERE id = 'test-user-id-12345';

-- 8. Afficher un résumé
SELECT 'Task assignment test completed successfully' as result;
