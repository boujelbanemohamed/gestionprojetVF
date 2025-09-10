import { supabase } from './supabase';
import { User } from '../types';

export interface ProjectMember {
  id: string;
  projet_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  assigned_at: Date;
  assigned_by: string;
  users: User;
}

export class MemberController {
  /**
   * Assigner un membre à un projet
   */
  static async assignMemberToProject(
    projectId: string, 
    userId: string, 
    assignedBy: string,
    role: 'MEMBER' | 'ADMIN' = 'MEMBER'
  ): Promise<ProjectMember> {
    // Vérifier si le membre n'est pas déjà assigné
    const { data: existing } = await supabase
      .from('projet_membres')
      .select('*')
      .eq('projet_id', projectId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new Error('Ce membre est déjà assigné au projet');
    }

    const { data, error } = await supabase
      .from('projet_membres')
      .insert({
        projet_id: projectId,
        user_id: userId,
        role,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString()
      })
      .select(`
        *,
        users(*)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      projet_id: data.projet_id,
      user_id: data.user_id,
      role: data.role,
      assigned_at: new Date(data.assigned_at),
      assigned_by: data.assigned_by,
      users: data.users
    };
  }

  /**
   * Supprimer un membre d'un projet
   */
  static async removeMemberFromProject(
    projectId: string, 
    userId: string
  ): Promise<void> {
    // Vérifier si le membre a des tâches assignées
    const { data: tasks } = await supabase
      .from('tache_utilisateurs')
      .select(`
        taches!inner(projet_id)
      `)
      .eq('user_id', userId)
      .eq('taches.projet_id', projectId);

    if (tasks && tasks.length > 0) {
      throw new Error('Impossible de supprimer ce membre : il a des tâches assignées dans ce projet');
    }

    const { error } = await supabase
      .from('projet_membres')
      .delete()
      .eq('projet_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Récupérer tous les membres d'un projet
   */
  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const { data, error } = await supabase
      .from('projet_membres')
      .select(`
        *,
        users(*)
      `)
      .eq('projet_id', projectId)
      .order('assigned_at', { ascending: true });

    if (error) throw error;

    return data.map(member => ({
      id: member.id,
      projet_id: member.projet_id,
      user_id: member.user_id,
      role: member.role,
      assigned_at: new Date(member.assigned_at),
      assigned_by: member.assigned_by,
      users: member.users
    }));
  }

  /**
   * Compter les membres d'un projet
   */
  static async getProjectMemberCount(projectId: string): Promise<number> {
    const { count, error } = await supabase
      .from('projet_membres')
      .select('*', { count: 'exact', head: true })
      .eq('projet_id', projectId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Vérifier si un utilisateur est membre d'un projet
   */
  static async isUserProjectMember(projectId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('projet_membres')
      .select('id')
      .eq('projet_id', projectId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  /**
   * Récupérer les membres disponibles pour assignation à une tâche
   */
  static async getAvailableMembersForTask(projectId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('projet_membres')
      .select(`
        users(*)
      `)
      .eq('projet_id', projectId);

    if (error) throw error;

    return data.map(member => member.users).filter(Boolean);
  }
}
