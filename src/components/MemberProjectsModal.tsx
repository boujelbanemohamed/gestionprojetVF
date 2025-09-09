import React from 'react';
import { X, User, FolderOpen, Star, Calendar, BarChart3, Building, Clock, Play, CheckCircle } from 'lucide-react';
import { User as UserType, Project } from '../types';
import { getProjectStats } from '../utils/calculations';

interface MemberProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: UserType;
  assignedProjects: Project[];
  responsibleProjects: Project[];
}

const MemberProjectsModal: React.FC<MemberProjectsModalProps> = ({
  isOpen,
  onClose,
  member,
  assignedProjects,
  responsibleProjects
}) => {
  if (!isOpen || !member) return null;

  // Calculate member statistics
  const getMemberStats = () => {
    const totalAssignedTasks = assignedProjects.reduce((sum, project) => 
      sum + project.taches.filter(task => 
        task.utilisateurs.some(user => user.id === member.id)
      ).length, 0
    );
    
    const completedAssignedTasks = assignedProjects.reduce((sum, project) => 
      sum + project.taches.filter(task => 
        task.utilisateurs.some(user => user.id === member.id) && task.etat === 'cloturee'
      ).length, 0
    );

    const inProgressAssignedTasks = assignedProjects.reduce((sum, project) => 
      sum + project.taches.filter(task => 
        task.utilisateurs.some(user => user.id === member.id) && task.etat === 'en_cours'
      ).length, 0
    );

    const notStartedAssignedTasks = assignedProjects.reduce((sum, project) => 
      sum + project.taches.filter(task => 
        task.utilisateurs.some(user => user.id === member.id) && task.etat === 'non_debutee'
      ).length, 0
    );

    const completionRate = totalAssignedTasks > 0 ? Math.round((completedAssignedTasks / totalAssignedTasks) * 100) : 0;

    return {
      totalAssignedTasks,
      completedAssignedTasks,
      inProgressAssignedTasks,
      notStartedAssignedTasks,
      completionRate
    };
  };

  const stats = getMemberStats();

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Projets de {member.prenom} {member.nom}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {assignedProjects.length} projet{assignedProjects.length > 1 ? 's' : ''} assigné{assignedProjects.length > 1 ? 's' : ''} • 
                {responsibleProjects.length} projet{responsibleProjects.length > 1 ? 's' : ''} sous sa responsabilité
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Member Performance Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {member.prenom.charAt(0)}{member.nom.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {member.prenom} {member.nom}
                </h3>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Building size={14} />
                    <span>{member.departement}</span>
                  </div>
                  {member.fonction && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <span>•</span>
                      <span>{member.fonction}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="text-gray-600" size={16} />
                  <span className="text-sm font-medium text-gray-700">Non débutées</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.notStartedAssignedTasks}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Play className="text-orange-600" size={16} />
                  <span className="text-sm font-medium text-gray-700">En cours</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgressAssignedTasks}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="text-green-600" size={16} />
                  <span className="text-sm font-medium text-gray-700">Terminées</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.completedAssignedTasks}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="text-purple-600" size={16} />
                  <span className="text-sm font-medium text-gray-700">Taux de réussite</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            {stats.totalAssignedTasks > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progression globale</span>
                  <span className="text-sm font-bold text-gray-900">{stats.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(stats.completionRate)}`}
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  {stats.completedAssignedTasks} sur {stats.totalAssignedTasks} tâches terminées
                </div>
              </div>
            )}
          </div>

          {/* Responsible Projects */}
          {responsibleProjects.length > 0 && (
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="text-yellow-600" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Projets sous sa responsabilité ({responsibleProjects.length})
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {responsibleProjects.map(project => {
                  const projectStats = getProjectStats(project.taches);
                  return (
                    <div key={project.id} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{project.nom}</h4>
                          {project.departement && (
                            <div className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                              <Building size={12} />
                              <span>{project.departement}</span>
                            </div>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Responsable
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Progression</span>
                          <span className="text-xs font-bold text-gray-900">{projectStats.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(projectStats.percentage)}`}
                            style={{ width: `${projectStats.percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{projectStats.totalTasks} tâches</span>
                          <span>{projectStats.completedTasks} terminées</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assigned Projects */}
          {assignedProjects.length > 0 && (
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FolderOpen className="text-blue-600" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Projets assignés ({assignedProjects.length})
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedProjects.map(project => {
                  const projectStats = getProjectStats(project.taches);
                  const memberTasks = project.taches.filter(task => 
                    task.utilisateurs.some(user => user.id === member.id)
                  );
                  const memberCompletedTasks = memberTasks.filter(task => task.etat === 'cloturee').length;
                  const memberCompletionRate = memberTasks.length > 0 ? Math.round((memberCompletedTasks / memberTasks.length) * 100) : 0;
                  
                  return (
                    <div key={project.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{project.nom}</h4>
                          {project.departement && (
                            <div className="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                              <Building size={12} />
                              <span>{project.departement}</span>
                            </div>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Membre
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Member's tasks in this project */}
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-gray-700">Mes tâches</span>
                            <span className="text-xs font-bold text-gray-900">{memberCompletionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(memberCompletionRate)}`}
                              style={{ width: `${memberCompletionRate}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                            <span>{memberTasks.length} tâches assignées</span>
                            <span>{memberCompletedTasks} terminées</span>
                          </div>
                        </div>

                        {/* Project overall progress */}
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-gray-700">Progression du projet</span>
                            <span className="text-xs font-bold text-gray-900">{projectStats.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(projectStats.percentage)}`}
                              style={{ width: `${projectStats.percentage}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                            <span>{projectStats.totalTasks} tâches totales</span>
                            <span>{projectStats.completedTasks} terminées</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Projects Message */}
          {assignedProjects.length === 0 && responsibleProjects.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun projet assigné
              </h3>
              <p className="text-gray-500">
                {member.prenom} {member.nom} n'est actuellement assigné(e) à aucun projet et n'est responsable d'aucun projet.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Performance globale : {stats.completedAssignedTasks}/{stats.totalAssignedTasks} tâches terminées ({stats.completionRate}%)
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProjectsModal;