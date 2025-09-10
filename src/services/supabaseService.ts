import { supabase } from './supabase';
import { AuthUser, User, Department, Project, Task, Comment } from '../types';
import { MemberController } from './memberController';

export class SupabaseService {
  // Authentication
  static async signUp(email: string, password: string, userData: {
    nom: string;
    prenom: string;
    fonction?: string;
    departement?: string;
    role?: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR';
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (error) throw error;
    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select(`
          *,
          departements(nom)
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
        // Retourner un utilisateur basique si le profil n'existe pas
        return {
          id: user.id,
          nom: user.user_metadata?.nom || 'Utilisateur',
          prenom: user.user_metadata?.prenom || 'Anonyme',
          email: user.email || '',
          fonction: user.user_metadata?.fonction || 'Non défini',
          departement: 'Non assigné',
          role: 'UTILISATEUR',
          created_at: new Date(user.created_at)
        };
      }

      return {
        id: profile.id,
        nom: profile.nom,
        prenom: profile.prenom,
        email: profile.email,
        fonction: profile.fonction,
        departement: profile.departements?.nom || 'Non assigné',
        role: profile.role,
        created_at: new Date(profile.created_at)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du profil utilisateur:', error);
      return null;
    }
  }

  // Departments
  static async getDepartments(): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departements')
      .select('*')
      .order('nom');

    if (error) throw error;

    return data.map(dept => ({
      id: dept.id,
      nom: dept.nom,
      created_at: new Date(dept.created_at)
    }));
  }

  static async createDepartment(nom: string): Promise<Department> {
    const { data, error } = await supabase
      .from('departements')
      .insert({ nom })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nom: data.nom,
      created_at: new Date(data.created_at)
    };
  }

  static async updateDepartment(id: string, nom: string): Promise<Department> {
    const { data, error } = await supabase
      .from('departements')
      .update({ nom })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nom: data.nom,
      created_at: new Date(data.created_at)
    };
  }

  static async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase
      .from('departements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Users
  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        departements(nom)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(user => ({
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      fonction: user.fonction,
      departement: user.departements?.nom || 'Non assigné',
      role: user.role,
      created_at: new Date(user.created_at)
    }));
  }

  static async updateUser(id: string, userData: {
    nom?: string;
    prenom?: string;
    email?: string;
    fonction?: string;
    departement_id?: string;
    role?: string;
  }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select(`
        *,
        departements(nom)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      fonction: data.fonction,
      departement: data.departements?.nom || 'Non assigné',
      role: data.role,
      created_at: new Date(data.created_at)
    };
  }

  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Projects
  static async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projets')
      .select(`
        *,
        departements(nom),
        taches(
          *,
          tache_utilisateurs(
            users(*)
          ),
          commentaires(
            *,
            users(nom, prenom, email, fonction, role)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(project => ({
      id: project.id,
      nom: project.nom,
      type_projet: project.type_projet,
      description: project.description,
      responsable_id: project.responsable_id,
      budget_initial: project.budget_initial,
      devise: project.devise,
      prestataire_externe: project.prestataire_externe,
      nouvelles_fonctionnalites: project.nouvelles_fonctionnalites,
      avantages: project.avantages,
      departement: project.departements?.nom,
      date_debut: project.date_debut ? new Date(project.date_debut) : undefined,
      date_fin: project.date_fin ? new Date(project.date_fin) : undefined,
      statut: project.statut,
      date_cloture: project.date_cloture ? new Date(project.date_cloture) : undefined,
      cloture_par: project.cloture_par,
      date_reouverture: project.date_reouverture ? new Date(project.date_reouverture) : undefined,
      reouvert_par: project.reouvert_par,
      created_at: new Date(project.created_at),
      updated_at: new Date(project.updated_at),
      taches: (project.taches || []).map((task: any) => ({
        id: task.id,
        nom: task.nom,
        description: task.description,
        scenario_execution: task.scenario_execution,
        criteres_acceptation: task.criteres_acceptation,
        etat: task.etat,
        date_realisation: new Date(task.date_realisation),
        projet_id: task.projet_id,
        utilisateurs: (task.tache_utilisateurs || []).map((tu: any) => tu.users).filter(Boolean),
        commentaires: (task.commentaires || []).map((comment: any) => ({
          id: comment.id,
          contenu: comment.contenu,
          auteur: comment.users,
          created_at: new Date(comment.created_at),
          task_id: comment.tache_id
        })),
        history: []
      }))
    }));
  }

  static async createProject(projectData: {
    nom: string;
    type_projet?: string;
    description?: string;
    responsable_id?: string;
    budget_initial?: number;
    devise?: string;
    prestataire_externe?: string;
    nouvelles_fonctionnalites?: string;
    avantages?: string;
    departement_id?: string;
    date_debut?: Date;
    date_fin?: Date;
  }): Promise<Project> {
    const { data, error } = await supabase
      .from('projets')
      .insert({
        ...projectData,
        date_debut: projectData.date_debut?.toISOString().split('T')[0],
        date_fin: projectData.date_fin?.toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;

    // Return the created project with empty tasks array
    return {
      id: data.id,
      nom: data.nom,
      type_projet: data.type_projet,
      description: data.description,
      responsable_id: data.responsable_id,
      budget_initial: data.budget_initial,
      devise: data.devise,
      prestataire_externe: data.prestataire_externe,
      nouvelles_fonctionnalites: data.nouvelles_fonctionnalites,
      avantages: data.avantages,
      departement: undefined, // Will be populated when fetching with join
      date_debut: data.date_debut ? new Date(data.date_debut) : undefined,
      date_fin: data.date_fin ? new Date(data.date_fin) : undefined,
      statut: data.statut,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      taches: []
    };
  }

  static async updateProject(id: string, projectData: any): Promise<Project> {
    const { data, error } = await supabase
      .from('projets')
      .update({
        ...projectData,
        date_debut: projectData.date_debut?.toISOString().split('T')[0],
        date_fin: projectData.date_fin?.toISOString().split('T')[0]
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nom: data.nom,
      type_projet: data.type_projet,
      description: data.description,
      responsable_id: data.responsable_id,
      budget_initial: data.budget_initial,
      devise: data.devise,
      prestataire_externe: data.prestataire_externe,
      nouvelles_fonctionnalites: data.nouvelles_fonctionnalites,
      avantages: data.avantages,
      departement: undefined,
      date_debut: data.date_debut ? new Date(data.date_debut) : undefined,
      date_fin: data.date_fin ? new Date(data.date_fin) : undefined,
      statut: data.statut,
      date_cloture: data.date_cloture ? new Date(data.date_cloture) : undefined,
      cloture_par: data.cloture_par,
      date_reouverture: data.date_reouverture ? new Date(data.date_reouverture) : undefined,
      reouvert_par: data.reouvert_par,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      taches: []
    };
  }

  static async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Tasks
  static async createTask(taskData: {
    nom: string;
    description?: string;
    scenario_execution?: string;
    criteres_acceptation?: string;
    etat?: string;
    date_realisation: Date;
    projet_id: string;
  }): Promise<Task> {
    const { data, error } = await supabase
      .from('taches')
      .insert({
        ...taskData,
        date_realisation: taskData.date_realisation.toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nom: data.nom,
      description: data.description,
      scenario_execution: data.scenario_execution,
      criteres_acceptation: data.criteres_acceptation,
      etat: data.etat,
      date_realisation: new Date(data.date_realisation),
      projet_id: data.projet_id,
      utilisateurs: [],
      commentaires: [],
      history: []
    };
  }

  static async assignUsersToTask(taskId: string, userIds: string[]): Promise<void> {
    // First, remove existing assignments
    await supabase
      .from('tache_utilisateurs')
      .delete()
      .eq('tache_id', taskId);

    // Then add new assignments
    if (userIds.length > 0) {
      const assignments = userIds.map(userId => ({
        tache_id: taskId,
        user_id: userId
      }));

      const { error } = await supabase
        .from('tache_utilisateurs')
        .insert(assignments);

      if (error) throw error;
    }
  }

  static async updateTask(id: string, taskData: any): Promise<Task> {
    const { data, error } = await supabase
      .from('taches')
      .update({
        ...taskData,
        date_realisation: taskData.date_realisation?.toISOString().split('T')[0]
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nom: data.nom,
      description: data.description,
      scenario_execution: data.scenario_execution,
      criteres_acceptation: data.criteres_acceptation,
      etat: data.etat,
      date_realisation: new Date(data.date_realisation),
      projet_id: data.projet_id,
      utilisateurs: [],
      commentaires: [],
      history: []
    };
  }

  static async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('taches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Comments
  static async createComment(commentData: {
    contenu: string;
    tache_id: string;
  }): Promise<Comment> {
    const { data, error } = await supabase
      .from('commentaires')
      .insert({
        ...commentData,
        auteur_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select(`
        *,
        users(nom, prenom, email, fonction, role)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      contenu: data.contenu,
      auteur: data.users,
      created_at: new Date(data.created_at),
      task_id: data.tache_id
    };
  }

  static async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('commentaires')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // File upload
  static async uploadFile(
    bucket: string,
    path: string,
    file: File
  ): Promise<{ url: string; path: string }> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path
    };
  }

  static async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }

  // Real-time subscriptions
  static subscribeToProjects(callback: (payload: any) => void) {
    return supabase
      .channel('projects')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projets' }, 
        callback
      )
      .subscribe();
  }

  static subscribeToTasks(projectId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`tasks-${projectId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'taches',
          filter: `projet_id=eq.${projectId}`
        }, 
        callback
      )
      .subscribe();
  }

  // Test connection
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('departements')
        .select('count')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}