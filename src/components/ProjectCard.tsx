import React, { useState, useEffect } from 'react';
import { Calendar, Users, BarChart3, Download, Building, FileText, Trash2, MoreVertical, DollarSign, Clock, AlertTriangle, User, Archive } from 'lucide-react';
import { Project } from '../types';
import { getProjectStats } from '../utils/calculations';
import { exportProjectToExcel } from '../utils/export';
import { isProjectApproachingDeadline, isProjectOverdue, getDaysUntilDeadline, getAlertMessage, getAlertSeverity, getAlertColorClasses, DEFAULT_ALERT_THRESHOLD } from '../utils/alertsConfig';
import { calculateBudgetSummary, getBudgetStatusColor, formatCurrency, BudgetSummary } from '../utils/budgetCalculations';
import { supabase } from '../services/supabase';

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

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [memberCount, setMemberCount] = useState<number>(0);
  const stats = getProjectStats(project.taches);

  // Check if project has budget
  const hasBudget = project.budget_initial && project.budget_initial > 0;

  // Load expenses for budget calculation
  const loadExpenses = async () => {
    if (!hasBudget) {
      setExpensesLoading(false);
      return;
    }

    setExpensesLoading(true);
    try {
      const { data, error } = await supabase
        .from('projet_depenses')
        .select('*')
        .eq('projet_id', project.id)
        .order('date_depense', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des dépenses:', error);
        setProjectExpenses([]);
      } else {
        const expenses: ProjectExpense[] = data.map(expense => ({
          id: expense.id,
          projet_id: expense.projet_id,
          date_depense: new Date(expense.date_depense),
          intitule: expense.intitule,
          montant: expense.montant,
          devise: expense.devise,
          taux_conversion: expense.taux_conversion,
          montant_converti: expense.montant_converti,
          rubrique: expense.rubrique,
          piece_jointe_url: expense.piece_jointe_url,
          piece_jointe_nom: expense.piece_jointe_nom,
          piece_jointe_type: expense.piece_jointe_type,
          piece_jointe_taille: expense.piece_jointe_taille,
          created_by: expense.created_by,
          created_at: new Date(expense.created_at),
          updated_at: new Date(expense.updated_at)
        }));
        setProjectExpenses(expenses);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des dépenses:', error);
      setProjectExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  // Load member count
  const loadMemberCount = async () => {
    try {
      const { count, error } = await supabase
        .from('projet_membres')
        .select('*', { count: 'exact', head: true })
        .eq('projet_id', project.id);

      if (error) {
        console.error('Erreur lors du comptage des membres du projet:', error);
        setMemberCount(0);
      } else {
        setMemberCount(count || 0);
      }
    } catch (error) {
      console.error('Erreur lors du comptage des membres du projet:', error);
      setMemberCount(0);
    }
  };

  // Load expenses when component mounts or project changes
  useEffect(() => {
    loadExpenses();
    loadMemberCount();
  }, [project.id, hasBudget]);

  // Calculate budget summary when expenses change
  useEffect(() => {
    if (hasBudget && projectExpenses.length >= 0) {
      const summary = calculateBudgetSummary(project.budget_initial!, project.devise!, projectExpenses);
      setBudgetSummary(summary);
    } else {
      setBudgetSummary(null);
    }
  }, [project.budget_initial, project.devise, projectExpenses]);

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportProjectToExcel(project);
    setShowActions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
    setShowActions(false);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Check if project is approaching deadline or overdue
  const isApproachingDeadline = project.date_fin ? isProjectApproachingDeadline(project.date_fin, DEFAULT_ALERT_THRESHOLD) : false;
  const isOverdue = project.date_fin ? isProjectOverdue(project.date_fin) : false;
  const daysUntilDeadline = project.date_fin ? getDaysUntilDeadline(project.date_fin) : null;
  const showDeadlineAlert = (isApproachingDeadline || isOverdue) && project.taches.some(t => t.etat !== 'cloturee');
  const alertMessage = daysUntilDeadline !== null ? getAlertMessage(daysUntilDeadline) : '';
  const alertSeverity = daysUntilDeadline !== null ? getAlertSeverity(daysUntilDeadline) : 'info';
  const alertColorClasses = getAlertColorClasses(alertSeverity);
  
  // Budget summary is now calculated above with useEffect
  
  // Get project manager
  const projectManager = project.responsable_id 
    ? project.taches.flatMap(t => t.utilisateurs).find(user => user.id === project.responsable_id)
    : null;

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 p-6 group relative"
    >
      {/* Actions Menu */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={18} />
          </button>
          
          {showActions && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(false);
                }}
              />
              
              {/* Actions dropdown */}
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-20">
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Exporter Excel</span>
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Supprimer</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-12">
          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
            {project.nom}
          </h3>
          
          {/* Project Status Badge */}
          {project.statut === 'cloture' && (
            <div className="flex items-center space-x-1 mb-2">
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center space-x-1">
                <Archive size={12} />
                <span>Clôturé</span>
              </span>
              {project.date_cloture && (
                <span className="text-xs text-gray-500">
                  le {project.date_cloture.toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          )}
          
          {/* Type Projet */}
          <div className="flex items-center space-x-2 mb-2">
            <FileText size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">Type: {project.type_projet || "N/A"}</span>
          </div>

          {/* Project Manager */}
          {projectManager && (
            <div className="flex items-center space-x-2 mb-2">
              <User size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">
                Responsable: {projectManager.prenom} {projectManager.nom}
              </span>
            </div>
          )}
          
          {/* Budget */}
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              Budget: {project.budget_initial ? `${project.budget_initial} ${project.devise || ''}` : "N/A"}
            </span>
          </div>
          
          {/* Description */}
          {project.description && (
            <div className="flex items-start space-x-2 mb-3">
              <FileText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            </div>
          )}
          
          {/* Department */}
          {project.departement && (
            <div className="flex items-center space-x-2 mb-2">
              <Building size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">{project.departement}</span>
            </div>
          )}
        </div>
      </div>

      {/* Deadline Alert */}
      {showDeadlineAlert && (
        <div className={`mt-3 p-2 rounded-lg border ${alertColorClasses} flex items-center space-x-2`}>
          {isOverdue ? (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">{alertMessage}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span className="text-sm font-medium">{alertMessage}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Budget Progress Bar */}
        {budgetSummary && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Consommation budgétaire</span>
              <span className="text-sm font-bold text-gray-900">{budgetSummary.pourcentage_consommation.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  budgetSummary.statut_budgetaire === 'danger' ? 'bg-red-500' :
                  budgetSummary.statut_budgetaire === 'warning' ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetSummary.pourcentage_consommation, 100)}%` }}
              />
            </div>
            {budgetSummary.montant_restant < 0 && (
              <div className="text-xs text-red-600 font-medium flex items-center space-x-1">
                <span>⚠</span>
                <span>Dépassé de {formatCurrency(Math.abs(budgetSummary.montant_restant), budgetSummary.devise_budget)}</span>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Progression Global du Projet</span>
            <span className="text-sm font-bold text-gray-900">{stats.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(stats.percentage)}`}
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <BarChart3 size={16} className="text-gray-400" />
            <span className="text-gray-600">{stats.totalTasks} tâches</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users size={16} className="text-gray-400" />
            <span className="text-gray-600">
              {memberCount} membre{memberCount > 1 ? 's' : ''} du projet
            </span>
          </div>
        </div>

        {/* Task Status */}
        <div className="flex space-x-2 text-xs">
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
            {stats.completedTasks} terminées
          </span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
            {stats.inProgressTasks} en cours
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
            {stats.notStartedTasks} à faire
          </span>
          {isOverdue && (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
              En retard
            </span>
          )}
        </div>

        {/* Date */}
        <div className="space-y-2 pt-2 border-t">
          {/* Dates du projet */}
          {(project.date_debut || project.date_fin) && (
            <div className="space-y-1">
              {project.date_debut && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar size={14} className="text-green-500" />
                  <span>Début : {project.date_debut.toLocaleDateString('fr-FR')}</span>
                </div>
              )}
              {project.date_fin && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar size={14} className="text-red-500" />
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    Fin : {project.date_fin.toLocaleDateString('fr-FR')}
                    {isOverdue && ' (dépassée)'}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Date de création */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar size={14} />
            <span>Créé le {project.created_at.toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;