interface BudgetCategory {
  id: string;
  nom: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  is_system?: boolean;
}

interface BudgetCategoryUsage {
  category_id: string;
  project_id: string;
  project_name: string;
  expense_id: string;
  expense_name: string;
  amount: number;
  currency: string;
  date: Date;
}

// Mock service for budget categories management
export class BudgetCategoriesService {
  private static readonly STORAGE_KEY = 'budget_categories';
  
  // Default system categories that cannot be deleted
  private static readonly DEFAULT_CATEGORIES: BudgetCategory[] = [
    {
      id: 'rh',
      nom: 'Ressources Humaines',
      description: 'Salaires, formations, consultants',
      is_system: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'materiel',
      nom: 'Matériel',
      description: 'Équipements, fournitures',
      is_system: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'prestation',
      nom: 'Prestations externes',
      description: 'Services externes, sous-traitance',
      is_system: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'logiciel',
      nom: 'Logiciels',
      description: 'Licences, abonnements',
      is_system: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'deplacement',
      nom: 'Déplacements',
      description: 'Voyages, hébergement, transport',
      is_system: false,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'communication',
      nom: 'Communication',
      description: 'Marketing, publicité',
      is_system: false,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'formation',
      nom: 'Formation',
      description: 'Formations, certifications',
      is_system: false,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: 'autre',
      nom: 'Autres',
      description: 'Dépenses diverses',
      is_system: false,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    }
  ];

  static getCategories(): BudgetCategory[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const categories = JSON.parse(stored);
        // Convert date strings back to Date objects
        return categories.map((cat: any) => ({
          ...cat,
          created_at: new Date(cat.created_at),
          updated_at: new Date(cat.updated_at)
        }));
      } catch {
        return this.DEFAULT_CATEGORIES;
      }
    }
    return this.DEFAULT_CATEGORIES;
  }

  static saveCategories(categories: BudgetCategory[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(categories));
  }

  static createCategory(categoryData: Omit<BudgetCategory, 'id' | 'created_at' | 'updated_at'>): BudgetCategory {
    const categories = this.getCategories();
    
    // Check for duplicate names
    const exists = categories.some(cat => 
      cat.nom.toLowerCase() === categoryData.nom.toLowerCase()
    );
    
    if (exists) {
      throw new Error('Une catégorie avec ce nom existe déjà');
    }

    const newCategory: BudgetCategory = {
      ...categoryData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date(),
      updated_at: new Date(),
      is_system: false
    };

    const updatedCategories = [...categories, newCategory];
    this.saveCategories(updatedCategories);
    
    return newCategory;
  }

  static updateCategory(id: string, categoryData: Partial<Omit<BudgetCategory, 'id' | 'created_at' | 'updated_at' | 'is_system'>>): BudgetCategory {
    const categories = this.getCategories();
    const categoryIndex = categories.findIndex(cat => cat.id === id);
    
    if (categoryIndex === -1) {
      throw new Error('Catégorie non trouvée');
    }

    const category = categories[categoryIndex];
    
    if (category.is_system) {
      throw new Error('Les catégories système ne peuvent pas être modifiées');
    }

    // Check for duplicate names (excluding current category)
    if (categoryData.nom) {
      const exists = categories.some(cat => 
        cat.id !== id && cat.nom.toLowerCase() === categoryData.nom!.toLowerCase()
      );
      
      if (exists) {
        throw new Error('Une catégorie avec ce nom existe déjà');
      }
    }

    const updatedCategory = {
      ...category,
      ...categoryData,
      updated_at: new Date()
    };

    categories[categoryIndex] = updatedCategory;
    this.saveCategories(categories);
    
    return updatedCategory;
  }

  static deleteCategory(id: string): void {
    const categories = this.getCategories();
    const category = categories.find(cat => cat.id === id);
    
    if (!category) {
      throw new Error('Catégorie non trouvée');
    }

    if (category.is_system) {
      throw new Error('Les catégories système ne peuvent pas être supprimées');
    }

    // Check if category is used in any expenses
    const usage = this.getCategoryUsage(id);
    if (usage.length > 0) {
      const usageDetails = usage.map(u => `${u.project_name}: ${u.expense_name}`).join('\n');
      throw new Error(`Impossible de supprimer cette catégorie car elle est utilisée dans les dépenses suivantes :\n\n${usageDetails}\n\nVeuillez d'abord modifier ou supprimer ces dépenses.`);
    }

    const updatedCategories = categories.filter(cat => cat.id !== id);
    this.saveCategories(updatedCategories);
  }

  static getCategoryUsage(categoryId: string): BudgetCategoryUsage[] {
    // In a real app, this would query the database for expenses using this category
    // For now, we'll return mock data to demonstrate the functionality
    const mockUsage: BudgetCategoryUsage[] = [
      {
        category_id: categoryId,
        project_id: '1',
        project_name: 'Refonte Site Web',
        expense_id: '1',
        expense_name: 'Licences logiciels de développement',
        amount: 2500,
        currency: 'EUR',
        date: new Date('2024-02-01')
      }
    ];

    // Only return usage for categories that are actually used
    if (categoryId === 'logiciel') {
      return mockUsage;
    }
    
    return [];
  }

  static getCategoryById(id: string): BudgetCategory | undefined {
    return this.getCategories().find(cat => cat.id === id);
  }

  static getCategoryByName(name: string): BudgetCategory | undefined {
    return this.getCategories().find(cat => 
      cat.nom.toLowerCase() === name.toLowerCase()
    );
  }
}