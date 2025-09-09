export interface BudgetCategory {
  id: string;
  nom: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  is_system?: boolean; // Catégories système non supprimables
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
  is_system?: boolean; // Permissions système non modifiables
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted: boolean;
  granted_by: string;
  granted_at: Date;
}

export interface GlobalSettings {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: 'budget' | 'permissions' | 'general' | 'notifications';
  updated_at: Date;
  updated_by: string;
}

export interface BudgetCategoryUsage {
  category_id: string;
  project_id: string;
  project_name: string;
  expense_id: string;
  expense_name: string;
  amount: number;
  currency: string;
  date: Date;
}