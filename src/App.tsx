import React, { useState, useEffect } from 'react';
import { Project, User, Department, AuthUser } from './types';
import { SupabaseService } from './services/supabaseService';
import { useAuth, useDepartments, useUsers, useProjects } from './hooks/useSupabase';
import { PermissionService } from './utils/permissions';
import { Router, RouteConfig } from './utils/router';
import { NotificationService } from './utils/notifications';
import { Analytics } from './utils/analytics';
import Dashboard from './components/Dashboard';
import ProjectDetail from './components/ProjectDetail';
import MembersManagement from './components/MembersManagement';
import DepartmentsManagement from './components/DepartmentsManagement';
import PerformanceDashboard from './components/PerformanceDashboard';
import GeneralSettings from './components/GeneralSettings';
import ClosedProjectsPage from './components/ClosedProjectsPage';
import LoginModal from './components/LoginModal';
import UserProfileModal from './components/UserProfileModal';
import MeetingMinutesPage from './components/MeetingMinutesPage';
import Navigation from './components/Navigation';
import SupabaseSetupButton from './components/SupabaseSetupButton';
import NotificationToast from './components/NotificationToast';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import SearchBar from './components/SearchBar';
import QuickActions from './components/QuickActions';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import { supabase } from './services/supabase';

// Global error handler
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

