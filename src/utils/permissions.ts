import { AuthUser, RolePermissions } from '../types';

export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'SUPER_ADMIN',
    permissions: [
      { resource: 'dashboard', action: 'view', allowed: true },
      { resource: 'performance', action: 'view', allowed: true },
      { resource: 'departments', action: 'view', allowed: true },
      { resource: 'departments', action: 'create', allowed: true },
      { resource: 'departments', action: 'edit', allowed: true },
      { resource: 'departments', action: 'delete', allowed: true },
      { resource: 'members', action: 'view', allowed: true },
      { resource: 'members', action: 'create', allowed: true },
      { resource: 'members', action: 'edit', allowed: true },
      { resource: 'members', action: 'delete', allowed: true },
      { resource: 'members', action: 'manage_roles', allowed: true },
      { resource: 'projects', action: 'view', allowed: true },
      { resource: 'projects', action: 'create', allowed: true },
      { resource: 'projects', action: 'edit', allowed: true },
      { resource: 'projects', action: 'delete', allowed: true },
      { resource: 'tasks', action: 'view', allowed: true },
      { resource: 'tasks', action: 'create', allowed: true },
      { resource: 'tasks', action: 'edit', allowed: true },
      { resource: 'tasks', action: 'delete', allowed: true },
      { resource: 'comments', action: 'view', allowed: true },
      { resource: 'comments', action: 'create', allowed: true },
      { resource: 'comments', action: 'delete', allowed: true },
      { resource: 'attachments', action: 'view', allowed: true },
      { resource: 'attachments', action: 'upload', allowed: true },
      { resource: 'attachments', action: 'delete', allowed: true },
      { resource: 'settings', action: 'view', allowed: true },
      { resource: 'budget', action: 'manage_categories', allowed: true },
      { resource: 'settings', action: 'manage_permissions', allowed: true },
      { resource: 'meeting-minutes', action: 'view', allowed: true },
      { resource: 'meeting-minutes', action: 'create', allowed: true },
      { resource: 'meeting-minutes', action: 'edit', allowed: true },
      { resource: 'meeting-minutes', action: 'delete', allowed: true },
    ]
  },
  {
    role: 'ADMIN',
    permissions: [
      { resource: 'dashboard', action: 'view', allowed: true },
      { resource: 'performance', action: 'view', allowed: true },
      { resource: 'departments', action: 'view', allowed: true },
      { resource: 'departments', action: 'create', allowed: true },
      { resource: 'departments', action: 'edit', allowed: true },
      { resource: 'departments', action: 'delete', allowed: true },
      { resource: 'members', action: 'view', allowed: true },
      { resource: 'members', action: 'create', allowed: true },
      { resource: 'members', action: 'edit', allowed: true },
      { resource: 'members', action: 'delete', allowed: true },
      { resource: 'members', action: 'manage_roles', allowed: false },
      { resource: 'projects', action: 'view', allowed: true },
      { resource: 'projects', action: 'create', allowed: true },
      { resource: 'projects', action: 'edit', allowed: true },
      { resource: 'projects', action: 'delete', allowed: true },
      { resource: 'tasks', action: 'view', allowed: true },
      { resource: 'tasks', action: 'create', allowed: true },
      { resource: 'tasks', action: 'edit', allowed: true },
      { resource: 'tasks', action: 'delete', allowed: true },
      { resource: 'comments', action: 'view', allowed: true },
      { resource: 'comments', action: 'create', allowed: true },
      { resource: 'comments', action: 'delete', allowed: true },
      { resource: 'attachments', action: 'view', allowed: true },
      { resource: 'attachments', action: 'upload', allowed: true },
      { resource: 'attachments', action: 'delete', allowed: true },
      { resource: 'settings', action: 'view', allowed: true },
      { resource: 'budget', action: 'manage_categories', allowed: true },
      { resource: 'settings', action: 'manage_permissions', allowed: false },
      { resource: 'meeting-minutes', action: 'view', allowed: true },
      { resource: 'meeting-minutes', action: 'create', allowed: true },
      { resource: 'meeting-minutes', action: 'edit', allowed: true },
      { resource: 'meeting-minutes', action: 'delete', allowed: true },
    ]
  },
  {
    role: 'UTILISATEUR',
    permissions: [
      { resource: 'dashboard', action: 'view', allowed: true },
      { resource: 'performance', action: 'view', allowed: true },
      { resource: 'departments', action: 'view', allowed: false },
      { resource: 'departments', action: 'create', allowed: false },
      { resource: 'departments', action: 'edit', allowed: false },
      { resource: 'departments', action: 'delete', allowed: false },
      { resource: 'members', action: 'view', allowed: false },
      { resource: 'members', action: 'create', allowed: false },
      { resource: 'members', action: 'edit', allowed: false },
      { resource: 'members', action: 'delete', allowed: false },
      { resource: 'members', action: 'manage_roles', allowed: false },
      { resource: 'projects', action: 'view', allowed: true }, // Filtered to assigned projects
      { resource: 'projects', action: 'create', allowed: false },
      { resource: 'projects', action: 'edit', allowed: false },
      { resource: 'projects', action: 'delete', allowed: false },
      { resource: 'tasks', action: 'view', allowed: true }, // Only on assigned projects
      { resource: 'tasks', action: 'create', allowed: true }, // Only on assigned projects
      { resource: 'tasks', action: 'edit', allowed: true }, // Only on assigned projects
      { resource: 'tasks', action: 'delete', allowed: false },
      { resource: 'comments', action: 'view', allowed: true },
      { resource: 'comments', action: 'create', allowed: true },
      { resource: 'comments', action: 'delete', allowed: false },
      { resource: 'attachments', action: 'view', allowed: true },
      { resource: 'attachments', action: 'upload', allowed: true },
      { resource: 'attachments', action: 'delete', allowed: false },
      { resource: 'settings', action: 'view', allowed: false },
      { resource: 'budget', action: 'manage_categories', allowed: false },
      { resource: 'settings', action: 'manage_permissions', allowed: false },
      { resource: 'meeting-minutes', action: 'view', allowed: true }, // Lecture seule
      { resource: 'meeting-minutes', action: 'create', allowed: false },
      { resource: 'meeting-minutes', action: 'edit', allowed: false },
      { resource: 'meeting-minutes', action: 'delete', allowed: false },
    ]
  }
];

