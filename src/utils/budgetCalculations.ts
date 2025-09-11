interface Currency {
  code: string;
  name: string;
  symbol: string;
}

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

export interface BudgetSummary {
  budget_initial: number;
  devise_budget: string;
  total_depenses: number;
  montant_restant: number;
  pourcentage_consommation: number;
  statut_budgetaire: 'success' | 'warning' | 'danger';
}

export const CURRENCIES: Currency[] = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dollar américain', symbol: '$' },
  { code: 'GBP', name: 'Livre sterling', symbol: '£' },
  { code: 'JPY', name: 'Yen japonais', symbol: '¥' },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'C$' },
  { code: 'CHF', name: 'Franc suisse', symbol: 'CHF' },
  { code: 'AUD', name: 'Dollar australien', symbol: 'A$' },
  { code: 'TND', name: 'Dinar tunisien', symbol: 'د.ت' },
];

// Mock exchange rates - in a real app, these would come from an API
export const MOCK_EXCHANGE_RATES: Record<string, Record<string, number>> = {
  'EUR': {
    'USD': 1.09,
    'GBP': 0.85,
    'JPY': 160.5,
    'CAD': 1.47,
    'CHF': 0.97,
    'AUD': 1.63,
    'TND': 3.38,
  },
  'USD': {
    'EUR': 0.92,
    'GBP': 0.78,
    'JPY': 147.5,
    'CAD': 1.35,
    'CHF': 0.89,
    'AUD': 1.50,
    'TND': 3.10,
  },
  'TND': {
    'EUR': 0.296,
    'USD': 0.323,
    'GBP': 0.252,
    'JPY': 47.5,
    'CAD': 0.436,
    'CHF': 0.287,
    'AUD': 0.485,
  }
};

export const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return 1;
  
  const rate = MOCK_EXCHANGE_RATES[fromCurrency]?.[toCurrency];
  if (rate) return rate;
  
  // Try reverse rate
  const reverseRate = MOCK_EXCHANGE_RATES[toCurrency]?.[fromCurrency];
  if (reverseRate) return 1 / reverseRate;
  
  return 1; // Fallback
};

export const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
  const rate = getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
};

export const calculateBudgetSummary = (
  budgetInitial: number,
  deviseBudget: string,
  expenses: ProjectExpense[]
): BudgetSummary => {
  console.log('calculateBudgetSummary called with:', {
    budgetInitial,
    deviseBudget,
    expenses: expenses.map(e => ({
      id: e.id,
      montant: e.montant,
      devise: e.devise,
      montant_converti: e.montant_converti
    }))
  });

  // Calculate total expenses in budget currency
  const totalDepenses = expenses.reduce((sum, expense) => {
    console.log('Processing expense:', {
      id: expense.id,
      montant: expense.montant,
      devise: expense.devise,
      montant_converti: expense.montant_converti,
      budgetDevise: deviseBudget
    });

    if (expense.montant_converti !== undefined && expense.montant_converti !== null) {
      console.log('Using montant_converti:', expense.montant_converti);
      return sum + expense.montant_converti;
    }
    
    if (expense.devise === deviseBudget) {
      console.log('Using direct montant:', expense.montant);
      return sum + expense.montant;
    }
    
    // Convert if needed
    const convertedAmount = convertAmount(expense.montant, expense.devise, deviseBudget);
    console.log('Converted amount:', convertedAmount);
    return sum + convertedAmount;
  }, 0);

  console.log('Total depenses calculated:', totalDepenses);

  const montantRestant = budgetInitial - totalDepenses;
  const pourcentageConsommation = budgetInitial > 0 ? (totalDepenses / budgetInitial) * 100 : 0;

  let statutBudgetaire: 'success' | 'warning' | 'danger' = 'success';
  if (pourcentageConsommation >= 90) {
    statutBudgetaire = 'danger';
  } else if (pourcentageConsommation >= 70) {
    statutBudgetaire = 'warning';
  }

  return {
    budget_initial: budgetInitial,
    devise_budget: deviseBudget,
    total_depenses: totalDepenses,
    montant_restant: montantRestant,
    pourcentage_consommation: pourcentageConsommation,
    statut_budgetaire: statutBudgetaire
  };
};

export const formatCurrency = (amount: number, currency: string): string => {
  const currencyInfo = CURRENCIES.find(c => c.code === currency);
  const symbol = currencyInfo?.symbol || currency;
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' ' + symbol;
};

export const getBudgetStatusColor = (status: 'success' | 'warning' | 'danger'): string => {
  switch (status) {
    case 'success': return 'text-green-600 bg-green-100';
    case 'warning': return 'text-orange-600 bg-orange-100';
    case 'danger': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getBudgetProgressColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 70) return 'bg-orange-500';
  return 'bg-green-500';
};