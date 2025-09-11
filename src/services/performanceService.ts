import { supabase } from './supabase';
import { Project, User as UserType } from '../types';

export interface UserPerformanceData {
  user: UserType;
  totalTasks: number;
  notStartedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  completionRate: number;
  assignedProjects: number;
  responsibleProjects: number;
  averageTaskCompletionTime: number; // en jours
  lastActivityDate: Date | null;
}

export interface DepartmentPerformanceData {
  department: string;
  userCount: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionRate: number;
  totalProjects: number;
  activeProjects: number;
}

export interface ProjectPerformanceData {
  project: Project;
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    notStartedTasks: number;
    completionRate: number;
  };
  memberCount: number;
  responsibleUser?: UserType;
  budgetUtilization?: number;
  deadlineStatus: 'on_time' | 'at_risk' | 'overdue';
  lastActivityDate: Date | null;
}

export class PerformanceService {
  // Récupérer les performances des utilisateurs
  static async getUserPerformanceData(users: UserType[]): Promise<UserPerformanceData[]> {
    const performanceData: UserPerformanceData[] = [];

    for (const user of users) {
      try {
        // Récupérer toutes les tâches assignées à l'utilisateur
        const { data: userTasks, error: tasksError } = await supabase
          .from('tache_utilisateurs')
          .select(`
            tache_id,
            taches!inner(
              id,
              nom,
              etat,
              date_creation,
              date_realisation,
              date_fin_prevue,
              projet_id,
              projets!inner(
                id,
                nom,
                responsable_id
              )
            )
          `)
          .eq('user_id', user.id);

        if (tasksError) {
          console.error(`Erreur lors de la récupération des tâches pour ${user.nom}:`, tasksError);
          continue;
        }

        const tasks = userTasks?.map(ut => ut.taches) || [];
        
        // Calculer les statistiques
        const totalTasks = tasks.length;
        const notStartedTasks = tasks.filter(t => t.etat === 'non_debutee').length;
        const inProgressTasks = tasks.filter(t => t.etat === 'en_cours').length;
        const completedTasks = tasks.filter(t => t.etat === 'cloturee').length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Projets assignés (où l'utilisateur a des tâches)
        const assignedProjectIds = new Set(tasks.map(t => t.projet_id));
        const assignedProjects = assignedProjectIds.size;

        // Projets dont l'utilisateur est responsable
        const responsibleProjects = tasks.filter(t => t.projets?.responsable_id === user.id).length;

        // Temps moyen de completion (pour les tâches terminées)
        const completedTasksWithDates = tasks.filter(t => 
          t.etat === 'cloturee' && 
          t.date_creation && 
          t.date_realisation
        );
        
        let averageTaskCompletionTime = 0;
        if (completedTasksWithDates.length > 0) {
          const totalDays = completedTasksWithDates.reduce((sum, task) => {
            const start = new Date(task.date_creation);
            const end = new Date(task.date_realisation);
            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          }, 0);
          averageTaskCompletionTime = Math.round(totalDays / completedTasksWithDates.length);
        }

        // Dernière activité
        const lastActivityDate = tasks.length > 0 
          ? new Date(Math.max(...tasks.map(t => new Date(t.date_creation).getTime())))
          : null;

        performanceData.push({
          user,
          totalTasks,
          notStartedTasks,
          inProgressTasks,
          completedTasks,
          completionRate,
          assignedProjects,
          responsibleProjects,
          averageTaskCompletionTime,
          lastActivityDate
        });

      } catch (error) {
        console.error(`Erreur lors du calcul des performances pour ${user.nom}:`, error);
      }
    }

    return performanceData;
  }

  // Récupérer les performances par département
  static async getDepartmentPerformanceData(users: UserType[]): Promise<DepartmentPerformanceData[]> {
    const departments = Array.from(new Set(users.map(u => u.departement))).filter(Boolean);
    const performanceData: DepartmentPerformanceData[] = [];

    for (const department of departments) {
      const deptUsers = users.filter(u => u.departement === department);
      const deptUserIds = deptUsers.map(u => u.id);

      try {
        // Récupérer toutes les tâches des utilisateurs du département
        const { data: deptTasks, error: tasksError } = await supabase
          .from('tache_utilisateurs')
          .select(`
            tache_id,
            taches!inner(
              id,
              etat,
              projet_id,
              projets!inner(
                id,
                statut
              )
            )
          `)
          .in('user_id', deptUserIds);

        if (tasksError) {
          console.error(`Erreur lors de la récupération des tâches pour le département ${department}:`, tasksError);
          continue;
        }

        const tasks = deptTasks?.map(ut => ut.taches) || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.etat === 'cloturee').length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Projets du département
        const projectIds = new Set(tasks.map(t => t.projet_id));
        const totalProjects = projectIds.size;
        const activeProjects = tasks.filter(t => t.projets?.statut === 'actif').length;

        // Taux de completion moyen des utilisateurs
        const userCompletionRates = deptUsers.map(user => {
          const userTasks = tasks.filter(t => 
            deptTasks?.some(ut => ut.user_id === user.id && ut.tache_id === t.id)
          );
          const userCompleted = userTasks.filter(t => t.etat === 'cloturee').length;
          return userTasks.length > 0 ? (userCompleted / userTasks.length) * 100 : 0;
        });
        const averageCompletionRate = userCompletionRates.length > 0 
          ? Math.round(userCompletionRates.reduce((sum, rate) => sum + rate, 0) / userCompletionRates.length)
          : 0;

        performanceData.push({
          department,
          userCount: deptUsers.length,
          totalTasks,
          completedTasks,
          completionRate,
          averageCompletionRate,
          totalProjects,
          activeProjects
        });

      } catch (error) {
        console.error(`Erreur lors du calcul des performances pour le département ${department}:`, error);
      }
    }

    return performanceData;
  }