export class PermissionService {
  static hasPermission(user: AuthUser | null, resource: string, action: string): boolean {
    console.log(`PermissionService.hasPermission - user:`, user);
    console.log(`PermissionService.hasPermission - resource:`, resource, 'action:', action);
    
    if (!user) {
      console.log('PermissionService.hasPermission - no user, returning false');
      return false;
    }
    
    const rolePermissions = ROLE_PERMISSIONS.find(rp => rp.role === user.role);
    console.log(`PermissionService.hasPermission - rolePermissions for ${user.role}:`, rolePermissions);
    
    if (!rolePermissions) {
      console.log('PermissionService.hasPermission - no role permissions found, returning false');
      return false;
    }
    
    const permission = rolePermissions.permissions.find(p => 
      p.resource === resource && p.action === action
    );
    
    console.log(`PermissionService.hasPermission - permission found:`, permission);
    const result = permission?.allowed || false;
    console.log(`PermissionService.hasPermission - result:`, result);
    
    return result;
  }
  
  static canAccessPage(user: AuthUser | null, page: string): boolean {
    console.log(`PermissionService.canAccessPage - user:`, user);
    console.log(`PermissionService.canAccessPage - page:`, page);
    
    if (!user) {
      console.log('PermissionService.canAccessPage - no user, returning false');
      return false;
    }
    
    const result = (() => {
      switch (page) {
        case 'dashboard':
          return this.hasPermission(user, 'dashboard', 'view');
        case 'performance':
          return this.hasPermission(user, 'performance', 'view');
        case 'members':
          return this.hasPermission(user, 'members', 'view');
        case 'departments':
          return this.hasPermission(user, 'departments', 'view');
        case 'closed-projects':
          return this.hasPermission(user, 'projects', 'view');
        case 'settings':
        case 'settings-general':
        case 'settings-budget':
        case 'settings-permissions':
          return this.hasPermission(user, 'settings', 'view');
        case 'meeting-minutes':
          return this.hasPermission(user, 'meeting-minutes', 'view');
        default:
          return false;
      }
    })();
    
    console.log(`PermissionService.canAccessPage - result for ${page}:`, result);
    return result;
  }
  
  static getAccessibleProjects(user: AuthUser | null, allProjects: any[]): any[] {
    if (!user) return [];
    
    // Super Admin and Admin can see all projects
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return allProjects;
    }
    
    // Regular users can only see projects they're assigned to
    return allProjects.filter(project => 
      project.taches.some((task: any) => 
        task.utilisateurs.some((taskUser: any) => taskUser.id === user.id)
      ) || project.responsable_id === user.id
    );
  }
  
  static canManageUser(currentUser: AuthUser | null, targetUser: any): boolean {
    if (!currentUser) return false;
    
    // Super Admin can manage everyone
    if (currentUser.role === 'SUPER_ADMIN') return true;
    
    // Admin can manage regular users but not other admins or super admins
    if (currentUser.role === 'ADMIN') {
      return targetUser.role === 'UTILISATEUR';
    }
    
    // Regular users can't manage anyone
    return false;
  }
  
  static canChangeRole(currentUser: AuthUser | null): boolean {
    return this.hasPermission(currentUser, 'members', 'manage_roles');
  }
}

export function checkCanCloseProject(project: any, currentUser: any): boolean {
  // Check if user has permission to close projects
  if (!currentUser) return false;
  
  // Only Super Admin and Admin can close projects
  if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
    return false;
  }
  
  // Check if all tasks are completed
  const allTasksCompleted = project.taches.every((task: any) => task.etat === 'cloturee');
  
  return allTasksCompleted;
}

export function checkCanReopenProject(project: any, currentUser: any): boolean {
  // Check if user has permission to reopen projects
  if (!currentUser) return false;
  
  // Super Admin can reopen any project
  if (currentUser.role === 'SUPER_ADMIN') {
    return true;
  }
  
  // Admin can reopen projects from their department
  if (currentUser.role === 'ADMIN') {
    return project.departement === currentUser.departement;
  }
  
  // Regular users cannot reopen projects
  return false;
}