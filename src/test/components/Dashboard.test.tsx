import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../utils/testUtils';
import Dashboard from '../../components/Dashboard';
import { mockAuthUser, mockUsers, mockDepartments, mockProjects } from '../utils/testUtils';

const mockProps = {
  projects: mockProjects,
  departments: mockDepartments,
  availableUsers: mockUsers,
  onCreateProject: vi.fn(),
  onSelectProject: vi.fn(),
  onDeleteProject: vi.fn(),
  onNavigateToClosedProjects: vi.fn(),
  closedProjectsCount: 0,
  currentUser: mockAuthUser
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with correct title', () => {
    render(<Dashboard {...mockProps} />);
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
  });

  it('displays project statistics correctly', () => {
    render(<Dashboard {...mockProps} />);
    expect(screen.getByText('Projets actifs')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Project count
  });

  it('opens create project modal when button is clicked', () => {
    render(<Dashboard {...mockProps} />);
    const createButton = screen.getByText('Nouveau projet');
    fireEvent.click(createButton);
    expect(screen.getByText('Créer un nouveau projet')).toBeInTheDocument();
  });

  it('filters projects by search term', () => {
    render(<Dashboard {...mockProps} />);
    const searchInput = screen.getByPlaceholderText('Rechercher un projet...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('shows PV de Réunion button for authorized users', () => {
    render(<Dashboard {...mockProps} />);
    expect(screen.getByText('PV de Réunion')).toBeInTheDocument();
  });

  it('calls onSelectProject when project card is clicked', () => {
    render(<Dashboard {...mockProps} />);
    const projectCard = screen.getByText('Test Project');
    fireEvent.click(projectCard);
    expect(mockProps.onSelectProject).toHaveBeenCalledWith(mockProjects[0]);
  });
});