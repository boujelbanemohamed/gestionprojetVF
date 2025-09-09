import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';

// Mock localStorage for authentication
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

describe('Project Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock authenticated user
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      id: '1',
      nom: 'Test',
      prenom: 'User',
      email: 'test@example.com',
      departement: 'IT',
      role: 'ADMIN',
      created_at: '2024-01-01T00:00:00.000Z'
    }));
  });

  it('completes full project creation workflow', async () => {
    render(<App />);
    
    // Should show dashboard
    expect(screen.getByRole('heading', { level: 1, name: /tableau de bord/i })).toBeInTheDocument();
    
    // Click create project button
    const createButton = screen.getByRole('button', { name: /nouveau projet/i });
    fireEvent.click(createButton);
    
    // Should open create project modal
    await waitFor(() => {
      expect(screen.getByText('Créer un nouveau projet')).toBeInTheDocument();
    });
    
    // Fill project form
    const nameInput = screen.getByPlaceholderText('Ex: Refonte du site web');
    fireEvent.change(nameInput, { target: { value: 'Test Integration Project' } });
    
    const descriptionInput = screen.getByPlaceholderText(/Décrivez brièvement/);
    fireEvent.change(descriptionInput, { target: { value: 'Test project description' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /créer/i });
    fireEvent.click(submitButton);
    
    // Should close modal and show project in dashboard
    await waitFor(() => {
      expect(screen.queryByText('Créer un nouveau projet')).not.toBeInTheDocument();
    });
  });

  it('handles navigation between different views', async () => {
    render(<App />);
    
    // Navigate to performance page - find the specific navigation button
    const performanceButtons = screen.getAllByText('Performances');
    const navigationPerformanceButton = performanceButtons.find(button => 
      button.closest('button')?.className.includes('px-4 py-2 rounded-lg')
    );
    
    if (navigationPerformanceButton) {
      fireEvent.click(navigationPerformanceButton.closest('button')!);
      
      await waitFor(() => {
        expect(screen.getByText('Tableau de bord des performances')).toBeInTheDocument();
      });
    }
    
    // Navigate back to dashboard
    const backButton = screen.getByRole('button', { name: 'Retour' });
    fireEvent.click(backButton);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /tableau de bord/i })).toBeInTheDocument();
    });
  });
});