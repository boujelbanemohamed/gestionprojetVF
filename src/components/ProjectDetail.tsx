import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Download, BarChart3, Calendar, Users, Building, FileText, User, X, Edit2, Grid3X3, List, Clock, Play, CheckCircle, Paperclip, BarChart, Star, ExternalLink, Lightbulb, TrendingUp, DollarSign, FileText as FileText2, AlertTriangle, Bell } from 'lucide-react';
import { Project, Task, User as UserType, Comment, Department, ProjectAttachment, ProjectExpense, BudgetSummary, ProjetMembre } from '../types';
import { supabase } from '../services/supabase';
import { SupabaseService } from '../services/supabaseService';
import { getProjectStats } from '../utils/calculations';
import { calculateBudgetSummary } from '../utils/budgetCalculations';
import { exportProjectToExcel } from '../utils/export';
import { exportProjectToPdf } from '../utils/pdfExport';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import TaskCommentsModal from './TaskCommentsModal';
import ProjectMembersModal from './ProjectMembersModal';
import ProjectEditModal from './ProjectEditModal';
import KanbanBoard from './KanbanBoard';
import TaskDetailsModal from './TaskDetailsModal';
import ProjectAttachmentsModal from './ProjectAttachmentsModal';
import GanttChart from './GanttChart';
import { isProjectApproachingDeadline, isProjectOverdue, getDaysUntilDeadline, getAlertMessage, getAlertSeverity, getAlertColorClasses, DEFAULT_ALERT_THRESHOLD } from '../utils/alertsConfig';
import ProjectAlertSettingsModal from './ProjectAlertSettingsModal';
import ProjectBudgetModal from './ProjectBudgetModal';
import { calculateBudgetSummary, formatCurrency, getBudgetProgressColor } from '../utils/budgetCalculations';
import ProjectMembersManagementModal from './ProjectMembersManagementModal';
import ProjectInfoModal from './ProjectInfoModal';
import ProjectMeetingMinutesModal from './ProjectMeetingMinutesModal';
import { checkCanCloseProject, checkCanReopenProject } from '../utils/permissions';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { 
  createHistoryEntry, 
  addTaskCreatedHistory, 
  addTaskUpdatedHistory, 
  addStatusChangedHistory, 
  addUserAssignedHistory, 
  addUserUnassignedHistory, 
  addCommentAddedHistory, 
  addCommentDeletedHistory, 
  addDateChangedHistory 
} from '../utils/taskHistory';
import { Lock, Unlock } from 'lucide-react';

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

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (project: Project) => void;
  availableUsers: UserType[];
  departments: Department[];
  currentUser: AuthUser;
  meetingMinutes?: any[];
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onUpdateProject, availableUsers, departments, currentUser, meetingMinutes = [] }) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [localTasks, setLocalTasks] = useState<Task[]>(project.taches || []);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  // Note: localTasks est maintenant la source de vérité, pas de synchronisation avec project.taches
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | undefined>();

  // Charger les tâches depuis Supabase si elles ne sont pas disponibles
  useEffect(() => {
    const loadTasksFromSupabase = async () => {
      if (project.id) {
        console.log('Loading tasks from Supabase for project:', project.id);
        try {
          const tasks = await SupabaseService.getProjectTasks(project.id);
          console.log('Loaded tasks from Supabase:', tasks);
          setLocalTasks(tasks);
        } catch (error) {
          console.error('Error loading tasks from Supabase:', error);
        }
      }
    };

    loadTasksFromSupabase();
  }, [project.id]); // Recharger les tâches à chaque changement de projet
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'gantt'>('kanban');
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | undefined>();
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isAlertSettingsModalOpen, setIsAlertSettingsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isMembersManagementModalOpen, setIsMembersManagementModalOpen] = useState(false);
  const [isProjectInfoModalOpen, setIsProjectInfoModalOpen] = useState(false);
  const [isPVModalOpen, setIsPVModalOpen] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(DEFAULT_ALERT_THRESHOLD);

  // Hook pour gérer les membres du projet
  const { 
    members: projectMembers,
    loading: membersLoading, 
    error: membersError,
    loadMembers,
    addMember, 
    removeMember, 
    getMemberCount,
    isMember 
  } = useProjectMembers(project.id);

  // Debug logs pour les membres
  console.log('ProjectDetail - project.id:', project.id);
  console.log('ProjectDetail - projectMembers:', projectMembers);
  console.log('ProjectDetail - membersLoading:', membersLoading);
  console.log('ProjectDetail - getMemberCount():', getMemberCount());

  // Check if project has budget defined
  const hasBudget = project.budget_initial && project.devise;

  // State for real expenses
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  // Load real expenses from Supabase
  const loadExpenses = async () => {
    console.log('Loading expenses for project:', project.id);
    
    if (!hasBudget) {
      setExpensesLoading(false);
      return;
    }

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
        console.log('Loaded expenses from Supabase:', data);
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
        console.log('Mapped expenses:', expenses);
        setProjectExpenses(expenses);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des dépenses:', error);
      setProjectExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [project.id, hasBudget]);

  // State for budget summary
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);

  // Calculate budget summary when expenses change
  useEffect(() => {
    console.log('Recalculating budget summary:', {
      hasBudget,
      projectExpenses: projectExpenses.length,
      budget_initial: project.budget_initial,
      devise: project.devise
    });
    
    if (hasBudget && projectExpenses.length >= 0) {
      const summary = calculateBudgetSummary(project.budget_initial!, project.devise!, projectExpenses);
      console.log('New budget summary:', summary);
      setBudgetSummary(summary);
    } else {
      setBudgetSummary(null);
    }
  }, [project.budget_initial, project.devise, projectExpenses]);

  const stats = getProjectStats(localTasks);

  // projectMembers is now managed by the useProjectMembers hook

  // Calculate total attachments count (project + all tasks + all comments)
  const getTotalAttachmentsCount = () => {
    const projectAttachments = project.attachments?.length || 0;
    const taskAttachments = localTasks.reduce((sum, task) => sum + (task.attachments?.length || 0), 0);
    const commentAttachments = localTasks.reduce((sum, task) => 
      sum + (task.commentaires?.reduce((commentSum, comment) => 
        commentSum + (comment.attachments?.length || 0), 0) || 0), 0);
    
    return projectAttachments + taskAttachments + commentAttachments;
  };

  // Calculate status-specific stats
  const statusStats = {
    non_debutee: {
      count: stats.notStartedTasks,
      percentage: stats.totalTasks > 0 ? Math.round((stats.notStartedTasks / stats.totalTasks) * 100) : 0,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      icon: Clock
    },
    en_cours: {
      count: stats.inProgressTasks,
      percentage: stats.totalTasks > 0 ? Math.round((stats.inProgressTasks / stats.totalTasks) * 100) : 0,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: Play
    },
    cloturee: {
      count: stats.completedTasks,
      percentage: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle
    }
  };

  // Debug: Log localTasks state
  console.log('ProjectDetail - localTasks state:', {
    localTasksCount: localTasks.length,
    localTasks: localTasks.map(t => ({
      id: t.id,
      nom: t.nom,
      utilisateurs: t.utilisateurs?.map(u => ({ id: u.id, nom: u.nom })) || []
    })),
    filterMember,
    filterStatus,
    membersLoading
  });

  const filteredTasks = localTasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.etat === filterStatus;
    const hasUsers = Array.isArray(task.utilisateurs) && task.utilisateurs.length > 0;
    const matchesMember =
      filterMember === 'all' || (hasUsers && task.utilisateurs.some(user => user.id === filterMember));
    
    // Debug logs
    console.log('Filtering task:', {
      taskId: task.id,
      taskName: task.nom,
      taskUsers: task.utilisateurs?.map(u => ({ id: u.id, nom: u.nom })) || [],
      filterMember,
      hasUsers,
      matchesMember,
      matchesStatus,
      membersLoading,
      finalResult: matchesStatus && matchesMember
    });
    
    // Si les membres sont en cours de chargement, ne pas appliquer le filtre membre
    if (membersLoading && filterMember !== 'all') {
      return matchesStatus;
    }
    
    return matchesStatus && matchesMember;
  });

  // Debug: Log filtered results
  console.log('ProjectDetail - filteredTasks result:', {
    filteredCount: filteredTasks.length,
    filteredTasks: filteredTasks.map(t => ({
      id: t.id,
      nom: t.nom,
      utilisateurs: t.utilisateurs?.map(u => ({ id: u.id, nom: u.nom })) || []
    }))
  });

  // Get current user for history tracking (in a real app, this would come from authentication)
  const getCurrentUser = (): UserType => {
    return currentUser;
  };

  // Project lifecycle functions
  const canCloseProject = (): boolean => {
    return checkCanCloseProject(project, getCurrentUser());
  };

  const canReopenProject = (): boolean => {
    return checkCanReopenProject(project, getCurrentUser());
  };

  const handleCloseProject = () => {
    if (!canCloseProject()) return;

    const confirmMessage = `Êtes-vous sûr de vouloir clôturer le projet "${project.nom}" ?\n\nCette action :\n• Retirera le projet du tableau de bord principal\n• Le déplacera vers les projets clôturés\n• Empêchera toute modification future\n\nSeuls les admins pourront le réouvrir.`;
    
    if (window.confirm(confirmMessage)) {
      const currentUser = getCurrentUser();
      const updatedProject = {
        ...project,
        statut: 'cloture' as const,
        date_cloture: new Date(),
        cloture_par: currentUser.id,
        updated_at: new Date()
      };

      onUpdateProject(updatedProject);
    }
  };

  const handleReopenProject = () => {
    if (!canReopenProject()) return;

    const confirmMessage = `Êtes-vous sûr de vouloir réouvrir le projet "${project.nom}" ?\n\nCette action :\n• Remettra le projet dans le tableau de bord principal\n• Permettra de nouveau les modifications\n• Enregistrera la date de réouverture`;
    
    if (window.confirm(confirmMessage)) {
      const currentUser = getCurrentUser();
      const updatedProject = {
        ...project,
        statut: 'actif' as const,
        date_reouverture: new Date(),
        reouvert_par: currentUser.id,
        updated_at: new Date()
      };

      onUpdateProject(updatedProject);
    }
  };

  // Encapsule les mises à jour projet pour éviter les erreurs non catchées côté modals
  const safeUpdateProject = (updatedProject: Project) => {
    try {
      const maybePromise = onUpdateProject(updatedProject);
      // Si le callback retourne une promesse, capturer un rejet asynchrone
      if (maybePromise && typeof (maybePromise as any).catch === 'function') {
        (maybePromise as Promise<unknown>).catch((err) => {
          console.error('onUpdateProject rejected:', err);
        });
      }
    } catch (err) {
      console.error('onUpdateProject threw synchronously:', err);
    }
  };

  const handleCreateTask = (taskData: Task) => {
    const currentUser = getCurrentUser();
    const newTask: Task = {
      ...taskData,
      commentaires: taskData.commentaires || [],
      history: taskData.history || []
    };

    // Add creation history if not already present
    if (!newTask.history || newTask.history.length === 0) {
      const creationHistory = addTaskCreatedHistory(newTask, currentUser);
      newTask.history = [creationHistory];
    }

    const updatedTasks = [...localTasks, newTask];
    
    // Mettre à jour l'état local immédiatement
    setLocalTasks(updatedTasks);

    const updatedProject = {
      ...project,
      taches: updatedTasks,
      updated_at: new Date()
    };

    // Réinitialiser le filtre membre pour s'assurer que la nouvelle tâche est visible
    setFilterMember('all');
    
    // Si des utilisateurs ont été assignés à la nouvelle tâche, forcer un refresh des membres
    if (taskData.utilisateurs && taskData.utilisateurs.length > 0) {
      console.log('New task with users assigned, forcing member refresh');
      // Appeler loadMembers de manière asynchrone pour éviter les erreurs synchrones
      Promise.resolve().then(() => loadMembers(true));
    }
    
    safeUpdateProject(updatedProject);
  };

  const handleUpdateTask = (taskData: Task) => {
    if (!editingTask) return;

    const currentUser = getCurrentUser();
    const oldTask = editingTask;
    const changes: string[] = [];
    const newHistory = [...(oldTask.history || [])];

    // Check for changes and create history entries
    if (oldTask.nom !== taskData.nom) changes.push('nom');
    if (oldTask.description !== taskData.description) changes.push('description');
    if (oldTask.scenario_execution !== taskData.scenario_execution) changes.push('scénario d\'exécution');
    if (oldTask.criteres_acceptation !== taskData.criteres_acceptation) changes.push('critères d\'acceptation');
    if (oldTask.date_realisation && taskData.date_realisation && 
        oldTask.date_realisation.getTime() !== taskData.date_realisation.getTime()) {
      changes.push('date de réalisation');
      newHistory.push(addDateChangedHistory(oldTask, currentUser, oldTask.date_realisation, taskData.date_realisation));
    }

    // Check status change
    if (oldTask.etat !== taskData.etat) {
      newHistory.push(addStatusChangedHistory(oldTask, currentUser, oldTask.etat, taskData.etat));
    }

    // Check for user assignment changes
    const oldUserIds = (oldTask.utilisateurs || []).map(u => u.id).sort();
    const newUserIds = (taskData.utilisateurs || []).map(u => u.id).sort();
    const userAssignmentChanged = JSON.stringify(oldUserIds) !== JSON.stringify(newUserIds);
    
    if (userAssignmentChanged) {
      console.log('User assignment changed:', {
        old: oldUserIds,
        new: newUserIds
      });
      // Add user assignment history
      const addedUsers = newUserIds.filter(id => !oldUserIds.includes(id));
      const removedUsers = oldUserIds.filter(id => !newUserIds.includes(id));
      
      addedUsers.forEach(userId => {
        const user = taskData.utilisateurs?.find(u => u.id === userId);
        if (user) {
          newHistory.push(addUserAssignedHistory(oldTask, currentUser, user));
        }
      });
      
      removedUsers.forEach(userId => {
        const user = oldTask.utilisateurs?.find(u => u.id === userId);
        if (user) {
          newHistory.push(addUserUnassignedHistory(oldTask, currentUser, user));
        }
      });
    }

    // Mettre à jour la tâche localement, y compris les utilisateurs assignés
    const mergedTask: Task = {
      ...oldTask,
      ...taskData,
      utilisateurs: taskData.utilisateurs, // Utiliser directement les utilisateurs de taskData
      history: newHistory
    };

    console.log('handleUpdateTask - mergedTask utilisateurs:', mergedTask.utilisateurs?.map(u => ({ id: u.id, nom: u.nom })));
    console.log('handleUpdateTask - oldTask.id:', oldTask.id, 'taskData.id:', taskData.id);

    const updatedTasks = localTasks.map(t => {
      if (t.id === oldTask.id) {
        console.log('handleUpdateTask - Updating task:', t.id, 'with users:', mergedTask.utilisateurs?.map(u => ({ id: u.id, nom: u.nom })));
        return mergedTask;
      } else {
        console.log('handleUpdateTask - Keeping task unchanged:', t.id, 'with users:', t.utilisateurs?.map(u => ({ id: u.id, nom: u.nom })) || []);
        return t;
      }
    });

    console.log('handleUpdateTask - updatedTasks after mapping:', updatedTasks.map(t => ({
      id: t.id,
      nom: t.nom,
      utilisateurs: t.utilisateurs?.map(u => ({ id: u.id, nom: u.nom })) || []
    })));

    // Mettre à jour l'état local immédiatement (optimistic update)
    console.log('handleUpdateTask - Setting localTasks to:', updatedTasks.map(t => ({
      id: t.id,
      nom: t.nom,
      utilisateurs: t.utilisateurs?.map(u => ({ id: u.id, nom: u.nom })) || []
    })));
    setLocalTasks(updatedTasks);

    const updatedProject = {
      ...project,
      taches: updatedTasks,
      updated_at: new Date()
    };

    // Réinitialiser le filtre membre pour s'assurer que la tâche mise à jour est visible
    setFilterMember('all');
    
    // Si des utilisateurs ont été assignés/désassignés, forcer un refresh des membres
    if (userAssignmentChanged) {
      console.log('User assignment changed, forcing member refresh');
      // Appeler loadMembers de manière asynchrone pour éviter les erreurs synchrones
      Promise.resolve().then(() => loadMembers(true));
    }
    
    safeUpdateProject(updatedProject);
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = localTasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    const commentsCount = taskToDelete.commentaires?.length || 0;
    const attachmentsCount = taskToDelete.attachments?.length || 0;
    const commentAttachmentsCount = taskToDelete.commentaires?.reduce((sum, comment) => 
      sum + (comment.attachments?.length || 0), 0) || 0;
    const totalAttachments = attachmentsCount + commentAttachmentsCount;

    let confirmMessage = `Êtes-vous sûr de vouloir supprimer la tâche "${taskToDelete.nom}" ?`;
    
    if (commentsCount > 0 || totalAttachments > 0) {
      confirmMessage += '\n\nCette action supprimera également :';
      if (commentsCount > 0) {
        confirmMessage += `\n• ${commentsCount} commentaire${commentsCount > 1 ? 's' : ''}`;
      }
      if (totalAttachments > 0) {
        confirmMessage += `\n• ${totalAttachments} pièce${totalAttachments > 1 ? 's' : ''} jointe${totalAttachments > 1 ? 's' : ''}`;
      }
      confirmMessage += '\n\nCette action est irréversible.';
    }

    if (window.confirm(confirmMessage)) {
      // Clean up any object URLs to prevent memory leaks
      if (taskToDelete.attachments) {
        taskToDelete.attachments.forEach(attachment => {
          if (attachment.url.startsWith('blob:')) {
            URL.revokeObjectURL(attachment.url);
          }
        });
      }

      if (taskToDelete.commentaires) {
        taskToDelete.commentaires.forEach(comment => {
          if (comment.attachments) {
            comment.attachments.forEach(attachment => {
              if (attachment.url.startsWith('blob:')) {
                URL.revokeObjectURL(attachment.url);
              }
            });
          }
        });
      }

      const updatedTasks = localTasks.filter(task => task.id !== taskId);
      
      // Mettre à jour l'état local immédiatement
      setLocalTasks(updatedTasks);
      
      const updatedProject = {
        ...project,
        taches: updatedTasks,
        updated_at: new Date()
      };

      safeUpdateProject(updatedProject);

      // Close any open modals related to this task
      if (selectedTaskForComments && selectedTaskForComments.id === taskId) {
        setSelectedTaskForComments(undefined);
        setIsCommentsModalOpen(false);
      }
      if (selectedTaskForDetails && selectedTaskForDetails.id === taskId) {
        setSelectedTaskForDetails(undefined);
        setIsTaskDetailsModalOpen(false);
      }
      if (editingTask && editingTask.id === taskId) {
        setEditingTask(undefined);
        setIsTaskModalOpen(false);
      }
    }
  };

  const handleUpdateProject = (projectData: { nom: string; description?: string; departement?: string; attachments?: ProjectAttachment[] }) => {
    const updatedProject = {
      ...project,
      nom: projectData.nom,
      description: projectData.description,
      budget_initial: projectData.budget_initial,
      devise: projectData.devise,
      type_projet: projectData.type_projet,
      responsable_id: projectData.responsable_id,
      prestataire_externe: projectData.prestataire_externe,
      nouvelles_fonctionnalites: projectData.nouvelles_fonctionnalites,
      avantages: projectData.avantages,
      departement: projectData.departement,
      attachments: projectData.attachments,
      updated_at: new Date()
    };

    onUpdateProject(updatedProject);
  };

  const handleAddComment = (taskId: string, commentData: Omit<Comment, 'id' | 'created_at'>) => {
    const currentUser = getCurrentUser();
    const newComment: Comment = {
      ...commentData,
      id: Date.now().toString(),
      created_at: new Date()
    };

    const updatedTasks = project.taches.map(task => {
      if (task.id === taskId) {
        const updatedTask = {
          ...task,
          commentaires: [...(task.commentaires || []), newComment],
          history: [...(task.history || []), addCommentAddedHistory(task, commentData.auteur)]
        };
        return updatedTask;
      }
      return task;
    });

    const updatedProject = {
      ...project,
      taches: updatedTasks,
      updated_at: new Date()
    };

    onUpdateProject(updatedProject);

    // Update selected task for comments modal
    if (selectedTaskForComments && selectedTaskForComments.id === taskId) {
      const updatedTask = updatedTasks.find(t => t.id === taskId);
      if (updatedTask) {
        setSelectedTaskForComments(updatedTask);
      }
    }
  };

  const handleDeleteComment = (taskId: string, commentId: string) => {
    const currentUser = getCurrentUser();
    
    const updatedTasks = project.taches.map(task => {
      if (task.id === taskId) {
        const commentToDelete = (task.commentaires || []).find(c => c.id === commentId);
        const updatedTask = {
          ...task,
          commentaires: (task.commentaires || []).filter(comment => comment.id !== commentId),
          history: [...(task.history || []), 
            ...(commentToDelete ? [addCommentDeletedHistory(task, currentUser, commentToDelete.auteur)] : [])
          ]
        };
        return updatedTask;
      }
      return task;
    });

    const updatedProject = {
      ...project,
      taches: updatedTasks,
      updated_at: new Date()
    };

    onUpdateProject(updatedProject);

    // Update selected task for comments modal
    if (selectedTaskForComments && selectedTaskForComments.id === taskId) {
      const updatedTask = updatedTasks.find(t => t.id === taskId);
      if (updatedTask) {
        setSelectedTaskForComments(updatedTask);
      }
    }
  };

  const handleShowComments = (task: Task) => {
    setSelectedTaskForComments(task);
    setIsCommentsModalOpen(true);
  };

  const handleCloseCommentsModal = () => {
    setIsCommentsModalOpen(false);
    setSelectedTaskForComments(undefined);
  };

  const handleShowTaskDetails = (task: Task) => {
    setSelectedTaskForDetails(task);
    setIsTaskDetailsModalOpen(true);
  };

  const handleCloseTaskDetailsModal = () => {
    setIsTaskDetailsModalOpen(false);
    setSelectedTaskForDetails(undefined);
  };

  const handleEditTaskFromDetails = (task: Task) => {
    console.log('Opening edit modal for task:', task.nom, 'Current filterMember:', filterMember);
    setFilterMember('all'); // Réinitialiser le filtre avant d'ouvrir le modal d'édition
    setEditingTask(task);
    setIsTaskDetailsModalOpen(false);
    setSelectedTaskForDetails(undefined);
  };

  // Handle task update from details modal (for attachment deletion)
  const handleUpdateTaskFromDetails = (updatedTask: Task) => {
    const updatedTasks = localTasks.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    );

    // Mettre à jour l'état local immédiatement
    setLocalTasks(updatedTasks);

    const updatedProject = {
      ...project,
      taches: updatedTasks,
      updated_at: new Date()
    };

    safeUpdateProject(updatedProject);

    // Update the selected task for details modal
    setSelectedTaskForDetails(updatedTask);
  };

  const handleExport = () => {
    exportProjectToExcel(project);
  };

  const handleExportPdf = () => {
    exportProjectToPdf(project);
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterMember('all');
  };

  const hasActiveFilters = filterStatus !== 'all' || filterMember !== 'all';

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const totalAttachmentsCount = getTotalAttachmentsCount();

  // Get PV count for this project
  const getProjectPVCount = () => {
    return meetingMinutes.filter(pv => 
      pv.projet_ids && pv.projet_ids.includes(project.id)
    ).length;
  };

  // Check if project is approaching deadline or overdue
  const isApproachingDeadline = project.date_fin ? isProjectApproachingDeadline(project.date_fin, alertThreshold) : false;
  const isOverdue = project.date_fin ? isProjectOverdue(project.date_fin) : false;
  const daysUntilDeadline = project.date_fin ? getDaysUntilDeadline(project.date_fin) : null;
  const showDeadlineAlert = (isApproachingDeadline || isOverdue) && project.taches.some(t => t.etat !== 'cloturee');
  const alertMessage = daysUntilDeadline !== null ? getAlertMessage(daysUntilDeadline) : '';
  const alertSeverity = daysUntilDeadline !== null ? getAlertSeverity(daysUntilDeadline) : 'info';
  const alertColorClasses = getAlertColorClasses(alertSeverity);

  // Get project manager
  const projectManager = project.responsable_id 
    ? availableUsers.find(user => user.id === project.responsable_id)
    : null;

  // Réinitialiser automatiquement le filtre membre s'il ne correspond à aucun membre courant
  useEffect(() => {
    if (filterMember === 'all') return;
    const validUserIds = projectMembers.map(m => m.user?.id || m.user_id).filter(Boolean);
    if (!validUserIds.includes(filterMember)) {
      setFilterMember('all');
    }
  }, [projectMembers, filterMember]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-4">
                <h1 className="text-3xl font-bold text-gray-900">{project.nom}</h1>
                {/* Deadline Alert next to title */}
                {showDeadlineAlert && (
                  <div className={`px-3 py-1 rounded-lg border flex items-center space-x-2 ${alertColorClasses}`}>
                    {isOverdue ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                    <span className="text-sm font-medium">{alertMessage}</span>
                    <button
                      onClick={() => setIsAlertSettingsModalOpen(true)}
                      className="ml-2 text-xs hover:underline flex items-center space-x-1 opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <Bell size={12} />
                      <span>Configurer</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <p className="text-gray-600">
                  {localTasks.length} tâche{localTasks.length > 1 ? 's' : ''} • 
                  {membersLoading ? (
                    <span className="text-blue-600">Chargement des membres...</span>
                  ) : (
                    `${getMemberCount()} membre${getMemberCount() > 1 ? 's' : ''}`
                  )}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              {/* Project Status Actions */}
              {project.statut === 'actif' ? (
                <button
                  onClick={handleCloseProject}
                  disabled={!canCloseProject()}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    canCloseProject()
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={
                    canCloseProject()
                      ? 'Clôturer le projet'
                      : 'Impossible de clôturer le projet tant que toutes les tâches ne sont pas terminées'
                  }
                >
                  <Lock size={18} />
                  <span>Clôturer projet</span>
                </button>
              ) : (
                <button
                  onClick={handleReopenProject}
                  disabled={!canReopenProject()}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    canReopenProject()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={
                    canReopenProject()
                      ? 'Réouvrir le projet'
                      : 'Seuls les Super Admin et Admin du département peuvent réouvrir un projet'
                  }
                >
                  <Unlock size={18} />
                  <span>Réouvrir projet</span>
                </button>
              )}
              
              {totalAttachmentsCount > 0 && (
                <button
                  onClick={() => setIsAttachmentsModalOpen(true)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Paperclip size={18} />
                  <span>Pièces jointes ({totalAttachmentsCount})</span>
                </button>
              )}
              <button
                onClick={handleExport}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Download size={18} />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => setIsPVModalOpen(true)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                title="Voir les PV de réunion associés à ce projet"
              >
                <FileText size={18} />
                <span>PV de Réunion {getProjectPVCount() > 0 && `(${getProjectPVCount()})`}</span>
              </button>
              <button
                onClick={() => setIsProjectInfoModalOpen(true)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <FileText size={18} />
                <span>Détails du projet</span>
              </button>
              {hasBudget && (
                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <DollarSign size={18} />
                  <span>Budget</span>
                </button>
              )}
              
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Project Progress */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Progression Global du Projet</h3>
              <span className="text-lg font-bold text-gray-900">{stats.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-500 ${getProgressColor(stats.percentage)}`}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {stats.completedTasks} sur {stats.totalTasks} tâches terminées
            </div>
          </div>

          {/* Budget Progress */}
          {hasBudget && budgetSummary ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Progression Budget</h3>
                <span className="text-lg font-bold text-gray-900">{budgetSummary.pourcentage_consommation.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${getBudgetProgressColor(budgetSummary.pourcentage_consommation)}`}
                  style={{ width: `${Math.min(budgetSummary.pourcentage_consommation, 100)}%` }}
                />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {formatCurrency(budgetSummary.total_depenses, budgetSummary.devise_budget)} sur {formatCurrency(budgetSummary.budget_initial, budgetSummary.devise_budget)} dépensés
                {budgetSummary.montant_restant < 0 && (
                  <span className="text-red-600 font-medium ml-2">
                    (Dépassé de {formatCurrency(Math.abs(budgetSummary.montant_restant), budgetSummary.devise_budget)})
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-300">
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold text-gray-400 mb-2">Progression Budget</h3>
                <p className="text-sm text-gray-500 mb-3">Aucun budget défini pour ce projet</p>
                <button
                  onClick={() => setIsProjectEditModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Configurer le budget
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Project Team Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Équipe du projet ({getMemberCount()} membre{getMemberCount() > 1 ? 's' : ''})
              </h3>
              <button
                onClick={() => setIsMembersManagementModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Users size={18} />
                <span>Gérer l'équipe</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {membersLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : projectMembers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun membre assigné</h4>
                <p className="text-gray-500 mb-4">Commencez par ajouter des membres à votre équipe de projet</p>
                <button
                  onClick={() => setIsMembersManagementModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ajouter des membres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectMembers.map(member => {
                  const user = member.user;
                  if (!user) return null;
                  
                  const isProjectManager = user.id === project.responsable_id;
                  const userTasks = project.taches.filter(task => 
                    task.utilisateurs.some(u => u.id === user.id)
                  );
                  
                  return (
                    <div key={member.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.prenom.charAt(0)}{user.nom.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {user.prenom} {user.nom}
                            </h4>
                            {isProjectManager && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                Responsable
                              </span>
                            )}
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {member.role}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                            <div className="flex items-center space-x-1">
                              <Building size={12} />
                              <span>{user.departement}</span>
                            </div>
                            {user.fonction && (
                              <div className="flex items-center space-x-1">
                                <FileText size={12} />
                                <span>{user.fonction}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {userTasks.length} tâche{userTasks.length > 1 ? 's' : ''} assignée{userTasks.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Status Progress Cards */}

        {/* Tasks Section */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tâches ({viewMode === 'list' ? filteredTasks.length : localTasks.length})
                  {hasActiveFilters && viewMode === 'list' && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      sur {localTasks.length} au total
                    </span>
                  )}
                </h3>
                {project.statut === 'actif' && availableUsers.length > 0 && (
                  <button
                    onClick={() => {
                      setEditingTask(undefined);
                      setIsTaskModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Nouvelle tâche
                  </button>
                )}
                
              </div>
 
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      viewMode === 'kanban' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid3X3 size={16} />
                    <span>Kanban</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List size={16} />
                    <span>Liste</span>
                  </button>
                  <button
                    onClick={() => setViewMode('gantt')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                      viewMode === 'gantt' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart size={16} />
                    <span>Gantt</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filters - Only show in list view */}
            {viewMode === 'list' && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="non_debutee">Non débutées</option>
                  <option value="en_cours">En cours</option>
                  <option value="cloturee">Terminées</option>
                </select>

                <select
                  value={filterMember}
                  onChange={(e) => setFilterMember(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">Tous les membres</option>
                  {projectMembers.map(member => (
                    <option key={member.id} value={member.user?.id || member.user_id}>
                      {member.user?.prenom || ''} {member.user?.nom || ''}
                    </option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center space-x-1"
                    title="Effacer les filtres"
                  >
                    <X size={16} />
                    <span>Effacer</span>
                  </button>
                )}
              </div>
            )}

            {/* Active Filters Display - Only show in list view */}
            {viewMode === 'list' && hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4 mt-4">
                {filterStatus !== 'all' && (
                  <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <span>Statut: {
                      filterStatus === 'non_debutee' ? 'Non débutées' :
                      filterStatus === 'en_cours' ? 'En cours' :
                      filterStatus === 'cloturee' ? 'Terminées' : filterStatus
                    }</span>
                    <button
                      onClick={() => setFilterStatus('all')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {filterMember !== 'all' && (
                  <div className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    <User size={14} />
                    <span>
                      {projectMembers.find(m => (m.user?.id || m.user_id) === filterMember)?.user?.prenom} {projectMembers.find(m => (m.user?.id || m.user_id) === filterMember)?.user?.nom}
                    </span>
                    <button
                      onClick={() => setFilterMember('all')}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Project Status Warning */}
            {project.statut === 'cloture' && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Lock className="text-red-600" size={20} />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Projet clôturé</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Ce projet a été clôturé le {project.date_cloture?.toLocaleDateString('fr-FR')}. 
                      Aucune modification n'est possible. Seuls les admins peuvent le réouvrir.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {localTasks.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche</h4>
                <p className="text-gray-500 mb-4">Commencez par créer votre première tâche</p>
                {availableUsers.length > 0 && project.statut === 'actif' ? (
                  <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Créer une tâche
                  </button>
                ) : (
                  <div className="text-sm text-gray-500 mt-2">
                    {project.statut === 'cloture' ? (
                      <p>Projet clôturé - Aucune modification possible</p>
                    ) : (
                      <p>Créez d'abord des membres dans l'équipe du projet pour pouvoir créer des tâches</p>
                    )}
                  </div>
                )}
              </div>
            ) : viewMode === 'kanban' ? (
              <KanbanBoard
                tasks={localTasks}
                onTaskClick={(task) => {
                  console.log('Opening edit modal from kanban for task:', task.nom, 'Current filterMember:', filterMember);
                  setFilterMember('all');
                  setEditingTask(task);
                }}
                onShowComments={handleShowComments}
                onShowDetails={handleShowTaskDetails}
                onDeleteTask={handleDeleteTask}
              />
            ) : viewMode === 'gantt' ? (
              <GanttChart
                tasks={localTasks}
                onTaskClick={(task) => {
                  console.log('Opening edit modal from gantt for task:', task.nom, 'Current filterMember:', filterMember);
                  setFilterMember('all');
                  setEditingTask(task);
                }}
                onShowComments={handleShowComments}
                onShowDetails={handleShowTaskDetails}
                onDeleteTask={handleDeleteTask}
              />
            ) : (
              <>
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune tâche correspondante
                    </h4>
                    <p className="text-gray-500 mb-4">
                      Aucune tâche ne correspond aux filtres sélectionnés
                    </p>
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Effacer les filtres
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => {
                          console.log('Opening edit modal from task card for task:', task.nom, 'Current filterMember:', filterMember);
                          setFilterMember('all');
                          setEditingTask(task);
                        }}
                        onShowComments={handleShowComments}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen || !!editingTask}
        onClose={() => {
          console.log('TaskModal closing, current filterMember:', filterMember);
          console.log('Resetting filter to: all');
          setIsTaskModalOpen(false);
          setEditingTask(undefined);
          // Réinitialiser le filtre pour éviter de masquer les tâches après assignation
          setFilterMember('all');
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        projectId={project.id}
        availableUsers={projectMembers.map(member => member.user!).filter(Boolean)}
      />

      {/* Project Edit Modal */}
      <ProjectEditModal
        isOpen={isProjectEditModalOpen}
        onClose={() => setIsProjectEditModalOpen(false)}
        onSubmit={handleUpdateProject}
        project={project}
        departments={departments}
        availableUsers={availableUsers}
      />

      {/* Project Attachments Modal */}
      <ProjectAttachmentsModal
        isOpen={isAttachmentsModalOpen}
        onClose={() => setIsAttachmentsModalOpen(false)}
        project={project}
      />

      {/* Project Members Modal */}
      <ProjectMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        projectName={project.nom}
        members={projectMembers}
      />

      {/* Task Comments Modal */}
      {selectedTaskForComments && (
        <TaskCommentsModal
          isOpen={isCommentsModalOpen}
          onClose={handleCloseCommentsModal}
          task={selectedTaskForComments}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          availableUsers={availableUsers}
        />
      )}

      {/* Task Details Modal */}
      {selectedTaskForDetails && (
        <TaskDetailsModal
          isOpen={isTaskDetailsModalOpen}
          onClose={handleCloseTaskDetailsModal}
          task={selectedTaskForDetails}
          onEdit={handleEditTaskFromDetails}
          onShowComments={handleShowComments}
          onDelete={handleDeleteTask}
          onUpdateTask={handleUpdateTaskFromDetails}
        />
      )}
    
    {/* Project Alert Settings Modal */}
    <ProjectAlertSettingsModal
      isOpen={isAlertSettingsModalOpen}
      onClose={() => setIsAlertSettingsModalOpen(false)}
      currentThreshold={alertThreshold}
      onSave={(threshold) => {
        setAlertThreshold(threshold);
        setIsAlertSettingsModalOpen(false);
      }}
    />

    {/* Project Meeting Minutes Modal */}
    <ProjectMeetingMinutesModal
      isOpen={isPVModalOpen}
      onClose={() => setIsPVModalOpen(false)}
      project={project}
      meetingMinutes={meetingMinutes}
    />

    {/* Project Budget Modal */}
    <ProjectBudgetModal
      isOpen={isBudgetModalOpen}
      onClose={() => {
        setIsBudgetModalOpen(false);
        // Recharger les dépenses pour mettre à jour la synthèse budgétaire
        loadExpenses();
      }}
      project={project}
      onUpdateProject={onUpdateProject}
      currentUser={currentUser}
      onExpenseAdded={async () => {
        // Recharger les dépenses quand une dépense est ajoutée
        await loadExpenses();
      }}
    />

    {/* Project Members Management Modal */}
    <ProjectMembersManagementModal
      isOpen={isMembersManagementModalOpen}
      onClose={() => setIsMembersManagementModalOpen(false)}
      project={project}
      availableUsers={availableUsers}
      onUpdateProject={onUpdateProject}
      projectMembers={projectMembers}
      onAddMember={addMember}
      onRemoveMember={removeMember}
      currentUser={currentUser}
    />

    {/* Project Info Modal */}
    <ProjectInfoModal
      isOpen={isProjectInfoModalOpen}
      onClose={() => setIsProjectInfoModalOpen(false)}
      project={project}
      availableUsers={availableUsers}
      projectMembers={projectMembers}
      membersLoading={membersLoading}
      onEditProject={() => {
        setIsProjectInfoModalOpen(false);
        setIsProjectEditModalOpen(true);
      }}
      onManageMembers={() => {
        setIsProjectInfoModalOpen(false);
        setIsMembersManagementModalOpen(true);
      }}
    />
    </div>
  );
};

export default ProjectDetail;