import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthUser, User, Department, Project } from '../../types';

// Mock data for tests
export const mockAuthUser: AuthUser = {
  id: 'test-user-1',
  nom: 'Test',
  prenom: 'User',
  email: 'test@example.com',
  departement: 'IT',
  role: 'ADMIN',
  created_at: new Date('2024-01-01')
};

export const mockUsers: User[] = [
  {
    id: 'user-1',
    nom: 'Dupont',
    prenom: 'Marie',
    email: 'marie@example.com',
    departement: 'IT',
    role: 'ADMIN',
    created_at: new Date('2024-01-01')
  },
  {
    id: 'user-2',
    nom: 'Martin',
    prenom: 'Pierre',
    email: 'pierre@example.com',
    departement: 'Design',
    role: 'UTILISATEUR',
    created_at: new Date('2024-01-02')
  }
];

export const mockDepartments: Department[] = [
  {
    id: 'dept-1',
    nom: 'IT',
    created_at: new Date('2024-01-01')
  },
  {
    id: 'dept-2',
    nom: 'Design',
    created_at: new Date('2024-01-01')
  }
];

export const mockProjects: Project[] = [
  {
    id: 'project-1',
    nom: 'Test Project',
    description: 'Test project description',
    departement: 'IT',
    statut: 'actif',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    taches: []
  }
];

// Custom render function with providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, options);

export * from '@testing-library/react';
export { customRender as render };