  // Récupérer les performances des projets
  static async getProjectPerformanceData(projects: Project[], users: UserType[]): Promise<ProjectPerformanceData[]> {
    const performanceData: ProjectPerformanceData[] = [];

    for (const project of projects) {
      try {
        // Récupérer les tâches du projet
        const { data: projectTasks, error: tasksError } = await supabase
          .from('taches')
          .select(`
            id,
            nom,
            etat,
            date_creation,
            date_realisation,
            date_fin_prevue,
            budget_estime,
            budget_reel
          `)
          .eq('projet_id', project.id);

        if (tasksError) {
          console.error(`Erreur lors de la récupération des tâches pour le projet ${project.nom}:`, tasksError);
          continue;
        }

        const tasks = projectTasks || [];
        
        // Calculer les statistiques
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.etat === 'cloturee').length;
        const inProgressTasks = tasks.filter(t => t.etat === 'en_cours').length;
        const notStartedTasks = tasks.filter(t => t.etat === 'non_debutee').length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Récupérer les membres du projet
        const { data: projectMembers, error: membersError } = await supabase
          .from('projet_membres')
          .select('user_id')
          .eq('projet_id', project.id);

        if (membersError) {
          console.error(`Erreur lors de la récupération des membres pour le projet ${project.nom}:`, membersError);
        }

        const memberCount = projectMembers?.length || 0;
        const responsibleUser = project.responsable_id ? users.find(u => u.id === project.responsable_id) : undefined;

        // Utilisation du budget
        let budgetUtilization = 0;
        if (project.budget_initial && tasks.length > 0) {
          const totalBudgetUsed = tasks.reduce((sum, task) => {
            return sum + (task.budget_reel || 0);
          }, 0);
          budgetUtilization = Math.round((totalBudgetUsed / project.budget_initial) * 100);
        }

        // Statut de deadline
        let deadlineStatus: 'on_time' | 'at_risk' | 'overdue' = 'on_time';
        if (project.date_fin) {
          const now = new Date();
          const deadline = new Date(project.date_fin);
          const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDeadline < 0) {
            deadlineStatus = 'overdue';
          } else if (daysUntilDeadline <= 7) {
            deadlineStatus = 'at_risk';
          }
        }

        // Dernière activité
        const lastActivityDate = tasks.length > 0 
          ? new Date(Math.max(...tasks.map(t => new Date(t.date_creation).getTime())))
          : null;

        performanceData.push({
          project,
          stats: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            notStartedTasks,
            completionRate
          },
          memberCount,
          responsibleUser,
          budgetUtilization,
          deadlineStatus,
          lastActivityDate
        });

      } catch (error) {
        console.error(`Erreur lors du calcul des performances pour le projet ${project.nom}:`, error);
      }
    }

    return performanceData;
  }

  // Récupérer toutes les données de performance
  static async getAllPerformanceData(projects: Project[], users: UserType[]) {
    const [userPerformance, departmentPerformance, projectPerformance] = await Promise.all([
      this.getUserPerformanceData(users),
      this.getDepartmentPerformanceData(users),
      this.getProjectPerformanceData(projects, users)
    ]);

    return {
      userPerformance,
      departmentPerformance,
      projectPerformance
    };
  }
}
