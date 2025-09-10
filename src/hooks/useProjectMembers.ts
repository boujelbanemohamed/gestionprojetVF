import { useState, useEffect } from 'react';
import { ProjectMembersService } from '../services/projectMembersService';
import { ProjectMember, User } from '../types';

export function useProjectMembers(projectId: string) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [membersData, availableUsersData] = await Promise.all([
        ProjectMembersService.getProjectMembers(projectId),
        ProjectMembersService.getAvailableUsers(projectId)
      ]);
      
      setMembers(membersData);
      setAvailableUsers(availableUsersData);
    } catch (err) {
      console.error('Erreur lors du chargement des membres:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (
    userId: string, 
    role: 'membre' | 'responsable' | 'observateur' = 'membre'
  ) => {
    try {
      const newMember = await ProjectMembersService.addProjectMember(projectId, userId, role);
      setMembers(prev => [newMember, ...prev]);
      
      // Retirer l'utilisateur de la liste des utilisateurs disponibles
      setAvailableUsers(prev => prev.filter(user => user.id !== userId));
      
      return newMember;
    } catch (err) {
      console.error('Erreur lors de l\'ajout du membre:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du membre');
      throw err;
    }
  };

  const removeMember = async (userId: string) => {
    try {
      // Vérifier si le membre a des tâches assignées
      const hasTasks = await ProjectMembersService.hasAssignedTasks(projectId, userId);
      if (hasTasks) {
        throw new Error('Impossible de supprimer ce membre car il a des tâches assignées dans ce projet.');
      }

      await ProjectMembersService.removeProjectMember(projectId, userId);
      
      // Retirer le membre de la liste
      const removedMember = members.find(m => m.utilisateur_id === userId);
      setMembers(prev => prev.filter(m => m.utilisateur_id !== userId));
      
      // Remettre l'utilisateur dans la liste des utilisateurs disponibles
      if (removedMember?.utilisateur) {
        setAvailableUsers(prev => [...prev, removedMember.utilisateur!].sort((a, b) => 
          a.nom.localeCompare(b.nom)
        ));
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du membre:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du membre');
      throw err;
    }
  };

  const updateMemberRole = async (
    userId: string, 
    newRole: 'membre' | 'responsable' | 'observateur'
  ) => {
    try {
      const updatedMember = await ProjectMembersService.updateProjectMemberRole(
        projectId, 
        userId, 
        newRole
      );
      
      setMembers(prev => prev.map(m => 
        m.utilisateur_id === userId ? updatedMember : m
      ));
      
      return updatedMember;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du rôle:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du rôle');
      throw err;
    }
  };

  const isProjectMember = async (userId: string): Promise<boolean> => {
    try {
      return await ProjectMembersService.isProjectMember(projectId, userId);
    } catch (err) {
      console.error('Erreur lors de la vérification du membre:', err);
      return false;
    }
  };

  const refreshMembers = () => {
    loadMembers();
  };

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  return {
    members,
    availableUsers,
    loading,
    error,
    addMember,
    removeMember,
    updateMemberRole,
    isProjectMember,
    refreshMembers
  };
}
