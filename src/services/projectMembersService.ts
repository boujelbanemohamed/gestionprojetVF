import { supabase } from './supabase';
import { ProjectMember, User } from '../types';

export class ProjectMembersService {
  /**
   * Récupère tous les membres d'un projet
   */
  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const { data, error } = await supabase
      .from('projet_membres')
      .select(`
        *,
        utilisateur:users!projet_membres_utilisateur_id_fkey (
          id,
          nom,
          prenom,
          email,
          fonction,
          departement,
          role,
          created_at
        )
      `)
      .eq('projet_id', projectId)
      .order('assigne_le', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des membres du projet:', error);
      throw error;
    }

    return data.map(member => ({
      id: member.id,
      projet_id: member.projet_id,
      utilisateur_id: member.utilisateur_id,
      role: member.role,
      assigne_le: new Date(member.assigne_le),
      assigne_par: member.assigne_par,
      created_at: new Date(member.created_at),
      updated_at: new Date(member.updated_at),
      utilisateur: member.utilisateur ? {
        id: member.utilisateur.id,
        nom: member.utilisateur.nom,
        prenom: member.utilisateur.prenom,
        email: member.utilisateur.email,
        fonction: member.utilisateur.fonction,
        departement: member.utilisateur.departement,
        role: member.utilisateur.role,
        created_at: new Date(member.utilisateur.created_at)
      } : undefined
    }));
  }

  /**
   * Récupère le nombre de membres d'un projet
   */
  static async getProjectMemberCount(projectId: string): Promise<number> {
    const { count, error } = await supabase
      .from('projet_membres')
      .select('*', { count: 'exact', head: true })
      .eq('projet_id', projectId);

    if (error) {
      console.error('Erreur lors du comptage des membres du projet:', error);
      throw error;
    }

    return count || 0;
  }

  /**
   * Ajoute un membre à un projet
   */
  static async addProjectMember(
    projectId: string, 
    userId: string, 
    role: 'membre' | 'responsable' | 'observateur' = 'membre',
    assignedBy?: string
  ): Promise<ProjectMember> {
    const { data, error } = await supabase
      .from('projet_membres')
      .insert({
        projet_id: projectId,
        utilisateur_id: userId,
        role,
        assigne_par: assignedBy
      })
      .select(`
        *,
        utilisateur:users!projet_membres_utilisateur_id_fkey (
          id,
          nom,
          prenom,
          email,
          fonction,
          departement,
          role,
          created_at
        )
      `)
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout du membre au projet:', error);
      throw error;
    }

    return {
      id: data.id,
      projet_id: data.projet_id,
      utilisateur_id: data.utilisateur_id,
      role: data.role,
      assigne_le: new Date(data.assigne_le),
      assigne_par: data.assigne_par,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      utilisateur: data.utilisateur ? {
        id: data.utilisateur.id,
        nom: data.utilisateur.nom,
        prenom: data.utilisateur.prenom,
        email: data.utilisateur.email,
        fonction: data.utilisateur.fonction,
        departement: data.utilisateur.departement,
        role: data.utilisateur.role,
        created_at: new Date(data.utilisateur.created_at)
      } : undefined
    };
  }

  /**
   * Supprime un membre d'un projet
   */
  static async removeProjectMember(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('projet_membres')
      .delete()
      .eq('projet_id', projectId)
      .eq('utilisateur_id', userId);

    if (error) {
      console.error('Erreur lors de la suppression du membre du projet:', error);
      throw error;
    }
  }

  /**
   * Met à jour le rôle d'un membre dans un projet
   */
  static async updateProjectMemberRole(
    projectId: string, 
    userId: string, 
    newRole: 'membre' | 'responsable' | 'observateur'
  ): Promise<ProjectMember> {
    const { data, error } = await supabase
      .from('projet_membres')
      .update({ role: newRole })
      .eq('projet_id', projectId)
      .eq('utilisateur_id', userId)
      .select(`
        *,
        utilisateur:users!projet_membres_utilisateur_id_fkey (
          id,
          nom,
          prenom,
          email,
          fonction,
          departement,
          role,
          created_at
        )
      `)
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du rôle du membre:', error);
      throw error;
    }

    return {
      id: data.id,
      projet_id: data.projet_id,
      utilisateur_id: data.utilisateur_id,
      role: data.role,
      assigne_le: new Date(data.assigne_le),
      assigne_par: data.assigne_par,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      utilisateur: data.utilisateur ? {
        id: data.utilisateur.id,
        nom: data.utilisateur.nom,
        prenom: data.utilisateur.prenom,
        email: data.utilisateur.email,
        fonction: data.utilisateur.fonction,
        departement: data.utilisateur.departement,
        role: data.utilisateur.role,
        created_at: new Date(data.utilisateur.created_at)
      } : undefined
    };
  }

  /**
   * Vérifie si un utilisateur est membre d'un projet
   */
  static async isProjectMember(projectId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('projet_membres')
      .select('id')
      .eq('projet_id', projectId)
      .eq('utilisateur_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erreur lors de la vérification du membre du projet:', error);
      throw error;
    }

    return !!data;
  }

  /**
   * Vérifie si un membre a des tâches assignées dans un projet
   */
  static async hasAssignedTasks(projectId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('taches')
      .select('id')
      .eq('projet_id', projectId)
      .contains('utilisateurs', [{ id: userId }])
      .limit(1);

    if (error) {
      console.error('Erreur lors de la vérification des tâches assignées:', error);
      throw error;
    }

    return data && data.length > 0;
  }

  /**
   * Récupère tous les utilisateurs disponibles (non membres du projet)
   */
  static async getAvailableUsers(projectId: string): Promise<User[]> {
    // Récupérer tous les utilisateurs
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('nom', { ascending: true });

    if (usersError) {
      console.error('Erreur lors de la récupération des utilisateurs:', usersError);
      throw usersError;
    }

    // Récupérer les membres du projet
    const { data: projectMembers, error: membersError } = await supabase
      .from('projet_membres')
      .select('utilisateur_id')
      .eq('projet_id', projectId);

    if (membersError) {
      console.error('Erreur lors de la récupération des membres du projet:', membersError);
      throw membersError;
    }

    const memberIds = new Set(projectMembers?.map(m => m.utilisateur_id) || []);
    
    // Filtrer les utilisateurs qui ne sont pas membres du projet
    return allUsers
      ?.filter(user => !memberIds.has(user.id))
      .map(user => ({
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        fonction: user.fonction,
        departement: user.departement,
        role: user.role,
        created_at: new Date(user.created_at)
      })) || [];
  }
}
