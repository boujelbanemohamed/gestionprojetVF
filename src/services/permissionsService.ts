import { AuthUser } from '../types';

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
  is_system?: boolean;
}

interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted: boolean;
  granted_by: string;
  granted_at: Date;
}

// Mock service for permissions management
export class PermissionsService {
  private static readonly PERMISSIONS_KEY = 'app_permissions';
  private static readonly USER_PERMISSIONS_KEY = 'user_permissions';

  // System permissions that define all available actions
  private static readonly SYSTEM_PERMISSIONS: Permission[] = [
    // Dashboard
    { id: 'dashboard_view', resource: 'dashboard', action: 'view', description: 'Accéder au tableau de bord', is_system: true },
    
    // Projects
    { id: 'projects_view', resource: 'projects', action: 'view', description: 'Voir les projets', is_system: true },
    { id: 'projects_create', resource: 'projects', action: 'create', description: 'Créer des projets', is_system: true },
    { id: 'projects_edit', resource: 'projects', action: 'edit', description: 'Modifier les projets', is_system: true },
    { id: 'projects_delete', resource: 'projects', action: 'delete', description: 'Supprimer les projets', is_system: true },
    { id: 'projects_export', resource: 'projects', action: 'export', description: 'Exporter les projets', is_system: true },
    
    // Tasks
    { id: 'tasks_view', resource: 'tasks', action: 'view', description: 'Voir les tâches', is_system: true },
    { id: 'tasks_create', resource: 'tasks', action: 'create', description: 'Créer des tâches', is_system: true },
    { id: 'tasks_edit', resource: 'tasks', action: 'edit', description: 'Modifier les tâches', is_system: true },
    { id: 'tasks_delete', resource: 'tasks', action: 'delete', description: 'Supprimer les tâches', is_system: true },
    { id: 'tasks_assign', resource: 'tasks', action: 'assign', description: 'Assigner des tâches', is_system: true },
    
    // Members
    { id: 'members_view', resource: 'members', action: 'view', description: 'Voir les membres', is_system: true },
    { id: 'members_create', resource: 'members', action: 'create', description: 'Créer des membres', is_system: true },
    { id: 'members_edit', resource: 'members', action: 'edit', description: 'Modifier les membres', is_system: true },
    { id: 'members_delete', resource: 'members', action: 'delete', description: 'Supprimer les membres', is_system: true },
    { id: 'members_roles', resource: 'members', action: 'manage_roles', description: 'Gérer les rôles', is_system: true },
    
    // Departments
    { id: 'departments_view', resource: 'departments', action: 'view', description: 'Voir les départements', is_system: true },
    { id: 'departments_create', resource: 'departments', action: 'create', description: 'Créer des départements', is_system: true },
    { id: 'departments_edit', resource: 'departments', action: 'edit', description: 'Modifier les départements', is_system: true },
    { id: 'departments_delete', resource: 'departments', action: 'delete', description: 'Supprimer les départements', is_system: true },
    
    // Performance
    { id: 'performance_view', resource: 'performance', action: 'view', description: 'Voir les performances', is_system: true },
    
    // Budget
    { id: 'budget_view', resource: 'budget', action: 'view', description: 'Voir les budgets', is_system: true },
    { id: 'budget_manage', resource: 'budget', action: 'manage', description: 'Gérer les budgets', is_system: true },
    { id: 'budget_categories', resource: 'budget', action: 'manage_categories', description: 'Gérer les catégories budgétaires', is_system: true },
    
    // Settings
    { id: 'settings_view', resource: 'settings', action: 'view', description: 'Accéder aux paramètres', is_system: true },
    { id: 'settings_permissions', resource: 'settings', action: 'manage_permissions', description: 'Gérer les droits d\'accès', is_system: true },
    
    // Comments
    { id: 'comments_view', resource: 'comments', action: 'view', description: 'Voir les commentaires', is_system: true },
    { id: 'comments_create', resource: 'comments', action: 'create', description: 'Créer des commentaires', is_system: true },
    { id: 'comments_delete', resource: 'comments', action: 'delete', description: 'Supprimer les commentaires', is_system: true },
    
    // Attachments
    { id: 'attachments_view', resource: 'attachments', action: 'view', description: 'Voir les pièces jointes', is_system: true },
    { id: 'attachments_upload', resource: 'attachments', action: 'upload', description: 'Télécharger des fichiers', is_system: true },
    { id: 'attachments_delete', resource: 'attachments', action: 'delete', description: 'Supprimer des fichiers', is_system: true }
  ];

