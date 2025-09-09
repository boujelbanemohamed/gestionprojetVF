import { describe, it, expect } from 'vitest';
import { PermissionService } from '../../utils/permissions';
import { AuthUser } from '../../types';

const mockSuperAdmin: AuthUser = {
  id: '1',
  nom: 'Admin',
  prenom: 'Super',
  email: 'admin@example.com',
  departement: 'IT',
  role: 'SUPER_ADMIN',
  created_at: new Date()
};

const mockAdmin: AuthUser = {
  id: '2',
  nom: 'Admin',
  prenom: 'Regular',
  email: 'admin@example.com',
  departement: 'IT',
  role: 'ADMIN',
  created_at: new Date()
};

const mockUser: AuthUser = {
  id: '3',
  nom: 'User',
  prenom: 'Regular',
  email: 'user@example.com',
  departement: 'IT',
  role: 'UTILISATEUR',
  created_at: new Date()
};

describe('PermissionService', () => {
  describe('hasPermission', () => {
    it('grants all permissions to SUPER_ADMIN', () => {
      expect(PermissionService.hasPermission(mockSuperAdmin, 'projects', 'create')).toBe(true);
      expect(PermissionService.hasPermission(mockSuperAdmin, 'members', 'delete')).toBe(true);
      expect(PermissionService.hasPermission(mockSuperAdmin, 'settings', 'manage_permissions')).toBe(true);
    });

    it('grants appropriate permissions to ADMIN', () => {
      expect(PermissionService.hasPermission(mockAdmin, 'projects', 'create')).toBe(true);
      expect(PermissionService.hasPermission(mockAdmin, 'members', 'create')).toBe(true);
      expect(PermissionService.hasPermission(mockAdmin, 'settings', 'manage_permissions')).toBe(false);
    });

    it('restricts permissions for UTILISATEUR', () => {
      expect(PermissionService.hasPermission(mockUser, 'projects', 'create')).toBe(false);
      expect(PermissionService.hasPermission(mockUser, 'members', 'view')).toBe(false);
      expect(PermissionService.hasPermission(mockUser, 'tasks', 'view')).toBe(true);
    });

    it('returns false for null user', () => {
      expect(PermissionService.hasPermission(null, 'projects', 'view')).toBe(false);
    });
  });

  describe('canAccessPage', () => {
    it('allows SUPER_ADMIN to access all pages', () => {
      expect(PermissionService.canAccessPage(mockSuperAdmin, 'dashboard')).toBe(true);
      expect(PermissionService.canAccessPage(mockSuperAdmin, 'members')).toBe(true);
      expect(PermissionService.canAccessPage(mockSuperAdmin, 'settings')).toBe(true);
    });

    it('restricts page access for UTILISATEUR', () => {
      expect(PermissionService.canAccessPage(mockUser, 'dashboard')).toBe(true);
      expect(PermissionService.canAccessPage(mockUser, 'members')).toBe(false);
      expect(PermissionService.canAccessPage(mockUser, 'settings')).toBe(false);
    });
  });

  describe('canManageUser', () => {
    it('allows SUPER_ADMIN to manage everyone', () => {
      expect(PermissionService.canManageUser(mockSuperAdmin, mockAdmin)).toBe(true);
      expect(PermissionService.canManageUser(mockSuperAdmin, mockUser)).toBe(true);
    });

    it('allows ADMIN to manage only regular users', () => {
      expect(PermissionService.canManageUser(mockAdmin, mockUser)).toBe(true);
      expect(PermissionService.canManageUser(mockAdmin, mockSuperAdmin)).toBe(false);
    });

    it('prevents regular users from managing anyone', () => {
      expect(PermissionService.canManageUser(mockUser, mockAdmin)).toBe(false);
      expect(PermissionService.canManageUser(mockUser, mockUser)).toBe(false);
    });
  });
});