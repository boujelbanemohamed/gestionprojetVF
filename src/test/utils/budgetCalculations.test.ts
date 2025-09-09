import { describe, it, expect } from 'vitest';
import {
  calculateBudgetSummary,
  formatCurrency,
  getExchangeRate,
  convertAmount,
  getBudgetStatusColor,
  getBudgetProgressColor
} from '../../utils/budgetCalculations';

interface ProjectExpense {
  id: string;
  projet_id: string;
  date_depense: Date;
  intitule: string;
  montant: number;
  devise: string;
  taux_conversion?: number;
  montant_converti?: number;
  rubrique?: string;
  piece_jointe_url?: string;
  piece_jointe_nom?: string;
  piece_jointe_type?: string;
  piece_jointe_taille?: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

const mockExpenses: ProjectExpense[] = [
  {
    id: '1',
    projet_id: 'project-1',
    date_depense: new Date('2024-01-01'),
    intitule: 'Test expense',
    montant: 1000,
    devise: 'EUR',
    created_by: 'user-1',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    projet_id: 'project-1',
    date_depense: new Date('2024-01-02'),
    intitule: 'Test expense 2',
    montant: 500,
    devise: 'USD',
    taux_conversion: 0.92,
    montant_converti: 460,
    created_by: 'user-1',
    created_at: new Date(),
    updated_at: new Date()
  }
];

describe('BudgetCalculations', () => {
  describe('calculateBudgetSummary', () => {
    it('calculates budget summary correctly', () => {
      const summary = calculateBudgetSummary(2000, 'EUR', mockExpenses);
      
      expect(summary.budget_initial).toBe(2000);
      expect(summary.devise_budget).toBe('EUR');
      expect(summary.total_depenses).toBe(1460); // 1000 + 460
      expect(summary.montant_restant).toBe(540);
      expect(summary.pourcentage_consommation).toBe(73);
      expect(summary.statut_budgetaire).toBe('warning');
    });

    it('handles empty expenses', () => {
      const summary = calculateBudgetSummary(1000, 'EUR', []);
      
      expect(summary.total_depenses).toBe(0);
      expect(summary.montant_restant).toBe(1000);
      expect(summary.pourcentage_consommation).toBe(0);
      expect(summary.statut_budgetaire).toBe('success');
    });

    it('handles budget overrun', () => {
      const summary = calculateBudgetSummary(1000, 'EUR', mockExpenses);
      
      expect(summary.montant_restant).toBeLessThan(0);
      expect(summary.pourcentage_consommation).toBeGreaterThan(100);
      expect(summary.statut_budgetaire).toBe('danger');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      // Handle narrow no-break space used by French locale
      expect(formatCurrency(1000, 'EUR').replace(/\u202f/g, ' ')).toBe('1 000,00 €');
      expect(formatCurrency(1234.56, 'USD').replace(/\u202f/g, ' ')).toBe('1 234,56 $');
    });
  });

  describe('getExchangeRate', () => {
    it('returns 1 for same currency', () => {
      expect(getExchangeRate('EUR', 'EUR')).toBe(1);
    });

    it('returns correct rate for different currencies', () => {
      const rate = getExchangeRate('EUR', 'USD');
      expect(rate).toBeGreaterThan(0);
    });
  });

  describe('convertAmount', () => {
    it('converts amounts correctly', () => {
      const converted = convertAmount(100, 'EUR', 'USD');
      expect(converted).toBeGreaterThan(0);
    });

    it('returns same amount for same currency', () => {
      expect(convertAmount(100, 'EUR', 'EUR')).toBe(100);
    });
  });

  describe('getBudgetStatusColor', () => {
    it('returns correct colors for each status', () => {
      expect(getBudgetStatusColor('success')).toContain('green');
      expect(getBudgetStatusColor('warning')).toContain('orange');
      expect(getBudgetStatusColor('danger')).toContain('red');
    });
  });

  describe('getBudgetProgressColor', () => {
    it('returns correct colors based on percentage', () => {
      expect(getBudgetProgressColor(50)).toBe('bg-green-500');
      expect(getBudgetProgressColor(80)).toBe('bg-orange-500');
      expect(getBudgetProgressColor(95)).toBe('bg-red-500');
    });
  });
});