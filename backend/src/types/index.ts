export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  fonction?: string;
  departement_id?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR';
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Department {
  id: string;
  nom: string;
  created_at: Date;
}

export interface Project {
  id: string;
  nom: string;
  description?: string;
  departement_id?: string;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface TaskUser {
  id: string;
  tache_id: string;
  user_id: string;
  created_at: Date;
}

export interface Comment {
  id: string;
  contenu: string;
  tache_id: string;
  auteur_id: string;
  created_at: Date;
}

export interface TaskHistory {
  id: string;
  tache_id: string;
  action: string;
  description: string;
  auteur_id: string;
  details?: any;
  created_at: Date;
}

export interface Attachment {
  id: string;
  nom: string;
  taille: number;
  type: string;
  url: string;
  uploaded_by: string;
  uploaded_at: Date;
}

export interface ProjectAttachment extends Attachment {
  projet_id: string;
}

export interface TaskAttachment extends Attachment {
  tache_id: string;
}

export interface CommentAttachment extends Attachment {
  commentaire_id: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}