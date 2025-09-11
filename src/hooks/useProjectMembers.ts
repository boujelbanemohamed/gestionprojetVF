import { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { ProjetMembre, User } from '../types';

export function useProjectMembers(projetId: string) {
  const [members, setMembers] = useState<ProjetMembre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    console.log('useProjectMembers - loadMembers called with projetId:', projetId);
    
    if (!projetId) {
      console.log('useProjectMembers - No projetId, setting empty members');
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Filet de sécurité: timeout à 6s pour éviter un loader infini
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.warn('useProjectMembers - timeout reached, forcing loading=false');
        setLoading(false);
      }, 6000);

      const projectMembers = await SupabaseService.getProjectMembers(projetId);
      clearTimeout(timeout);

      console.log('useProjectMembers - Received projectMembers:', projectMembers);
      setMembers(projectMembers);
    } catch (err) {
      console.error('useProjectMembers - Erreur lors du chargement des membres:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (userId: string, addedBy: string, role: 'membre' | 'responsable' = 'membre') => {
    try {
      const newMember = await SupabaseService.addProjectMember(projetId, userId, addedBy, role);
      setMembers(prev => [...prev, newMember]);
      return newMember;
    } catch (err) {
      console.error('Erreur lors de l\'ajout du membre:', err);
      throw err;
    }
  };

  const removeMember = async (userId: string) => {
    try {
      // Vérifier si l'utilisateur a des tâches assignées
      const hasTasks = await SupabaseService.userHasTasksInProject(projetId, userId);
      if (hasTasks) {
        throw new Error('Impossible de supprimer ce membre car il a des tâches assignées dans ce projet.');
      }

      await SupabaseService.removeProjectMember(projetId, userId);
      setMembers(prev => prev.filter(member => member.user_id !== userId));
    } catch (err) {
      console.error('Erreur lors de la suppression du membre:', err);
      throw err;
    }
  };

  const getMemberCount = () => members.length;

  const isMember = (userId: string) => {
    return members.some(member => member.user_id === userId);
  };

  useEffect(() => {
    loadMembers();
  }, [projetId]);

  return {
    members,
    loading,
    error,
    loadMembers,
    addMember,
    removeMember,
    getMemberCount,
    isMember
  };
}
