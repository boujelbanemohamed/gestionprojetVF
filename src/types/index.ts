export interface User {
  id: string;
  nom: string;
  prenom: string;
  fonction?: string;
  departement: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR';
  mot_de_passe?: string; // Only for creation/update, not stored in state
  created_at: Date;
}

export interface AuthUser {
  id: string;
  nom: string;
  prenom: string;
  fonction?: string;
  departement: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR';
  created_at: Date;
}

export interface ProjetMembre {
  id: string;
  projet_id: string;
  user_id: string;
  role: 'membre' | 'responsable';
  added_by: string;
  added_at: Date;
  user?: User; // User details when loaded
}

export interface ProjectMember {
  id: string;
  projet_id: string;
  user_id: string;
  role: 'membre' | 'responsable';
  added_by: string;
  added_at: Date;
  user: User;
}

export interface CreateProjectMemberData {
  projet_id: string;
  user_id: string;
  role: 'membre' | 'responsable';
  added_by: string;
}

export interface UpdateProjectMemberData {
  role?: 'membre' | 'responsable';
}

export interface CommentAttachment {
  id: string;
  nom: string;
  taille: number;
  type: string;
  url: string;
  uploaded_at: Date;
}

export interface Comment {
  id: string;
  contenu: string;
  auteur: AuthUser;
  created_at: Date;
  task_id: string;
  attachments?: CommentAttachment[];
}

export interface TaskHistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'unassigned' | 'comment_added' | 'comment_deleted' | 'date_changed';
  description: string;
  auteur: AuthUser;
  created_at: Date;
  task_id: string;
  details?: {
    old_value?: any;
    new_value?: any;
    field?: string;
  };
}

export interface ProjectAttachment {
  id: string;
  nom: string;
  taille: number;
  type: string;
  url: string;
  uploaded_at: Date;
  uploaded_by: AuthUser;
}

export interface TaskAttachment {
  id: string;
  nom: string;
  taille: number;
  type: string;
  url: string;
  uploaded_at: Date;
  uploaded_by: AuthUser;
}

export interface Task {
  id: string;
  nom: string;
  description?: string;
  scenario_execution?: string;
  criteres_acceptation?: string;
  etat: 'non_debutee' | 'en_cours' | 'cloturee';
  date_realisation: Date;
  projet_id: string;
  utilisateurs: User[];
  commentaires?: Comment[];
  history?: TaskHistoryEntry[];
  attachments?: TaskAttachment[];
}

export interface Project {
  id: string;
  nom: string;
  type_projet?: string;
  description?: string;
  responsable_id?: string;
  budget_initial?: number;
  devise?: string;
  prestataire_externe?: string;
  nouvelles_fonctionnalites?: string;
  avantages?: string;
  departement?: string;
  date_debut?: Date;
  date_fin?: Date;
  statut: 'actif' | 'cloture';
  date_cloture?: Date;
  cloture_par?: string;
  date_reouverture?: Date;
  reouvert_par?: string;
  created_at: Date;
  updated_at: Date;
  taches: Task[];
  attachments?: ProjectAttachment[];
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  percentage: number;
}

export interface Department {
  id: string;
  nom: string;
  created_at: Date;
}

export interface MemberPerformance {
  user: User;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  completionPercentage: number;
  overdueTasks: number;
  tasks: {
    non_debutee: Task[];
    en_cours: Task[];
    cloturee: Task[];
  };
}

export interface Permission {
  resource: string;
  action: string;
  allowed: boolean;
}

export interface RolePermissions {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR';
  permissions: Permission[];
}
