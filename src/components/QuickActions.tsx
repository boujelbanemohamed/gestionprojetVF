import React, { useState } from 'react';
import { Plus, Zap, Clock, Users, FileText, TrendingUp } from 'lucide-react';
import { AuthUser, Project, User } from '../types';
import { PermissionService } from '../utils/permissions';

interface QuickActionsProps {
  currentUser: AuthUser;
  projects: Project[];
  users: User[];
  onCreateProject: () => void;
  onCreateTask: (projectId: string) => void;
  onCreateMember: () => void;
  onViewPerformance: () => void;
  onNavigateToProject: (projectId: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  currentUser,
  projects,
  users,
  onCreateProject,
  onCreateTask,
  onCreateMember,
  onViewPerformance,
  onNavigateToProject
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getRecentProjects = () => {
    return projects
      .filter(p => p.statut === 'actif')
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  };

  const getOverdueTasks = () => {
    const today = new Date();
    return projects
      .flatMap(p => p.taches)
      .filter(task => 
        new Date(task.date_realisation) < today && 
        task.etat !== 'cloturee' &&
        task.utilisateurs.some(u => u.id === currentUser.id)
      )
      .length;
  };

  const actions = [
    {
      id: 'create-project',
      label: 'Nouveau projet',
      icon: <Plus className="text-blue-600" size={20} />,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      show: PermissionService.hasPermission(currentUser, 'projects', 'create'),
      onClick: onCreateProject
    },
    {
      id: 'create-member',
      label: 'Nouveau membre',
      icon: <Users className="text-green-600" size={20} />,
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      show: PermissionService.hasPermission(currentUser, 'members', 'create'),
      onClick: onCreateMember
    },
    {
      id: 'view-performance',
      label: 'Voir performances',
      icon: <TrendingUp className="text-purple-600" size={20} />,
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      show: PermissionService.hasPermission(currentUser, 'performance', 'view'),
      onClick: onViewPerformance
    }
  ].filter(action => action.show);

  const overdueCount = getOverdueTasks();
  const recentProjects = getRecentProjects();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105"
        title="Actions rapides"
      >
        <Zap size={24} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Quick Actions Panel */}
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-4 z-50">
            <div className="px-4 pb-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
              <p className="text-sm text-gray-500">Accès rapide aux fonctionnalités principales</p>
            </div>

            {/* Quick Stats */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <FileText className="mx-auto text-blue-600 mb-1" size={20} />
                  <p className="text-sm font-medium text-blue-900">{projects.filter(p => p.statut === 'actif').length}</p>
                  <p className="text-xs text-blue-700">Projets actifs</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${
                  overdueCount > 0 ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  <Clock className={`mx-auto mb-1 ${
                    overdueCount > 0 ? 'text-red-600' : 'text-green-600'
                  }`} size={20} />
                  <p className={`text-sm font-medium ${
                    overdueCount > 0 ? 'text-red-900' : 'text-green-900'
                  }`}>{overdueCount}</p>
                  <p className={`text-xs ${
                    overdueCount > 0 ? 'text-red-700' : 'text-green-700'
                  }`}>Tâches en retard</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3 space-y-2">
              {actions.map(action => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${action.color}`}
                >
                  {action.icon}
                  <span className="text-sm font-medium text-gray-900">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Projets récents</h4>
                <div className="space-y-1">
                  {recentProjects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        onNavigateToProject(project.id);
                        setIsOpen(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{project.nom}</p>
                      <p className="text-xs text-gray-500">{project.departement || 'Aucun département'}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default QuickActions;