import React, { useState } from 'react';
import { X, Plus, Search, FolderOpen, User, Building, Briefcase } from 'lucide-react';
import { Project, User as UserType, AuthUser } from '../types';
import { getUserInitials } from '../utils/stringUtils';

interface AddMemberToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: UserType | null;
  projects: Project[];
  onAddToProject: (projectId: string, userId: string, addedBy: string, role?: 'membre' | 'responsable') => Promise<void>;
  currentUser: AuthUser;
}

const AddMemberToProjectModal: React.FC<AddMemberToProjectModalProps> = ({
  isOpen,
  onClose,
  member,
  projects,
  onAddToProject,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedRole, setSelectedRole] = useState<'membre' | 'responsable'>('membre');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen || !member) return null;

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.type_projet?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToProject = async () => {
    if (!selectedProject) return;

    try {
      setIsAdding(true);
      await onAddToProject(selectedProject.id, member.id, currentUser.id, selectedRole);
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre au projet:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'ajout du membre au projet');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedProject(null);
    setSelectedRole('membre');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Ajouter un membre à un projet
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Sélectionnez un projet pour {member.prenom} {member.nom}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Member Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {getUserInitials(member.prenom, member.nom)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {member.prenom} {member.nom}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {member.fonction && (
                    <div className="flex items-center space-x-1">
                      <Briefcase size={14} />
                      <span>{member.fonction}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Building size={14} />
                    <span>{member.departement}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher un projet
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Nom du projet, description, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Project List */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Projets disponibles ({filteredProjects.length})
            </h3>
            
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FolderOpen className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500">Aucun projet trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedProject?.id === project.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {project.nom}
                        </h4>
                        {project.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {project.type_projet && (
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {project.type_projet}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded ${
                            project.statut === 'en_cours' ? 'bg-green-100 text-green-800' :
                            project.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                            project.statut === 'cloture' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {project.statut.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      {selectedProject?.id === project.id && (
                        <div className="ml-2 flex-shrink-0">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Selection */}
          {selectedProject && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle dans le projet
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="membre"
                    checked={selectedRole === 'membre'}
                    onChange={(e) => setSelectedRole(e.target.value as 'membre' | 'responsable')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Membre</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="responsable"
                    checked={selectedRole === 'responsable'}
                    onChange={(e) => setSelectedRole(e.target.value as 'membre' | 'responsable')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Responsable</span>
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAddToProject}
              disabled={!selectedProject || isAdding}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Ajout en cours...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Ajouter au projet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMemberToProjectModal;
