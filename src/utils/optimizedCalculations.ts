import { Task, ProjectStats, Project, User } from '../types';
import { memoize } from './performance';

// Optimized calculations with memoization
export const calculateProjectProgressOptimized = memoize((tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  
  const totalPoints = tasks.reduce((sum, task) => {
    switch (task.etat) {
      case 'non_debutee': return sum + 0;
      case 'en_cours': return sum + 50;
      case 'cloturee': return sum + 100;
      default: return sum;
    }
  }, 0);
  
  return Math.round(totalPoints / tasks.length);
});

export const getProjectStatsOptimized = memoize((tasks: Task[]): ProjectStats => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.etat === 'cloturee').length;
  const inProgressTasks = tasks.filter(t => t.etat === 'en_cours').length;
  const notStartedTasks = tasks.filter(t => t.etat === 'non_debutee').length;
  
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    notStartedTasks,
    percentage: calculateProjectProgressOptimized(tasks)
  };
});

// Optimized project filtering
export const filterProjectsByUserOptimized = memoize((
  projects: Project[],
  userId: string,
  userRole: string
): Project[] => {
  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
    return projects;
  }
  
  return projects.filter(project => 
    (project.taches || []).some(task => 
      task.utilisateurs.some(user => user.id === userId)
    )
  );
});

// Optimized member performance calculation
export const calculateMemberPerformanceOptimized = memoize((
  projects: Project[],
  userId: string
): {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  completionRate: number;
  assignedProjects: number;
} => {
  const userTasks = projects.flatMap(project => 
    (project.taches || []).filter(task => 
      task.utilisateurs.some(u => u.id === userId)
    )
  );

  const assignedProjects = projects.filter(project => 
    (project.taches || []).some(task => 
      task.utilisateurs.some(u => u.id === userId)
    )
  ).length;

  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter(task => task.etat === 'cloturee').length;
  const inProgressTasks = userTasks.filter(task => task.etat === 'en_cours').length;
  const notStartedTasks = userTasks.filter(task => task.etat === 'non_debutee').length;

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    notStartedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    assignedProjects
  };
});

// Optimized search functionality
export const searchProjectsOptimized = memoize((
  projects: Project[],
  searchTerm: string
): Project[] => {
  if (!searchTerm.trim()) return projects;
  
  const term = searchTerm.toLowerCase();
  
  return projects.filter(project => 
    project.nom.toLowerCase().includes(term) ||
    (project.description && project.description.toLowerCase().includes(term)) ||
    (project.departement && project.departement.toLowerCase().includes(term)) ||
    (project.taches || []).some(task => 
      task.nom.toLowerCase().includes(term) ||
      (task.description && task.description.toLowerCase().includes(term))
    )
  );
});

// Optimized department statistics
export const calculateDepartmentStatsOptimized = memoize((
  projects: Project[],
  users: User[],
  departmentName: string
): {
  userCount: number;
  projectCount: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
} => {
  const departmentUsers = users.filter(u => u.departement === departmentName);
  const departmentProjects = projects.filter(p => p.departement === departmentName);
  
  const totalTasks = departmentProjects.reduce((sum, project) => 
    sum + (project.taches || []).length, 0
  );
  
  const completedTasks = departmentProjects.reduce((sum, project) => 
    sum + (project.taches || []).filter(task => task.etat === 'cloturee').length, 0
  );

  return {
    userCount: departmentUsers.length,
    projectCount: departmentProjects.length,
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  };
});

// Cache invalidation helpers
export const invalidateProjectCache = (projectId: string): void => {
  // In a real implementation, this would clear specific cache entries
  console.log(`Invalidating cache for project ${projectId}`);
};

export const invalidateUserCache = (userId: string): void => {
  console.log(`Invalidating cache for user ${userId}`);
};