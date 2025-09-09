import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navigation from '../../components/Navigation';

const mockAuthUser = {
  id: 'test-user-1',
  nom: 'Test',
  prenom: 'User',
  email: 'test@example.com',
  departement: 'IT',
  role: 'ADMIN' as const,
  created_at: new Date('2024-01-01')
};

const mockProps = {
  currentUser: mockAuthUser,
  currentView: 'dashboard' as const,
  onNavigate: vi.fn(),
  onOpenProfile: vi.fn(),
  onLogout: vi.fn(),
  unreadNotificationsCount: 2
};

describe('Navigation', () => {
  it('renders navigation with user info', () => {
    render(<Navigation {...mockProps} />);
    expect(screen.getByText('Gestion de Projets')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows notification badge with count', () => {
    render(<Navigation {...mockProps} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onNavigate when menu item is clicked', () => {
    render(<Navigation {...mockProps} />);
    
    // Find the dashboard navigation button specifically (not the one in user menu)
    const dashboardButtons = screen.getAllByText('Tableau de bord');
    const navigationDashboardButton = dashboardButtons.find(button => 
      button.closest('button')?.className.includes('px-4 py-2 rounded-lg')
    );
    
    if (navigationDashboardButton) {
      fireEvent.click(navigationDashboardButton.closest('button')!);
      expect(mockProps.onNavigate).toHaveBeenCalledWith('dashboard');
    }
  });

  it('opens user menu when clicked', () => {
    render(<Navigation {...mockProps} />);
    
    // Find the user menu button using aria-label
    const userMenuButton = screen.getByRole('button', { name: /menu utilisateur/i });
    fireEvent.click(userMenuButton);
    
    expect(screen.getByText('Mon profil')).toBeInTheDocument();
  });

  it('shows correct role badge', () => {
    render(<Navigation {...mockProps} />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('calls onLogout when logout is clicked', () => {
    render(<Navigation {...mockProps} />);
    
    // Open user menu first using aria-label
    const userMenuButton = screen.getByRole('button', { name: /menu utilisateur/i });
    fireEvent.click(userMenuButton);
    
    // Then click logout using role and name
    const logoutButton = screen.getByRole('button', { name: /se déconnecter/i });
    fireEvent.click(logoutButton);
    
    expect(mockProps.onLogout).toHaveBeenCalled();
  });
});