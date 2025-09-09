import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock window.confirm and window.alert
global.confirm = vi.fn(() => true);
global.alert = vi.fn();

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows login modal when not authenticated', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    render(<App />);
    
    // Look for the main login button using test id
    expect(screen.getByTestId('main-login-button')).toBeInTheDocument();
    expect(screen.getByText('Plateforme de Gestion de Projets')).toBeInTheDocument();
  });

  it('shows dashboard when authenticated', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      id: '1',
      nom: 'Test',
      prenom: 'User',
      email: 'test@example.com',
      departement: 'IT',
      role: 'ADMIN',
      created_at: '2024-01-01T00:00:00.000Z'
    }));
    
    render(<App />);
    
    // Look for the main dashboard heading specifically
    expect(screen.getByRole('heading', { level: 1, name: /tableau de bord/i })).toBeInTheDocument();
  });
});