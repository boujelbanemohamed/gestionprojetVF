import { describe, it, expect } from 'vitest';
import {
  isProjectApproachingDeadline,
  isProjectOverdue,
  getDaysUntilDeadline,
  getAlertMessage,
  getAlertSeverity,
  DEFAULT_ALERT_THRESHOLD
} from '../../utils/alertsConfig';

describe('AlertsConfig', () => {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  describe('isProjectApproachingDeadline', () => {
    it('returns true for projects within threshold', () => {
      expect(isProjectApproachingDeadline(nextWeek, 10)).toBe(true);
      expect(isProjectApproachingDeadline(tomorrow, 5)).toBe(true);
    });

    it('returns false for projects outside threshold', () => {
      expect(isProjectApproachingDeadline(nextWeek, 3)).toBe(false);
      expect(isProjectApproachingDeadline(yesterday, 5)).toBe(false);
    });

    it('returns false for undefined date', () => {
      expect(isProjectApproachingDeadline(undefined, 5)).toBe(false);
    });
  });

  describe('isProjectOverdue', () => {
    it('returns true for overdue projects', () => {
      expect(isProjectOverdue(yesterday)).toBe(true);
    });

    it('returns false for future projects', () => {
      expect(isProjectOverdue(tomorrow)).toBe(false);
    });

    it('returns false for undefined date', () => {
      expect(isProjectOverdue(undefined)).toBe(false);
    });
  });

  describe('getDaysUntilDeadline', () => {
    it('calculates days correctly', () => {
      expect(getDaysUntilDeadline(tomorrow)).toBe(1);
      expect(getDaysUntilDeadline(yesterday)).toBe(-1);
    });

    it('returns null for undefined date', () => {
      expect(getDaysUntilDeadline(undefined)).toBeNull();
    });
  });

  describe('getAlertMessage', () => {
    it('returns correct messages for different scenarios', () => {
      expect(getAlertMessage(1)).toContain('dans 1 jour');
      expect(getAlertMessage(5)).toContain('dans 5 jours');
      expect(getAlertMessage(0)).toContain('aujourd\'hui');
      expect(getAlertMessage(-1)).toContain('dépassement de délai depuis 1 jour');
      expect(getAlertMessage(-5)).toContain('dépassement de délai depuis 5 jours');
    });

    it('returns empty string for null input', () => {
      expect(getAlertMessage(null)).toBe('');
    });
  });

  describe('getAlertSeverity', () => {
    it('returns correct severity levels', () => {
      expect(getAlertSeverity(-1)).toBe('danger');
      expect(getAlertSeverity(1)).toBe('danger');
      expect(getAlertSeverity(3)).toBe('warning');
      expect(getAlertSeverity(10)).toBe('info');
    });
  });
});