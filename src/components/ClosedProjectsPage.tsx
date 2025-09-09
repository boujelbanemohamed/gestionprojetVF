import React, { useState } from 'react';
import { ArrowLeft, Archive, Calendar, Users, Building, FileText, User, BarChart3, Clock, Play, CheckCircle, Search, Filter, Download, Unlock, Eye } from 'lucide-react';
import { Project, User as UserType, AuthUser } from '../types';
import { getProjectStats } from '../utils/calculations';
import { exportProjectToExcel } from '../utils/export';
import { exportProjectToPdf } from '../utils/pdfExport';
import { PermissionService } from '../utils/permissions';

interface ClosedProjectsPageProps {
  closedProjects: Project[];
  onBack: () => void;
  onReopenProject: (projectId: string) => void;
  onViewProject: (project: Project) => void;
  availableUsers: UserType[];
  currentUser: AuthUser;
}

const ClosedProjectsPage: React.FC<ClosedProjectsPageProps> = ({
  closedProjects,
  onBack,
  onReopenProject,
  onViewProject,
  availableUsers,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'closure_date' | 'department' | 'progress'>('closure_date');

  const filteredProjects = closedProjects
    .filter(project => {
      const matchesSearch = project.nom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !filterDepartment || project.departement === filterDepartment;
      return matchesSearch && matchesDepartment;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.nom.localeCompare(b.nom);
        case 'closure_date':
          return (b.date_cloture?.getTime() || 0) - (a.date_cloture?.getTime() || 0);
        case 'department':
          const aDept = a.departement || 'Zzz';
          const bDept = b.departement || 'Zzz';
          return aDept.localeCompare(bDept);
        case 'progress':
          const aProgress = getProjectStats(a.taches).percentage;
          const bProgress = getProjectStats(b.taches).percentage;
          return bProgress - aProgress;
        default:
          return 0;
      }
    });

  const availableDepartments = Array.from(new Set(closedProjects.map(p => p.departement).filter(Boolean))).sort();

  const handleReopenProject = (projectId: string) => {
    const project = closedProjects.find(p => p.id === projectId);
    if (!project) return;

    const canReopen = currentUser.role === 'SUPER_ADMIN' || 
                     (currentUser.role === 'ADMIN' && currentUser.departement === project.departement);

    if (!canReopen) {
      alert('Vous n\'avez pas les permissions pour réouvrir ce projet. Seuls les Super Admin et Admin du département peuvent réouvrir un projet.');
      return;
    }

    const confirmMessage = `Êtes-vous sûr de vouloir réouvrir le projet "${project.nom}" ?\n\nUne fois réouvert :\n• Le projet réapparaîtra dans le tableau de bord\n• Les modifications seront de nouveau possibles\n• Les membres pourront ajouter/modifier des tâches`;
    
    if (window.confirm(confirmMessage)) {
      onReopenProject(projectId);
    }
  };

  const handleExportProject = (project: Project) => {
    exportProjectToExcel(project);
  };

  const handleExportPdf = (project: Project) => {
    exportProjectToPdf(project);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Archive className="text-red-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Projets clôturés</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {closedProjects.length} projet{closedProjects.length > 1 ? 's' : ''} clôturé{closedProjects.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un projet clôturé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               aria-label="Rechercher un projet clôturé"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400" size={20} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="closure_date">Trier par date de clôture</option>
                  <option value="name">Trier par nom</option>
                  <option value="department">Trier par département</option>
                  <option value="progress">Trier par progression</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="text-gray-400" size={20} />
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les départements</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Closed Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Archive className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterDepartment ? 'Aucun projet trouvé' : 'Aucun projet clôturé'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterDepartment
                ? 'Aucun projet clôturé ne correspond à vos critères de recherche'
                : 'Aucun projet n\'a encore été clôturé'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProjects.map(project => {
              const stats = getProjectStats(project.taches);
              const memberCount = new Set(project.taches.flatMap(t => t.utilisateurs.map(u => u.id))).size;
              const responsibleUser = project.responsable_id ? availableUsers.find(u => u.id === project.responsable_id) : null;
              const canReopen = currentUser.role === 'SUPER_ADMIN' || 
                               (currentUser.role === 'ADMIN' && currentUser.departement === project.departement);

              return (
                <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{project.nom}</h3>
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center space-x-1">
                          <Archive size={14} />
                          <span>Clôturé</span>
                        </span>
                      </div>
                      
                      {project.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        {project.departement && (
                          <div className="flex items-center space-x-2">
                            <Building size={16} className="text-gray-400" />
                            <span className="text-gray-600">{project.departement}</span>
                          </div>
                        )}
                        
                        {responsibleUser && (
                          <div className="flex items-center space-x-2">
                            <User size={16} className="text-gray-400" />
                            <span className="text-gray-600">{responsibleUser.prenom} {responsibleUser.nom}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Users size={16} className="text-gray-400" />
                          <span className="text-gray-600">{memberCount} membre{memberCount > 1 ? 's' : ''}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-gray-600">
                            Clôturé le {project.date_cloture?.toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewProject(project)}
                        className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <Eye size={16} />
                        <span>Voir</span>
                      </button>
                      
                      <button
                        onClick={() => handleExportProject(project)}
                        className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <Download size={16} />
                        <span>Excel</span>
                      </button>
                      
                      <button
                        onClick={() => handleExportPdf(project)}
                        className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <FileText size={16} />
                        <span>PDF</span>
                      </button>
                      
                      <button
                        onClick={() => handleReopenProject(project.id)}
                        disabled={!canReopen}
                        className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                          canReopen
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={
                          canReopen
                            ? 'Réouvrir le projet'
                            : 'Seuls les Super Admin et Admin du département peuvent réouvrir un projet'
                        }
                      >
                        <Unlock size={16} />
                        <span>Réouvrir</span>
                      </button>
                    </div>
                  </div>

                  {/* Project Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Progress Overview */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Progression finale</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tâches terminées</span>
                        <span className="text-sm font-bold text-gray-900">{stats.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(stats.percentage)}`}
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {stats.completedTasks} sur {stats.totalTasks} tâches terminées
                      </div>
                    </div>

                    {/* Task Status Breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Répartition des tâches</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Clock size={14} className="text-gray-600" />
                            <span className="text-xs font-medium text-gray-700">Non débutées</span>
                          </div>
                          <span className="text-lg font-bold text-gray-900">{stats.notStartedTasks}</span>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Play size={14} className="text-orange-600" />
                            <span className="text-xs font-medium text-orange-700">En cours</span>
                          </div>
                          <span className="text-lg font-bold text-orange-900">{stats.inProgressTasks}</span>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <CheckCircle size={14} className="text-green-600" />
                            <span className="text-xs font-medium text-green-700">Clôturées</span>
                          </div>
                          <span className="text-lg font-bold text-green-900">{stats.completedTasks}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Closure Information */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>Clôturé le {project.date_cloture?.toLocaleDateString('fr-FR')}</span>
                        {project.cloture_par && (
                          <span>
                            par {availableUsers.find(u => u.id === project.cloture_par)?.prenom} {availableUsers.find(u => u.id === project.cloture_par)?.nom}
                          </span>
                        )}
                      </div>
                      {project.date_reouverture && (
                        <div className="flex items-center space-x-2">
                          <span>Réouvert le {project.date_reouverture.toLocaleDateString('fr-FR')}</span>
                          {project.reouvert_par && (
                            <span>
                              par {availableUsers.find(u => u.id === project.reouvert_par)?.prenom} {availableUsers.find(u => u.id === project.reouvert_par)?.nom}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClosedProjectsPage;