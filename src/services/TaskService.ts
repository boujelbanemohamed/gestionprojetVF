import { supabase } from './supabase';
import { Task, User, Comment } from '../types';
import { handleError, withErrorHandling } from '../utils/errorHandler';
import { mapDateFields } from '../utils/dateMapper';
import { TABLES } from '../constants/tables';
import { formatDateToISOString } from '../utils/dateUtils';

export class TaskService {
  /**
   * Créer une nouvelle tâche
   */
  static async createTask(taskData: {
    nom: string;
    description?: string;
    scenario_execution?: string;
    criteres_acceptation?: string;
    etat?: string;
    date_realisation: Date;
    projet_id: string;
  }): Promise<Task> {
    return withErrorHandling('TaskService.createTask', async () => {
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .insert({
          nom: taskData.nom,
          description: taskData.description,
          scenario_execution: taskData.scenario_execution,
          criteres_acceptation: taskData.criteres_acceptation,
          etat: taskData.etat || 'a_faire',
          date_realisation: formatDateToISOString(taskData.date_realisation),
          projet_id: taskData.projet_id
        })
        .select()
        .single();

      if (error) throw error;

      const mappedTask = mapDateFields(data, ['date_realisation']);
      return {
        id: mappedTask.id,
        nom: mappedTask.nom,
        description: mappedTask.description,
        scenario_execution: mappedTask.scenario_execution,
        criteres_acceptation: mappedTask.criteres_acceptation,
        etat: mappedTask.etat,
        date_realisation: mappedTask.date_realisation,
        projet_id: mappedTask.projet_id,
        utilisateurs: [],
        commentaires: [],
        attachments: [],
        history: []
      };
    });
  }

