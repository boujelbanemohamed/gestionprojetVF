import { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { ProjetMembre, User } from '../types';

export function useProjectMembers(projetId: string) {
  const [members, setMembers] = useState<ProjetMembre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const loadMembers = async (forceRefresh = false) => {
    console.log('useProjectMembers - loadMembers called with projetId:', projetId, 'forceRefresh:', forceRefresh);
    
    if (!projetId) {
      console.log('useProjectMembers - No projetId, setting empty members');
      setMembers([]);
      setLoading(false);
      return;
    }

    // Éviter les appels multiples simultanés
    if (isLoadingMembers && !forceRefresh) {
      console.log('useProjectMembers - Already loading, skipping');
      return;
    }

    try {
      // Ne pas vider la liste existante, juste mettre à jour le loading
      setLoading(true);
      setIsLoadingMembers(true);
      setError(null);

      const projectMembers = await SupabaseService.getProjectMembers(projetId);

      console.log('useProjectMembers - Received projectMembers:', projectMembers);
      setMembers(projectMembers);
    } catch (err) {
      console.error('useProjectMembers - Erreur lors du chargement des membres:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      // Ne pas vider la liste en cas d'erreur, garder les données existantes
      if (members.length === 0) {
        setMembers([]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMembers(false);
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
      console.log(`Vérification des tâches pour l'utilisateur ${userId} dans le projet ${projetId}`);
      
      // Vérifier si l'utilisateur a des tâches assignées
      const hasTasks = await SupabaseService.userHasTasksInProject(projetId, userId);
      console.log(`L'utilisateur ${userId} a des tâches assignées:`, hasTasks);
      
      if (hasTasks) {
        const member = members.find(m => m.user_id === userId);
        const memberName = member?.user ? `${member.user.prenom} ${member.user.nom}` : 'ce membre';
        throw new Error(`Impossible de supprimer ${memberName} car il a des tâches assignées dans ce projet. Veuillez d'abord réassigner ou supprimer ses tâches.`);
      }

      console.log(`Suppression du membre ${userId} du projet ${projetId}`);
      await SupabaseService.removeProjectMember(projetId, userId);
      setMembers(prev => prev.filter(member => member.user_id !== userId));
      console.log(`Membre ${userId} supprimé avec succès`);
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
    // Reset l'état quand le projet change
    setMembers([]);
    setLoading(true);
    setError(null);
    setIsLoadingMembers(false);
    
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
