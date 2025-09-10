import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { User as UserType } from '../types';
import { MemberController, ProjectMember } from '../services/memberController';

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  availableUsers: UserType[];
  currentUser: { id: string; nom: string; prenom: string };
  onMembersUpdated?: () => void;
}

const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  availableUsers,
  currentUser,
  onMembersUpdated
}) => {
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load project members
  const loadMembers = async () => {
    try {
      setLoading(true);
      const members = await MemberController.getProjectMembers(projectId);
      setProjectMembers(members);
    } catch (err) {
      console.error('Erreur lors du chargement des membres:', err);
      setError('Erreur lors du chargement des membres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, projectId]);

  // Add member to project
  const handleAddMember = async (userId: string) => {
    try {
      setError('');
      await MemberController.assignMemberToProject(
        projectId,
        userId,
        currentUser.id,
        'MEMBER'
      );
      await loadMembers();
      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du membre');
    }
  };

  // Remove member from project
  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${userName} du projet ?`)) {
      return;
    }

    try {
      setError('');
      await MemberController.removeMemberFromProject(projectId, userId);
      await loadMembers();
      if (onMembersUpdated) {
        onMembersUpdated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du membre');
    }
  };

  // Get available users (not already members)
  const availableUsersToAdd = availableUsers.filter(user => 
    !projectMembers.some(member => member.user_id === user.id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des membres</h2>
            <p className="text-gray-600 mt-1">Projet: {projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertTriangle size={20} className="text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Current Members */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User size={20} className="text-blue-600" />
              <span>Membres du projet ({projectMembers.length})</span>
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Chargement...</p>
              </div>
            ) : projectMembers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <User size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun membre assigné</p>
                <p className="text-gray-400 text-sm">Ajoutez des membres pour commencer à collaborer</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {projectMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {member.users.prenom.charAt(0)}{member.users.nom.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.users.prenom} {member.users.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.users.email} • {member.users.fonction || 'Non défini'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Ajouté le {new Date(member.assigned_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.role === 'ADMIN' ? 'Admin' : 'Membre'}
                      </span>
                      <button
                        onClick={() => handleRemoveMember(member.user_id, `${member.users.prenom} ${member.users.nom}`)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer du projet"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Members */}
          {availableUsersToAdd.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Plus size={20} className="text-green-600" />
                <span>Ajouter des membres ({availableUsersToAdd.length} disponible{availableUsersToAdd.length > 1 ? 's' : ''})</span>
              </h3>

              <div className="grid gap-3">
                {availableUsersToAdd.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.prenom.charAt(0)}{user.nom.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.prenom} {user.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email} • {user.fonction || 'Non défini'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.departement || 'Département non défini'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(user.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus size={16} />
                      <span>Ajouter</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableUsersToAdd.length === 0 && projectMembers.length > 0 && (
            <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
              <p className="text-green-800 text-lg font-medium">Tous les utilisateurs sont déjà membres</p>
              <p className="text-green-600 text-sm">Aucun utilisateur supplémentaire à ajouter</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectMembersModal;