import { supabase } from './supabase';
import { Comment } from '../types';
import { handleError, withErrorHandling } from '../utils/errorHandler';
import { mapDateFields } from '../utils/dateMapper';
import { TABLES } from '../constants/tables';

export class CommentService {
  /**
   * Créer un nouveau commentaire
   */
  static async createComment(commentData: {
    contenu: string;
    auteur_id: string;
    tache_id: string;
  }): Promise<Comment> {
    return withErrorHandling('CommentService.createComment', async () => {
      const { data, error } = await supabase
        .from(TABLES.COMMENTS)
        .insert({
          contenu: commentData.contenu,
          auteur_id: commentData.auteur_id,
          tache_id: commentData.tache_id
        })
        .select(`
          *,
          users!commentaires_auteur_id_fkey(nom, prenom, email, fonction, role)
        `)
        .single();

      if (error) throw error;

      const mappedComment = mapDateFields(data, ['created_at']);
      return {
        id: mappedComment.id,
        contenu: mappedComment.contenu,
        auteur_id: mappedComment.auteur_id,
        tache_id: mappedComment.tache_id,
        created_at: mappedComment.created_at,
        auteur: {
          nom: mappedComment.users.nom,
          prenom: mappedComment.users.prenom,
          email: mappedComment.users.email,
          fonction: mappedComment.users.fonction,
          role: mappedComment.users.role
        }
      };
    });
  }

  /**
   * Récupérer un commentaire par ID
   */
  static async getCommentById(id: string): Promise<Comment | null> {
    return withErrorHandling('CommentService.getCommentById', async () => {
      const { data, error } = await supabase
        .from(TABLES.COMMENTS)
        .select(`
          *,
          users!commentaires_auteur_id_fkey(nom, prenom, email, fonction, role)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      const mappedComment = mapDateFields(data, ['created_at']);
      return {
        id: mappedComment.id,
        contenu: mappedComment.contenu,
        auteur_id: mappedComment.auteur_id,
        tache_id: mappedComment.tache_id,
        created_at: mappedComment.created_at,
        auteur: {
          nom: mappedComment.users.nom,
          prenom: mappedComment.users.prenom,
          email: mappedComment.users.email,
          fonction: mappedComment.users.fonction,
          role: mappedComment.users.role
        }
      };
    });
  }

  /**
   * Récupérer les commentaires d'une tâche
   */
  static async getCommentsByTask(taskId: string): Promise<Comment[]> {
    return withErrorHandling('CommentService.getCommentsByTask', async () => {
      const { data, error } = await supabase
        .from(TABLES.COMMENTS)
        .select(`
          *,
          users!commentaires_auteur_id_fkey(nom, prenom, email, fonction, role)
        `)
        .eq('tache_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(comment => {
        const mappedComment = mapDateFields(comment, ['created_at']);
        return {
          id: mappedComment.id,
          contenu: mappedComment.contenu,
          auteur_id: mappedComment.auteur_id,
          tache_id: mappedComment.tache_id,
          created_at: mappedComment.created_at,
          auteur: {
            nom: mappedComment.users.nom,
            prenom: mappedComment.users.prenom,
            email: mappedComment.users.email,
            fonction: mappedComment.users.fonction,
            role: mappedComment.users.role
          }
        };
      });
    });
  }

  /**
   * Mettre à jour un commentaire
   */
  static async updateComment(
    id: string, 
    content: string
  ): Promise<Comment> {
    return withErrorHandling('CommentService.updateComment', async () => {
      const { data, error } = await supabase
        .from(TABLES.COMMENTS)
        .update({ contenu: content })
        .eq('id', id)
        .select(`
          *,
          users!commentaires_auteur_id_fkey(nom, prenom, email, fonction, role)
        `)
        .single();

      if (error) throw error;

      const mappedComment = mapDateFields(data, ['created_at']);
      return {
        id: mappedComment.id,
        contenu: mappedComment.contenu,
        auteur_id: mappedComment.auteur_id,
        tache_id: mappedComment.tache_id,
        created_at: mappedComment.created_at,
        auteur: {
          nom: mappedComment.users.nom,
          prenom: mappedComment.users.prenom,
          email: mappedComment.users.email,
          fonction: mappedComment.users.fonction,
          role: mappedComment.users.role
        }
      };
    });
  }

  /**
   * Supprimer un commentaire
   */
  static async deleteComment(id: string): Promise<void> {
    return withErrorHandling('CommentService.deleteComment', async () => {
      const { error } = await supabase
        .from(TABLES.COMMENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    });
  }

  /**
   * Récupérer les commentaires d'un utilisateur
   */
  static async getCommentsByUser(userId: string): Promise<Comment[]> {
    return withErrorHandling('CommentService.getCommentsByUser', async () => {
      const { data, error } = await supabase
        .from(TABLES.COMMENTS)
        .select(`
          *,
          users!commentaires_auteur_id_fkey(nom, prenom, email, fonction, role)
        `)
        .eq('auteur_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(comment => {
        const mappedComment = mapDateFields(comment, ['created_at']);
        return {
          id: mappedComment.id,
          contenu: mappedComment.contenu,
          auteur_id: mappedComment.auteur_id,
          tache_id: mappedComment.tache_id,
          created_at: mappedComment.created_at,
          auteur: {
            nom: mappedComment.users.nom,
            prenom: mappedComment.users.prenom,
            email: mappedComment.users.email,
            fonction: mappedComment.users.fonction,
            role: mappedComment.users.role
          }
        };
      });
    });
  }

  /**
   * Compter les commentaires d'une tâche
   */
  static async getCommentCount(taskId: string): Promise<number> {
    return withErrorHandling('CommentService.getCommentCount', async () => {
      const { count, error } = await supabase
        .from(TABLES.COMMENTS)
        .select('*', { count: 'exact', head: true })
        .eq('tache_id', taskId);

      if (error) throw error;

      return count || 0;
    });
  }
}
