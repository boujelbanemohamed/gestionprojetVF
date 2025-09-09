import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import TaskModal from '../../components/TaskModal';
import { mockUsers } from '../utils/testUtils';

const mockProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  projectId: 'project-1',
  availableUsers: mockUsers
};

describe('TaskModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<TaskModal {...mockProps} />);
    expect(screen.getByText('Créer une nouvelle tâche')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<TaskModal {...mockProps} />);
    const submitButton = screen.getByText('Créer');
    fireEvent.click(submitButton);
    
    // Should not submit without required fields
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(<TaskModal {...mockProps} />);
    
    // Fill required fields
    const nameInput = screen.getByPlaceholderText('Ex: Développer l\'interface utilisateur');
    fireEvent.change(nameInput, { target: { value: 'Test Task' } });
    
    const dateInput = screen.getByLabelText(/Date de réalisation/);
    fireEvent.change(dateInput, { target: { value: '2024-12-31' } });
    
    // Select a user
    const userCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(userCheckbox);
    
    const submitButton = screen.getByText('Créer');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nom: 'Test Task'
        })
      );
    });
  });

  it('handles file uploads correctly', () => {
    render(<TaskModal {...mockProps} />);
    
    const fileInput = screen.getByLabelText(/Cliquez pour ajouter des fichiers/);
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  it('validates file size and type', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<TaskModal {...mockProps} />);
    
    const fileInput = screen.getByLabelText(/Cliquez pour ajouter des fichiers/);
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('trop volumineux'));
    
    alertSpy.mockRestore();
  });
});