  /**
   * Récupérer une tâche par ID
   */
  static async getTaskById(id: string): Promise<Task | null> {
    return withErrorHandling('TaskService.getTaskById', async () => {
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select(`
          *,
          utilisateurs:task_users(
            user_id,
            users!task_users_user_id_fkey(
              id,
              nom,
              prenom,
              email,
              fonction,
              departement_id
            )
          ),
          commentaires(
            *,
            users!commentaires_auteur_id_fkey(nom, prenom, email, fonction, role)
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      const mappedTask = mapDateFields(data, ['date_realisation']);
      return {
        id: mappedTask.id,
        nom: mappedTask.nom,
        description: mappedTask.description,
        scenario_execution: mappedTask.scenario_execution,
        criteres_acceptation: mappedTask.criteres_acceptation,
        etat: mappedTask.etat,
        date_realisation: mappedTask.date_realisation,
        projet_id: mappedTask.projet_id,
        utilisateurs: mappedTask.utilisateurs.map(tu => ({
          id: tu.users.id,
          nom: tu.users.nom,
          prenom: tu.users.prenom,
          email: tu.users.email,
          fonction: tu.users.fonction,
          departement: 'Non assigné',
          role: 'UTILISATEUR',
          created_at: new Date()
        })),
        commentaires: mappedTask.commentaires.map(comment => ({
          id: comment.id,
          contenu: comment.contenu,
          auteur_id: comment.auteur_id,
          tache_id: comment.tache_id,
          created_at: new Date(comment.created_at),
          auteur: {
            nom: comment.users.nom,
            prenom: comment.users.prenom,
            email: comment.users.email,
            fonction: comment.users.fonction,
            role: comment.users.role
          }
        })),
        attachments: [],
        history: []
      };
    });
  }

  /**
   * Mettre à jour une tâche
   */
  static async updateTask(
    id: string, 
    taskData: {
      nom?: string;
      description?: string;
      scenario_execution?: string;
      criteres_acceptation?: string;
      etat?: string;
      date_realisation?: Date;
    }
  ): Promise<Task> {
    return withErrorHandling('TaskService.updateTask', async () => {
      const updateData: any = { ...taskData };
      if (taskData.date_realisation) {
        updateData.date_realisation = formatDateToISOString(taskData.date_realisation);
      }

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const mappedTask = mapDateFields(data, ['date_realisation']);
      return {
        id: mappedTask.id,
        nom: mappedTask.nom,
        description: mappedTask.description,
        scenario_execution: mappedTask.scenario_execution,
        criteres_acceptation: mappedTask.criteres_acceptation,
        etat: mappedTask.etat,
        date_realisation: mappedTask.date_realisation,
        projet_id: mappedTask.projet_id,
        utilisateurs: [],
        commentaires: [],
        attachments: [],
        history: []
      };
    });
  }

  /**
   * Supprimer une tâche
   */
  static async deleteTask(id: string): Promise<void> {
    return withErrorHandling('TaskService.deleteTask', async () => {
      const { error } = await supabase
        .from(TABLES.TASKS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    });
  }

  /**
   * Assigner des utilisateurs à une tâche
   */
  static async assignUsersToTask(
    taskId: string, 
    userIds: string[], 
    currentUserId?: string
  ): Promise<void> {
    return withErrorHandling('TaskService.assignUsersToTask', async () => {
      // Vérifier que la tâche existe
      const { data: task, error: taskError } = await supabase
        .from(TABLES.TASKS)
        .select('id')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      // Supprimer les assignations existantes
      const { error: deleteError } = await supabase
        .from(TABLES.TASK_USERS)
        .delete()
        .eq('task_id', taskId);

      if (deleteError) throw deleteError;

      // Ajouter les nouvelles assignations
      if (userIds.length > 0) {
        const assignments = userIds.map(userId => ({
          task_id: taskId,
          user_id: userId,
          assigned_by: currentUserId || null
        }));

        const { error: insertError } = await supabase
          .from(TABLES.TASK_USERS)
          .insert(assignments);

        if (insertError) throw insertError;
      }
    });
  }

  /**
   * Récupérer les tâches d'un projet
   */
  static async getTasksByProject(projectId: string): Promise<Task[]> {
    return withErrorHandling('TaskService.getTasksByProject', async () => {
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select(`
          *,
          utilisateurs:task_users(
            user_id,
            users!task_users_user_id_fkey(
              id,
              nom,
              prenom,
              email,
              fonction,
              departement_id
            )
          ),
          commentaires(
            *,
            users!commentaires_auteur_id_fkey(nom, prenom, email, fonction, role)
          )
        `)
        .eq('projet_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(task => {
        const mappedTask = mapDateFields(task, ['date_realisation']);
        return {
          id: mappedTask.id,
          nom: mappedTask.nom,
          description: mappedTask.description,
          scenario_execution: mappedTask.scenario_execution,
          criteres_acceptation: mappedTask.criteres_acceptation,
          etat: mappedTask.etat,
          date_realisation: mappedTask.date_realisation,
          projet_id: mappedTask.projet_id,
          utilisateurs: mappedTask.utilisateurs.map(tu => ({
            id: tu.users.id,
            nom: tu.users.nom,
            prenom: tu.users.prenom,
            email: tu.users.email,
            fonction: tu.users.fonction,
            departement: 'Non assigné',
            role: 'UTILISATEUR',
            created_at: new Date()
          })),
          commentaires: mappedTask.commentaires.map(comment => ({
            id: comment.id,
            contenu: comment.contenu,
            auteur_id: comment.auteur_id,
            tache_id: comment.tache_id,
            created_at: new Date(comment.created_at),
            auteur: {
              nom: comment.users.nom,
              prenom: comment.users.prenom,
              email: comment.users.email,
              fonction: comment.users.fonction,
              role: comment.users.role
            }
          })),
          attachments: [],
          history: []
        };
      });
    });
  }

  /**
   * Récupérer les tâches assignées à un utilisateur
   */
  static async getTasksByUser(userId: string): Promise<Task[]> {
    return withErrorHandling('TaskService.getTasksByUser', async () => {
      const { data, error } = await supabase
        .from(TABLES.TASK_USERS)
        .select(`
          task:taches(
            *,
            utilisateurs:task_users(
              user_id,
              users!task_users_user_id_fkey(
                id,
                nom,
                prenom,
                email,
                fonction,
                departement_id
              )
            ),
            commentaires(
              *,
              users!commentaires_auteur_id_fkey(nom, prenom, email, fonction, role)
            )
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return data.map(item => {
        const task = item.task;
        const mappedTask = mapDateFields(task, ['date_realisation']);
        return {
          id: mappedTask.id,
          nom: mappedTask.nom,
          description: mappedTask.description,
          scenario_execution: mappedTask.scenario_execution,
          criteres_acceptation: mappedTask.criteres_acceptation,
          etat: mappedTask.etat,
          date_realisation: mappedTask.date_realisation,
          projet_id: mappedTask.projet_id,
          utilisateurs: mappedTask.utilisateurs.map(tu => ({
            id: tu.users.id,
            nom: tu.users.nom,
            prenom: tu.users.prenom,
            email: tu.users.email,
            fonction: tu.users.fonction,
            departement: 'Non assigné',
            role: 'UTILISATEUR',
            created_at: new Date()
          })),
          commentaires: mappedTask.commentaires.map(comment => ({
            id: comment.id,
            contenu: comment.contenu,
            auteur_id: comment.auteur_id,
            tache_id: comment.tache_id,
            created_at: new Date(comment.created_at),
            auteur: {
              nom: comment.users.nom,
              prenom: comment.users.prenom,
              email: comment.users.email,
              fonction: comment.users.fonction,
              role: comment.users.role
            }
          })),
          attachments: [],
          history: []
        };
      });
    });
  }

  /**
   * Changer l'état d'une tâche
   */
  static async updateTaskStatus(taskId: string, status: string): Promise<Task> {
    return withErrorHandling('TaskService.updateTaskStatus', async () => {
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .update({ etat: status })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      const mappedTask = mapDateFields(data, ['date_realisation']);
      return {
        id: mappedTask.id,
        nom: mappedTask.nom,
        description: mappedTask.description,
        scenario_execution: mappedTask.scenario_execution,
        criteres_acceptation: mappedTask.criteres_acceptation,
        etat: mappedTask.etat,
        date_realisation: mappedTask.date_realisation,
        projet_id: mappedTask.projet_id,
        utilisateurs: [],
        commentaires: [],
        attachments: [],
        history: []
      };
    });
  }
}