function App() {
  // Use Supabase hooks
  const { user: currentUser, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { departments, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { users, updateUser, deleteUser } = useUsers();
  const { projects, createProject, updateProject, deleteProject, refetch: refetchProjects } = useProjects();
  
  const [currentRoute, setCurrentRoute] = useState<RouteConfig>(Router.getCurrentRoute());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [meetingMinutes, setMeetingMinutes] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Initialize router and check authentication
  useEffect(() => {
    Router.init();
    
    const unsubscribe = Router.subscribe((route) => {
      setCurrentRoute(route);
      Analytics.trackPageView(route.component, currentUser?.id);
    });

    // Show login modal if not authenticated
    if (!authLoading && !currentUser) {
      setIsLoginModalOpen(true);
    }

    return unsubscribe;
  }, [authLoading, currentUser]);

  // Monitor performance and errors
  useEffect(() => {
    // const errorUnsubscribe = ErrorHandler.subscribe((error) => {
    //   NotificationService.error(
    //     'Erreur système',
    //     error.message
    //   );
    // });

    // return errorUnsubscribe;
  }, []);

  // Get accessible projects based on user role
  const getAccessibleProjects = () => {
    return PermissionService.getAccessibleProjects(currentUser, projects).filter(p => p.statut === 'actif');
  };

  // Get accessible closed projects
  const getAccessibleClosedProjects = () => {
    return PermissionService.getAccessibleProjects(currentUser, projects).filter(p => p.statut === 'cloture');
  };

  const handleLogin = (user: AuthUser) => {
    setIsLoginModalOpen(false);
    Analytics.trackUserLogin(user.id, user.role);
    NotificationService.success(
      'Connexion réussie',
      `Bienvenue ${user.prenom} ${user.nom} !`
    );
  };

  const handleLogout = () => {
    Analytics.track('user_logout', {}, currentUser?.id);
    setIsLoginModalOpen(true);
    Router.navigate('dashboard');
    NotificationService.info('Déconnexion', 'Vous avez été déconnecté avec succès');
  };

  const handleProfileUpdate = (updatedUser: AuthUser) => {
    NotificationService.success('Profil mis à jour', 'Vos informations ont été sauvegardées');
  };

  const handleCreateProject = async (projectData: {
    nom: string;
    description?: string;
    type_projet?: string;
    budget_initial?: number;
    devise?: string;
    responsable_id?: string;
    prestataire_externe?: string;
    nouvelles_fonctionnalites?: string;
    avantages?: string;
    budget_initial?: number;
    devise?: string;
    prestataire_externe?: string;
    nouvelles_fonctionnalites?: string;
    avantages?: string;
    departement?: string;
    dateDebut?: Date;
    dateFin?: Date;
    attachments?: File[];
  }) => {
    console.log('handleCreateProject called with:', projectData);
    
    if (!PermissionService.hasPermission(currentUser, 'projects', 'create')) {
      console.error('Permission denied for project creation');
      alert('Vous n\'avez pas les permissions pour créer un projet');
      return;
    }

    try {
      // Find department ID if department name is provided
      let departement_id: string | undefined;
      if (projectData.departement) {
        const dept = departments.find(d => d.nom === projectData.departement);
        departement_id = dept?.id;
        console.log('Department found:', dept, 'ID:', departement_id);
      }

      const projectToCreate = {
        nom: projectData.nom,
        type_projet: projectData.type_projet,
        description: projectData.description,
        responsable_id: projectData.responsable_id,
        budget_initial: projectData.budget_initial,
        devise: projectData.devise,
        prestataire_externe: projectData.prestataire_externe,
        nouvelles_fonctionnalites: projectData.nouvelles_fonctionnalites,
        avantages: projectData.avantages,
        departement_id,
        date_debut: projectData.dateDebut,
        date_fin: projectData.dateFin
      };
      
      console.log('Creating project with data:', projectToCreate);
      const newProject = await createProject(projectToCreate);
      console.log('Project created successfully:', newProject);

      Analytics.trackProjectCreated(newProject.nom, currentUser!.id);
      NotificationService.success(
        'Projet créé',
        `Le projet "${newProject.nom}" a été créé avec succès`
      );
    } catch (error) {
      console.error('Error creating project:', error);
      NotificationService.error(
        'Erreur',
        'Impossible de créer le projet'
      );
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      await updateProject(updatedProject.id, updatedProject);
      NotificationService.success('Projet mis à jour', 'Les modifications ont été sauvegardées');
    } catch (error) {
      console.error('Error updating project:', error);
      NotificationService.error('Erreur', 'Impossible de mettre à jour le projet');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!PermissionService.hasPermission(currentUser, 'projects', 'delete')) {
      alert('Vous n\'avez pas les permissions pour supprimer ce projet');
      return;
    }

    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;

    const taskCount = projectToDelete.taches.length;
    const memberCount = new Set(projectToDelete.taches.flatMap(t => t.utilisateurs.map(u => u.id))).size;

    let confirmMessage = `Êtes-vous sûr de vouloir supprimer le projet "${projectToDelete.nom}" ?`;
    
    if (taskCount > 0 || memberCount > 0) {
      confirmMessage += '\n\nCette action supprimera également :';
      if (taskCount > 0) {
        confirmMessage += `\n• ${taskCount} tâche${taskCount > 1 ? 's' : ''}`;
      }
      if (memberCount > 0) {
        confirmMessage += `\n• Les assignations de ${memberCount} membre${memberCount > 1 ? 's' : ''}`;
      }
      confirmMessage += '\n\nCette action est irréversible.';
    }

    if (window.confirm(confirmMessage)) {
      try {
        await deleteProject(projectId);
        NotificationService.success(
          'Projet supprimé',
          `Le projet "${projectToDelete.nom}" a été supprimé`
        );
      } catch (error) {
        console.error('Error deleting project:', error);
        NotificationService.error('Erreur', 'Impossible de supprimer le projet');
      }
    }
  };

  const handleCreateMember = async (memberData: Omit<User, 'id' | 'created_at'>) => {
    if (!PermissionService.hasPermission(currentUser, 'members', 'create')) {
      alert('Vous n\'avez pas les permissions pour créer un membre');
      return;
    }

    try {
      // For now, we'll use the signup process to create users
      // In a real implementation, you might want a separate admin creation flow
      const tempPassword = 'TempPassword123!'; // User should change this on first login
      
      await signUp(memberData.email, tempPassword, {
        nom: memberData.nom,
        prenom: memberData.prenom,
        fonction: memberData.fonction,
        departement: memberData.departement,
        role: memberData.role
      });

      NotificationService.success(
        'Membre créé',
        `${memberData.prenom} ${memberData.nom} a été ajouté à l'équipe`
      );
    } catch (error) {
      console.error('Error creating member:', error);
      NotificationService.error('Erreur', 'Impossible de créer le membre');
    }
  };

  const handleUpdateMember = async (id: string, memberData: Omit<User, 'id' | 'created_at'>) => {
    if (!PermissionService.hasPermission(currentUser, 'members', 'edit')) {
      alert('Vous n\'avez pas les permissions pour modifier ce membre');
      return;
    }

    const targetUser = users.find(u => u.id === id);
    if (targetUser && !PermissionService.canManageUser(currentUser, targetUser)) {
      alert('Vous n\'avez pas les permissions pour modifier ce membre');
      return;
    }

    try {
      // Find department ID if department name is provided
      let departement_id: string | undefined;
      if (memberData.departement) {
        const dept = departments.find(d => d.nom === memberData.departement);
        departement_id = dept?.id;
      }

      await updateUser(id, {
        nom: memberData.nom,
        prenom: memberData.prenom,
        email: memberData.email,
        fonction: memberData.fonction,
        departement_id,
        role: memberData.role
      });

      NotificationService.success('Membre mis à jour', 'Les modifications ont été sauvegardées');
    } catch (error) {
      console.error('Error updating member:', error);
      NotificationService.error('Erreur', 'Impossible de mettre à jour le membre');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!PermissionService.hasPermission(currentUser, 'members', 'delete')) {
      alert('Vous n\'avez pas les permissions pour supprimer ce membre');
      return;
    }

    const targetUser = users.find(u => u.id === id);
    if (targetUser && !PermissionService.canManageUser(currentUser, targetUser)) {
      alert('Vous n\'avez pas les permissions pour supprimer ce membre');
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce membre ?`)) {
      try {
        await deleteUser(id);
        NotificationService.success('Membre supprimé', 'Le membre a été supprimé');
      } catch (error) {
        console.error('Error deleting member:', error);
        NotificationService.error('Erreur', 'Impossible de supprimer le membre');
      }
    }
  };

  const handleCreateDepartment = async (departmentData: Omit<Department, 'id' | 'created_at'>) => {
    if (!PermissionService.hasPermission(currentUser, 'departments', 'create')) {
      alert('Vous n\'avez pas les permissions pour créer un département');
      return;
    }

    try {
      await createDepartment(departmentData.nom);
      NotificationService.success(
        'Département créé',
        `Le département "${departmentData.nom}" a été créé`
      );
    } catch (error) {
      console.error('Error creating department:', error);
      NotificationService.error('Erreur', 'Impossible de créer le département');
    }
  };

  const handleUpdateDepartment = async (id: string, departmentData: Omit<Department, 'id' | 'created_at'>) => {
    if (!PermissionService.hasPermission(currentUser, 'departments', 'edit')) {
      alert('Vous n\'avez pas les permissions pour modifier ce département');
      return;
    }

    try {
      await updateDepartment(id, departmentData.nom);
      NotificationService.success('Département mis à jour', 'Les modifications ont été appliquées');
    } catch (error) {
      console.error('Error updating department:', error);
      NotificationService.error('Erreur', 'Impossible de mettre à jour le département');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!PermissionService.hasPermission(currentUser, 'departments', 'delete')) {
      alert('Vous n\'avez pas les permissions pour supprimer ce département');
      return;
    }

    const departmentToDelete = departments.find(d => d.id === id);
    if (!departmentToDelete) return;

    const memberCount = users.filter(u => u.departement === departmentToDelete.nom).length;
    
    let confirmMessage = `Êtes-vous sûr de vouloir supprimer le département "${departmentToDelete.nom}" ?`;
    
    if (memberCount > 0) {
      confirmMessage += `\n\nCe département contient ${memberCount} membre${memberCount > 1 ? 's' : ''}. Les membres devront être réassignés.`;
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteDepartment(id);
        NotificationService.success(
          'Département supprimé',
          `Le département "${departmentToDelete.nom}" a été supprimé`
        );
      } catch (error) {
        console.error('Error deleting department:', error);
        NotificationService.error('Erreur', 'Impossible de supprimer le département');
      }
    }
  };

  const handleSelectProject = (project: Project) => {
    Router.navigate('project-detail', { projectId: project.id }, project.nom);
  };

  const handleNavigateToClosedProjects = () => {
    Router.navigate('closed-projects');
  };

  const handleReopenProject = (projectId: string) => {
    if (!PermissionService.hasPermission(currentUser, 'projects', 'edit')) {
      alert('Vous n\'avez pas les permissions pour réouvrir ce projet');
      return;
    }

    const projectToReopen = projects.find(p => p.id === projectId);
    if (!projectToReopen) return;

    const updatedProject = {
      ...projectToReopen,
      statut: 'actif' as const,
      date_reouverture: new Date(),
      reouvert_par: currentUser!.id,
      updated_at: new Date()
    };

    NotificationService.success(
      'Projet réouvert',
      `Le projet "${updatedProject.nom}" a été réouvert`
    );
  };

  const handleNavigate = (route: any, params?: any) => {
    if (!PermissionService.canAccessPage(currentUser, route)) {
      alert('Vous n\'avez pas accès à cette page');
      // ErrorHandler.permissionError('access', route);
      return;
    }

    Router.navigate(route, params);
  };

  const handleBackToDashboard = () => {
    Router.navigate('dashboard');
  };

  const handleGlobalSearch = () => {
    // Focus on search input or open search modal
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  };

  const handleCreateMeetingMinute = (data: any) => {
    if (!currentUser) return;
    
    const newMeetingMinute: any = {
      ...data,
      id: Date.now().toString(),
      nom_fichier: data.file?.name || 'document.pdf',
      taille_fichier: data.file?.size || 0,
      type_fichier: data.file?.type || 'application/pdf',
      url_fichier: data.file ? URL.createObjectURL(data.file) : '#',
      uploaded_by: currentUser,
      projets: data.projet_ids.map((id: string) => projects.find(p => p.id === id)).filter(Boolean),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    setMeetingMinutes(prev => [...prev, newMeetingMinute]);
    NotificationService.success('PV créé', 'Le procès-verbal a été créé avec succès');
  };

  const handleUpdateMeetingMinute = (id: string, data: any) => {
    if (!currentUser) return;
    
    setMeetingMinutes(prev => 
      prev.map(mm => mm.id === id ? { 
        ...mm, 
        ...data,
        projets: data.projet_ids.map((projId: string) => projects.find(p => p.id === projId)).filter(Boolean),
        updated_at: new Date() 
      } : mm)
    );
    NotificationService.success('PV mis à jour', 'Le procès-verbal a été modifié');
  };

  const handleDeleteMeetingMinute = (id: string) => {
    setMeetingMinutes(prev => prev.filter(mm => mm.id !== id));
    NotificationService.success('PV supprimé', 'Le procès-verbal a été supprimé');
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Chargement de l'application..." />;
  }

  // Show login modal if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Plateforme de Gestion de Projets</h1>
          <p className="text-gray-600 mb-8">Veuillez vous connecter pour accéder à l'application</p>
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
             data-testid="main-login-button"
            >
              Se connecter
            </button>
            
            <div className="mt-4">
              <SupabaseSetupButton />
            </div>
          </div>
        </div>
        
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleLogin}
          users={users}
        />
      </div>
    );
  }

  const accessibleProjects = getAccessibleProjects();
  const accessibleClosedProjects = getAccessibleClosedProjects();

  // Get current project for project detail view
  const getCurrentProject = () => {
    if (currentRoute.component === 'project-detail' && currentRoute.params?.projectId) {
      // Check both active and closed projects
      return [...accessibleProjects, ...accessibleClosedProjects].find(p => p.id === currentRoute.params!.projectId);
    }
    return null;
  };

  const currentProject = getCurrentProject();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <NotificationToast />
      <Navigation
        currentUser={currentUser}
        currentView={currentRoute.component}
        onNavigate={handleNavigate}
        unreadNotificationsCount={unreadNotificationsCount}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
        />

        {currentRoute.component === 'meeting-minutes' && (
          <MeetingMinutesPage
            meetingMinutes={meetingMinutes}
            projects={getAccessibleProjects()}
            users={users}
            currentUser={currentUser}
            onBack={handleBackToDashboard}
            onCreateMeetingMinute={handleCreateMeetingMinute}
            onUpdateMeetingMinute={handleUpdateMeetingMinute}
            onDeleteMeetingMinute={handleDeleteMeetingMinute}
          />
        )}

      {/* Global Search Bar - Only on dashboard */}
      {currentRoute.component === 'dashboard' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchBar
            projects={accessibleProjects}
            users={users}
            onNavigateToProject={handleSelectProject}
            onNavigateToUser={(userId) => handleNavigate('members')}
          />
        </div>
      )}

      {currentRoute.component === 'dashboard' && (
        <Dashboard
          projects={accessibleProjects}
          departments={departments}
          availableUsers={users}
          onNavigateToClosedProjects={handleNavigateToClosedProjects}
          closedProjectsCount={getAccessibleClosedProjects().length}
          onCreateProject={handleCreateProject}
          onSelectProject={handleSelectProject}
          onDeleteProject={handleDeleteProject}
          currentUser={currentUser}
          onNavigateToMeetingMinutes={() => handleNavigate('meeting-minutes')}
        />
      )}
      
      {currentRoute.component === 'project-detail' && currentProject && (
        <ProjectDetail
          project={currentProject}
          onBack={handleBackToDashboard}
          onUpdateProject={handleUpdateProject}
          availableUsers={users}
          departments={departments}
          currentUser={currentUser}
          meetingMinutes={meetingMinutes}
          onRefresh={refetchProjects}
        />
      )}
      
      {currentRoute.component === 'members' && (
        <MembersManagement
          members={users}
          departments={departments}
          projects={accessibleProjects}
          onBack={handleBackToDashboard}
          onCreateMember={handleCreateMember}
          onUpdateMember={handleUpdateMember}
          onDeleteMember={handleDeleteMember}
          onManageDepartments={() => handleNavigate('departments')}
          currentUser={currentUser}
        />
      )}

      {currentRoute.component === 'departments' && (
        <DepartmentsManagement
          departments={departments}
          members={users}
          onBack={() => handleNavigate('members')}
          onCreateDepartment={handleCreateDepartment}
          onUpdateDepartment={handleUpdateDepartment}
          onDeleteDepartment={handleDeleteDepartment}
          currentUser={currentUser}
        />
      )}

      {currentRoute.component === 'performance' && (
        <PerformanceDashboard
          projects={[...accessibleProjects, ...accessibleClosedProjects]}
          users={users}
          onBack={handleBackToDashboard}
          currentUser={currentUser}
        />
      )}

      {currentRoute.component === 'closed-projects' && (
        <ClosedProjectsPage
          closedProjects={accessibleClosedProjects}
          onBack={handleBackToDashboard}
          onReopenProject={handleReopenProject}
          onViewProject={handleSelectProject}
          availableUsers={users}
          currentUser={currentUser}
        />
      )}

      {(currentRoute.component === 'settings' || 
        currentRoute.component === 'settings-general' ||
        currentRoute.component === 'settings-budget' ||
        currentRoute.component === 'settings-permissions') && (
        <GeneralSettings
          currentUser={currentUser}
          onBack={handleBackToDashboard}
        />
      )}

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onLogout={handleLogout}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <QuickActions
          currentUser={currentUser}
          projects={accessibleProjects}
          users={users}
          onCreateProject={() => {/* Will be handled by dashboard */}}
          onCreateTask={() => {/* Open task creation */}}
          onCreateMember={() => handleNavigate('members')}
          onViewPerformance={() => handleNavigate('performance')}
          onNavigateToProject={handleSelectProject}
        />
      </div>

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onCreateProject={() => setIsCreateModalOpen(true)}
        onCreateTask={() => {/* Open task creation */}}
        onCreateMember={() => handleNavigate('members')}
        onSearch={handleGlobalSearch}
        onNavigateHome={handleBackToDashboard}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />
    </div>
    </ErrorBoundary>
  );
}

export default App;