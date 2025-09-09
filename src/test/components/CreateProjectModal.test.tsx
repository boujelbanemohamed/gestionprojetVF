import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateProjectModal from '../../components/CreateProjectModal';

const mockDepartments = [
  {
    id: 'dept-1',
    nom: 'IT',
    created_at: new Date('2024-01-01')
  }
];

const mockUsers = [
  {
    id: 'user-1',
    nom: 'Dupont',
    prenom: 'Marie',
    email: 'marie@example.com',
    departement: 'IT',
    role: 'ADMIN' as const,
    created_at: new Date('2024-01-01')
  }
];

const mockProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  departments: mockDepartments,
  availableUsers: mockUsers
};

describe('CreateProjectModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<CreateProjectModal {...mockProps} />);
    expect(screen.getByText('Créer un nouveau projet')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CreateProjectModal {...mockProps} isOpen={false} />);
    expect(screen.queryByText('Créer un nouveau projet')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<CreateProjectModal {...mockProps} />);
    
    // Submit form without filling required fields
    const form = screen.getByRole('form', { name: 'Formulaire de création de projet' });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Le nom du projet est obligatoire')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<CreateProjectModal {...mockProps} />);
    
    const nameInput = screen.getByPlaceholderText('Ex: Refonte du site web');
    fireEvent.change(nameInput, { target: { value: 'Test Project' } });
    
    const submitButton = screen.getByText('Créer');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nom: 'Test Project'
        })
      );
    });
  });

  it('validates date range correctly', async () => {
    render(<CreateProjectModal {...mockProps} />);
    
    const nameInput = screen.getByPlaceholderText('Ex: Refonte du site web');
    fireEvent.change(nameInput, { target: { value: 'Test Project' } });
    
    const startDate = screen.getByLabelText('Date de début');
    const endDate = screen.getByLabelText('Date de fin');
    
    fireEvent.change(startDate, { target: { value: '2024-12-31' } });
    fireEvent.change(endDate, { target: { value: '2024-01-01' } });
    
    const form = screen.getByRole('form', { name: /formulaire de création de projet/i });
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('La date de fin doit être postérieure à la date de début')).toBeInTheDocument();
    });
  });
});