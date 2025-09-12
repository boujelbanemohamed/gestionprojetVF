import { supabase } from './supabase';
import { Project, User, ProjetMembre } from '../types';
import { handleError, withErrorHandling } from '../utils/errorHandler';
import { mapDateFields, mapDateFieldsArray } from '../utils/dateMapper';
import { TABLES } from '../constants/tables';
import { formatDateToISOString } from '../utils/dateUtils';

export class ProjectService {
  /**
   * Récupérer tous les projets
   */
  static async getProjects(): Promise<Project[]> {
    return withErrorHandling('ProjectService.getProjects', async () => {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select(`
          *,
          departements(nom),
          taches(
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      return mapDateFieldsArray(data, ['created_at', 'updated_at', 'date_debut', 'date_fin', 'date_cloture', 'date_reouverture']).map(project => ({
        id: project.id,
        nom: project.nom,
        description: project.description,
        statut: project.statut,
        type_projet: project.type_projet,
        budget_initial: project.budget_initial,
        devise: project.devise,
        responsable_id: project.responsable_id,
        departement: project.departements?.nom || 'Non assigné',
        date_debut: project.date_debut,
        date_fin: project.date_fin,
        date_cloture: project.date_cloture,
        date_reouverture: project.date_reouverture,
        cloture_par: project.cloture_par,
        reouvert_par: project.reouvert_par,
        created_at: project.created_at,
        updated_at: project.updated_at,
        taches: project.taches.map(task => ({
          id: task.id,
          nom: task.nom,
          description: task.description,
          scenario_execution: task.scenario_execution,
          criteres_acceptation: task.criteres_acceptation,
          etat: task.etat,
          date_realisation: new Date(task.date_realisation),
          projet_id: task.projet_id,
          utilisateurs: task.utilisateurs.map(tu => ({
            id: tu.users.id,
            nom: tu.users.nom,
            prenom: tu.users.prenom,
            email: tu.users.email,
            fonction: tu.users.fonction,
            departement: 'Non assigné', // TODO: Récupérer le département
            role: 'UTILISATEUR',
            created_at: new Date()
          })),
          commentaires: task.commentaires.map(comment => ({
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
        }))
      }));
    });
  }

  /**
   * Récupérer un projet par ID
   */
  static async getProjectById(id: string): Promise<Project | null> {
    return withErrorHandling('ProjectService.getProjectById', async () => {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select(`
          *,
          departements(nom),
          taches(
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
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      const mappedProject = mapDateFields(data, ['created_at', 'updated_at', 'date_debut', 'date_fin', 'date_cloture', 'date_reouverture']);
      return {
        id: mappedProject.id,
        nom: mappedProject.nom,
        description: mappedProject.description,
        statut: mappedProject.statut,
        type_projet: mappedProject.type_projet,
        budget_initial: mappedProject.budget_initial,
        devise: mappedProject.devise,
        responsable_id: mappedProject.responsable_id,
        departement: mappedProject.departements?.nom || 'Non assigné',
        date_debut: mappedProject.date_debut,
        date_fin: mappedProject.date_fin,
        date_cloture: mappedProject.date_cloture,
        date_reouverture: mappedProject.date_reouverture,
        cloture_par: mappedProject.cloture_par,
        reouvert_par: mappedProject.reouvert_par,
        created_at: mappedProject.created_at,
        updated_at: mappedProject.updated_at,
        taches: mappedProject.taches.map(task => ({
          id: task.id,
          nom: task.nom,
          description: task.description,
          scenario_execution: task.scenario_execution,
          criteres_acceptation: task.criteres_acceptation,
          etat: task.etat,
          date_realisation: new Date(task.date_realisation),
          projet_id: task.projet_id,
          utilisateurs: task.utilisateurs.map(tu => ({
            id: tu.users.id,
            nom: tu.users.nom,
            prenom: tu.users.prenom,
            email: tu.users.email,
            fonction: tu.users.fonction,
            departement: 'Non assigné',
            role: 'UTILISATEUR',
            created_at: new Date()
          })),
          commentaires: task.commentaires.map(comment => ({
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
        }))
      };
    });
  }

  /**
   * Créer un nouveau projet
   */
  static async createProject(projectData: {
    nom: string;
    description?: string;
    statut?: string;
    type_projet?: string;
    budget_initial?: number;
    devise?: string;
    responsable_id?: string;
    departement_id?: string;
    date_debut?: Date;
    date_fin?: Date;
  }): Promise<Project> {
    return withErrorHandling('ProjectService.createProject', async () => {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .insert({
          nom: projectData.nom,
          description: projectData.description,
          statut: projectData.statut || 'actif',
          type_projet: projectData.type_projet,
          budget_initial: projectData.budget_initial,
          devise: projectData.devise,
          responsable_id: projectData.responsable_id,
          departement_id: projectData.departement_id,
          date_debut: projectData.date_debut ? formatDateToISOString(projectData.date_debut) : null,
          date_fin: projectData.date_fin ? formatDateToISOString(projectData.date_fin) : null
        })
        .select(`
          *,
          departements(nom)
        `)
        .single();

      if (error) throw error;

      const mappedProject = mapDateFields(data, ['created_at', 'updated_at', 'date_debut', 'date_fin']);
      return {
        id: mappedProject.id,
        nom: mappedProject.nom,
        description: mappedProject.description,
        statut: mappedProject.statut,
        type_projet: mappedProject.type_projet,
        budget_initial: mappedProject.budget_initial,
        devise: mappedProject.devise,
        responsable_id: mappedProject.responsable_id,
        departement: mappedProject.departements?.nom || 'Non assigné',
        date_debut: mappedProject.date_debut,
        date_fin: mappedProject.date_fin,
        date_cloture: mappedProject.date_cloture,
        date_reouverture: mappedProject.date_reouverture,
        cloture_par: mappedProject.cloture_par,
        reouvert_par: mappedProject.reouvert_par,
        created_at: mappedProject.created_at,
        updated_at: mappedProject.updated_at,
        taches: []
      };
    });
  }

  /**
   * Mettre à jour un projet
   */
  static async updateProject(
    id: string, 
    projectData: {
      nom?: string;
      description?: string;
      statut?: string;
      type_projet?: string;
      budget_initial?: number;
      devise?: string;
      responsable_id?: string;
      departement_id?: string;
      date_debut?: Date;
      date_fin?: Date;
      date_cloture?: Date;
      date_reouverture?: Date;
      cloture_par?: string;
      reouvert_par?: string;
    }
  ): Promise<Project> {
    return withErrorHandling('ProjectService.updateProject', async () => {
      const { taches, departement, ...projectDataWithoutTaches } = projectData as any;
      
      let departement_id = projectData.departement_id;
      if (departement && !departement_id) {
        // Si un nom de département est fourni mais pas l'ID, le chercher
        const { data: deptData } = await supabase
          .from(TABLES.DEPARTMENTS)
          .select('id')
          .eq('nom', departement)
          .single();
        departement_id = deptData?.id;
      }

      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .update({
          ...projectDataWithoutTaches,
          departement_id,
          date_debut: projectData.date_debut ? formatDateToISOString(projectData.date_debut) : undefined,
          date_fin: projectData.date_fin ? formatDateToISOString(projectData.date_fin) : undefined,
          date_cloture: projectData.date_cloture ? formatDateToISOString(projectData.date_cloture) : undefined,
          date_reouverture: projectData.date_reouverture ? formatDateToISOString(projectData.date_reouverture) : undefined
        })
        .eq('id', id)
        .select(`
          *,
          departements(nom)
        `)
        .single();

      if (error) throw error;

      const mappedProject = mapDateFields(data, ['created_at', 'updated_at', 'date_debut', 'date_fin', 'date_cloture', 'date_reouverture']);
      return {
        id: mappedProject.id,
        nom: mappedProject.nom,
        description: mappedProject.description,
        statut: mappedProject.statut,
        type_projet: mappedProject.type_projet,
        budget_initial: mappedProject.budget_initial,
        devise: mappedProject.devise,
        responsable_id: mappedProject.responsable_id,
        departement: mappedProject.departements?.nom || 'Non assigné',
        date_debut: mappedProject.date_debut,
        date_fin: mappedProject.date_fin,
        date_cloture: mappedProject.date_cloture,
        date_reouverture: mappedProject.date_reouverture,
        cloture_par: mappedProject.cloture_par,
        reouvert_par: mappedProject.reouvert_par,
        created_at: mappedProject.created_at,
        updated_at: mappedProject.updated_at,
        taches: []
      };
    });
  }

  /**
   * Supprimer un projet
   */
  static async deleteProject(id: string): Promise<void> {
    return withErrorHandling('ProjectService.deleteProject', async () => {
      const { error } = await supabase
        .from(TABLES.PROJECTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
    });
  }

  /**
   * Récupérer les membres d'un projet
   */
  static async getProjectMembers(projectId: string): Promise<ProjetMembre[]> {
    return withErrorHandling('ProjectService.getProjectMembers', async () => {
      const { data, error } = await supabase
        .from(TABLES.PROJECT_MEMBERS)
        .select(`
          *,
          user:users(
            id,
            nom,
            prenom,
            email,
            fonction,
            departement_id,
            role
          )
        `)
        .eq('projet_id', projectId);

      if (error) throw error;

      return data.map(member => ({
        id: member.id,
        projet_id: member.projet_id,
        user_id: member.user_id,
        role: member.role,
        added_by: member.added_by,
        added_at: new Date(member.added_at),
        user: {
          id: member.user.id,
          nom: member.user.nom,
          prenom: member.user.prenom,
          email: member.user.email,
          fonction: member.user.fonction,
          departement: 'Non assigné', // TODO: Récupérer le département
          role: member.user.role,
          created_at: new Date()
        }
      }));
    });
  }

  /**
   * Ajouter un membre à un projet
   */
  static async addProjectMember(
    projectId: string, 
    userId: string, 
    addedBy: string, 
    role: string = 'membre'
  ): Promise<ProjetMembre> {
    return withErrorHandling('ProjectService.addProjectMember', async () => {
      const { data, error } = await supabase
        .from(TABLES.PROJECT_MEMBERS)
        .insert({
          projet_id: projectId,
          user_id: userId,
          role,
          added_by: addedBy
        })
        .select(`
          *,
          user:users(
            id,
            nom,
            prenom,
            email,
            fonction,
            departement_id,
            role
          )
        `)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        projet_id: data.projet_id,
        user_id: data.user_id,
        role: data.role,
        added_by: data.added_by,
        added_at: new Date(data.added_at),
        user: {
          id: data.user.id,
          nom: data.user.nom,
          prenom: data.user.prenom,
          email: data.user.email,
          fonction: data.user.fonction,
          departement: 'Non assigné',
          role: data.user.role,
          created_at: new Date()
        }
      };
    });
  }

  /**
   * Supprimer un membre d'un projet
   */
  static async removeProjectMember(projectId: string, userId: string): Promise<void> {
    return withErrorHandling('ProjectService.removeProjectMember', async () => {
      const { error } = await supabase
        .from(TABLES.PROJECT_MEMBERS)
        .delete()
        .eq('projet_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
    });
  }

  /**
   * Vérifier si un utilisateur a des tâches dans un projet
   */
  static async userHasTasksInProject(projectId: string, userId: string): Promise<boolean> {
    return withErrorHandling('ProjectService.userHasTasksInProject', async () => {
      const { data, error } = await supabase
        .from(TABLES.TASK_USERS)
        .select('id')
        .eq('user_id', userId)
        .in('task_id', 
          supabase
            .from(TABLES.TASKS)
            .select('id')
            .eq('projet_id', projectId)
        )
        .limit(1);

      if (error) throw error;

      return data.length > 0;
    });
  }
}
