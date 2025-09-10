import React, { useState } from 'react';
import { Users, Plus, Trash2, UserCheck, UserX, AlertTriangle, X } from 'lucide-react';
import { ProjectMember, User } from '../types';
import { useProjectMembers } from '../hooks/useProjectMembers';

interface ProjectMembersManagementProps {
  projectId: string;
  currentUser: { id: string; role: string };
  onMemberAdded?: () => void;
  onMemberRemoved?: () => void;
}

const ProjectMembersManagement: React.FC<ProjectMembersManagementProps> = ({
  projectId,
  currentUser,
  onMemberAdded,
  onMemberRemoved
}) => {
  const {
    members,
    availableUsers,
    loading,
    error,
    addMember,
    removeMember,
    updateMemberRole
  } = useProjectMembers(projectId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'membre' | 'responsable' | 'observateur'>('membre');
  const [isAdding, setIsAdding] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    try {
      setIsAdding(true);
      await addMember(selectedUserId, selectedRole);
      setShowAddModal(false);
      setSelectedUserId('');
      setSelectedRole('membre');
      onMemberAdded?.();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${memberName} du projet ?`)) {
      return;
    }

    try {
      setRemovingMemberId(memberId);
      await removeMember(memberId);
      onMemberRemoved?.();
    } catch (error) {
      console.error('Erreur lors de la suppression du membre:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression du membre');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'membre' | 'responsable' | 'observateur') => {
    try {
      await updateMemberRole(memberId, newRole);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'responsable': return 'bg-blue-100 text-blue-800';
      case 'membre': return 'bg-green-100 text-green-800';
      case 'observateur': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'responsable': return 'Responsable';
      case 'membre': return 'Membre';
      case 'observateur': return 'Observateur';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Membres du projet</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Membres du projet</h3>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
            {members.length}
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un membre</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {members.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <UserX className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun membre assigné à ce projet</p>
          <p className="text-sm">Cliquez sur "Ajouter un membre" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {member.utilisateur?.prenom} {member.utilisateur?.nom}
                  </p>
                  <p className="text-sm text-gray-500">{member.utilisateur?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.utilisateur_id, e.target.value as any)}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)} border-0 focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="membre">Membre</option>
                  <option value="responsable">Responsable</option>
                  <option value="observateur">Observateur</option>
                </select>
                
                <button
                  onClick={() => handleRemoveMember(member.utilisateur_id, `${member.utilisateur?.prenom} ${member.utilisateur?.nom}`)}
                  disabled={removingMemberId === member.utilisateur_id}
                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'ajout de membre */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter un membre</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utilisateur
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="membre">Membre</option>
                  <option value="responsable">Responsable</option>
                  <option value="observateur">Observateur</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMember}
                disabled={!selectedUserId || isAdding}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMembersManagement;
