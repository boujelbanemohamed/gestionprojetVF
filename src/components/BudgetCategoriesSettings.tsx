import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, AlertTriangle, Save, X } from 'lucide-react';
import { BudgetCategoriesService } from '../services/budgetCategoriesService';
import { AuthUser } from '../types';

interface BudgetCategory {
  id: string;
  nom: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  is_system?: boolean;
}

interface BudgetCategoriesSettingsProps {
  currentUser: AuthUser;
}

const BudgetCategoriesSettings: React.FC<BudgetCategoriesSettingsProps> = ({
  currentUser
}) => {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    try {
      const loadedCategories = BudgetCategoriesService.getCategories();
      setCategories(loadedCategories);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingCategory(null);
    setFormData({ nom: '', description: '' });
    setError('');
  };

  const handleEdit = (category: BudgetCategory) => {
    if (category.is_system) {
      setError('Les catégories système ne peuvent pas être modifiées');
      return;
    }
    
    setEditingCategory(category);
    setIsCreating(false);
    setFormData({
      nom: category.nom,
      description: category.description || ''
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nom.trim()) {
      setError('Le nom de la catégorie est obligatoire');
      return;
    }

    try {
      if (editingCategory) {
        BudgetCategoriesService.updateCategory(editingCategory.id, {
          nom: formData.nom.trim(),
          description: formData.description.trim() || undefined
        });
        setSuccess('Catégorie modifiée avec succès');
      } else {
        BudgetCategoriesService.createCategory({
          nom: formData.nom.trim(),
          description: formData.description.trim() || undefined
        });
        setSuccess('Catégorie créée avec succès');
      }

      loadCategories();
      setIsCreating(false);
      setEditingCategory(null);
      setFormData({ nom: '', description: '' });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleDelete = (category: BudgetCategory) => {
    if (category.is_system) {
      setError('Les catégories système ne peuvent pas être supprimées');
      return;
    }

    try {
      BudgetCategoriesService.deleteCategory(category.id);
      loadCategories();
      setSuccess('Catégorie supprimée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingCategory(null);
    setFormData({ nom: '', description: '' });
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Catégories budgétaires</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gérez les catégories utilisées pour classer les dépenses des projets
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Nouvelle catégorie</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-600 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1 whitespace-pre-line">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-green-600 mt-0.5">✓</div>
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingCategory) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la catégorie <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Formation"
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  id="categoryDescription"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Formations, certifications, séminaires"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <X size={16} />
                <span>Annuler</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{editingCategory ? 'Modifier' : 'Créer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Catégories existantes ({categories.length})
          </h3>
        </div>

        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Aucune catégorie
            </h4>
            <p className="text-gray-500">
              Commencez par créer votre première catégorie budgétaire
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <DollarSign className="text-white" size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                          <span>{category.nom}</span>
                          {category.is_system && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              Système
                            </span>
                          )}
                        </h4>
                        {category.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {category.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Créée le {category.created_at.toLocaleDateString('fr-FR')}
                          {category.updated_at.getTime() !== category.created_at.getTime() && (
                            <span> • Modifiée le {category.updated_at.toLocaleDateString('fr-FR')}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!category.is_system && (
                      <>
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {category.is_system && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                        Catégorie système
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">À propos des catégories budgétaires :</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Les catégories permettent de classer les dépenses des projets</li>
              <li>Les catégories système ne peuvent pas être modifiées ou supprimées</li>
              <li>Une catégorie utilisée dans des dépenses ne peut pas être supprimée</li>
              <li>Vous pouvez créer autant de catégories personnalisées que nécessaire</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetCategoriesSettings;