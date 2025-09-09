import { describe, it, expect } from 'vitest';
import { getProjectStats, getStatusColor, getStatusText } from '../../utils/calculations';
import { Task } from '../../types';
import { mockUsers } from '../utils/testUtils';

const mockTasks: Task[] = [
  {
    id: '1',
    nom: 'Task 1',
    etat: 'cloturee',
    date_realisation: new Date(),
    projet_id: 'project-1',
    utilisateurs: [mockUsers[0]]
  },
  {
    id: '2',
    nom: 'Task 2',
    etat: 'en_cours',
    date_realisation: new Date(),
    projet_id: 'project-1',
    utilisateurs: [mockUsers[1]]
  },
  {
    id: '3',
    nom: 'Task 3',
    etat: 'non_debutee',
    date_realisation: new Date(),
    projet_id: 'project-1',
    utilisateurs: [mockUsers[0]]
  }
];

describe('Calculations Utils', () => {
  describe('getProjectStats', () => {
    it('calculates project statistics correctly', () => {
      const stats = getProjectStats(mockTasks);
      
      expect(stats.totalTasks).toBe(3);
      expect(stats.completedTasks).toBe(1);
      expect(stats.inProgressTasks).toBe(1);
      expect(stats.notStartedTasks).toBe(1);
      expect(stats.percentage).toBe(50); // (0 + 50 + 100) / 3 = 50
    });

    it('handles empty task array', () => {
      const stats = getProjectStats([]);
      
      expect(stats.totalTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
      expect(stats.inProgressTasks).toBe(0);
      expect(stats.notStartedTasks).toBe(0);
      expect(stats.percentage).toBe(0);
    });
  });

  describe('getStatusColor', () => {
    it('returns correct colors for each status', () => {
      expect(getStatusColor('non_debutee')).toBe('bg-gray-100 text-gray-800');
      expect(getStatusColor('en_cours')).toBe('bg-orange-100 text-orange-800');
      expect(getStatusColor('cloturee')).toBe('bg-green-100 text-green-800');
    });
  });

  describe('getStatusText', () => {
    it('returns correct text for each status', () => {
      expect(getStatusText('non_debutee')).toBe('Non débutée');
      expect(getStatusText('en_cours')).toBe('En cours');
      expect(getStatusText('cloturee')).toBe('Clôturée');
    });
  });
});