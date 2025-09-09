import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../utils/testUtils';
import ProjectCard from '../../components/ProjectCard';
import { mockProjects } from '../utils/testUtils';

const mockProps = {
  project: mockProjects[0],
  onClick: vi.fn(),
  onDelete: vi.fn()
};

describe('ProjectCard', () => {
  it('renders project information correctly', () => {
    render(<ProjectCard {...mockProps} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test project description')).toBeInTheDocument();
    expect(screen.getByText('IT')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(<ProjectCard {...mockProps} />);
    const card = screen.getByText('Test Project').closest('div');
    fireEvent.click(card!);
    expect(mockProps.onClick).toHaveBeenCalled();
  });

  it('shows progress bar with correct percentage', () => {
    render(<ProjectCard {...mockProps} />);
    expect(screen.getByText('0%')).toBeInTheDocument(); // No tasks = 0%
  });

  it('displays creation date', () => {
    render(<ProjectCard {...mockProps} />);
    expect(screen.getByText(/Créé le/)).toBeInTheDocument();
  });
});