  static getAllPermissions(): Permission[] {
    return this.SYSTEM_PERMISSIONS;
  }

  static getUserPermissions(userId: string): UserPermission[] {
    const stored = localStorage.getItem(`${this.USER_PERMISSIONS_KEY}_${userId}`);
    if (stored) {
      try {
        const permissions = JSON.parse(stored);
        return permissions.map((perm: any) => ({
          ...perm,
          granted_at: new Date(perm.granted_at)
        }));
      } catch {
        return [];
      }
    }
    return [];
  }

  static hasPermission(user: AuthUser | null, resource: string, action: string): boolean {
    if (!user) return false;
    
    // Super Admin has all permissions
    if (user.role === 'SUPER_ADMIN') return true;

    // Check role-based permissions first (existing logic)
    const rolePermissions = this.getRolePermissions(user.role);
    const hasRolePermission = rolePermissions.some(perm => 
      perm.resource === resource && perm.action === action
    );

    if (hasRolePermission) return true;

    // Check custom user permissions
    const userPermissions = this.getUserPermissions(user.id);
    const permission = this.SYSTEM_PERMISSIONS.find(p => 
      p.resource === resource && p.action === action
    );

    if (!permission) return false;

    const userPermission = userPermissions.find(up => 
      up.permission_id === permission.id
    );

    return userPermission?.granted || false;
  }

  static grantPermission(userId: string, permissionId: string, grantedBy: string): void {
    const userPermissions = this.getUserPermissions(userId);
    const existingIndex = userPermissions.findIndex(up => up.permission_id === permissionId);

    const newPermission: UserPermission = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      permission_id: permissionId,
      granted: true,
      granted_by: grantedBy,
      granted_at: new Date()
    };

    if (existingIndex >= 0) {
      userPermissions[existingIndex] = newPermission;
    } else {
      userPermissions.push(newPermission);
    }

    localStorage.setItem(`${this.USER_PERMISSIONS_KEY}_${userId}`, JSON.stringify(userPermissions));
  }

  static revokePermission(userId: string, permissionId: string, revokedBy: string): void {
    const userPermissions = this.getUserPermissions(userId);
    const existingIndex = userPermissions.findIndex(up => up.permission_id === permissionId);

    if (existingIndex >= 0) {
      const revokedPermission: UserPermission = {
        ...userPermissions[existingIndex],
        granted: false,
        granted_by: revokedBy,
        granted_at: new Date()
      };
      
      userPermissions[existingIndex] = revokedPermission;
      localStorage.setItem(`${this.USER_PERMISSIONS_KEY}_${userId}`, JSON.stringify(userPermissions));
    }
  }

  static getUserEffectivePermissions(user: AuthUser): Permission[] {
    const rolePermissions = this.getRolePermissions(user.role);
    const userPermissions = this.getUserPermissions(user.id);
    const effectivePermissions: Permission[] = [];

    // Add all system permissions and check if user has them
    this.SYSTEM_PERMISSIONS.forEach(permission => {
      const hasRolePermission = rolePermissions.some(rp => 
        rp.resource === permission.resource && rp.action === permission.action
      );

      const userPermission = userPermissions.find(up => 
        up.permission_id === permission.id
      );

      const hasPermission = hasRolePermission || (userPermission?.granted || false);

      if (hasPermission) {
        effectivePermissions.push(permission);
      }
    });

    return effectivePermissions;
  }

  private static getRolePermissions(role: string): { resource: string; action: string }[] {
    // This mirrors the existing role-based permissions from permissions.ts
    switch (role) {
      case 'SUPER_ADMIN':
        return this.SYSTEM_PERMISSIONS.map(p => ({ resource: p.resource, action: p.action }));
      
      case 'ADMIN':
        return this.SYSTEM_PERMISSIONS
          .filter(p => !(p.resource === 'members' && p.action === 'manage_roles'))
          .filter(p => !(p.resource === 'settings' && p.action === 'manage_permissions'))
          .map(p => ({ resource: p.resource, action: p.action }));
      
      case 'UTILISATEUR':
        return [
          { resource: 'dashboard', action: 'view' },
          { resource: 'projects', action: 'view' },
          { resource: 'tasks', action: 'view' },
          { resource: 'tasks', action: 'create' },
          { resource: 'tasks', action: 'edit' },
          { resource: 'comments', action: 'view' },
          { resource: 'comments', action: 'create' },
          { resource: 'attachments', action: 'view' },
          { resource: 'attachments', action: 'upload' },
          { resource: 'budget', action: 'view' }
        ];
      
      default:
        return [];
    }
  }
}