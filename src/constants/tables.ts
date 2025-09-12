/**
 * Constantes pour les noms de tables Supabase
 */
export const TABLES = {
  USERS: 'users',
  DEPARTMENTS: 'departements',
  PROJECTS: 'projets',
  TASKS: 'taches',
  TASK_USERS: 'task_users',
  COMMENTS: 'commentaires',
  PROJECT_MEMBERS: 'projet_membres',
  PROJECT_EXPENSES: 'projet_depenses',
  PROJECT_ATTACHMENTS: 'projet_pieces_jointes',
  TASK_ATTACHMENTS: 'tache_pieces_jointes',
  MEETING_MINUTES: 'comptes_rendus',
  BUDGET_CATEGORIES: 'rubriques_budgetaires'
} as const;

/**
 * Types pour les noms de tables
 */
export type TableName = typeof TABLES[keyof typeof TABLES];
