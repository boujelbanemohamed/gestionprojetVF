import { useState, useEffect, useCallback, useRef } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabase';
import { AuthUser, ProjectMember, CreateProjectMemberData, UpdateProjectMemberData } from '../types';
import type { Session } from '@supabase/supabase-js';

// Types pour le hook générique
interface ResourceState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

interface UseResourceReturn<T> extends ResourceState<T> {
  refetch: () => Promise<void>;
  create: (data: any) => Promise<T>;
  update: (id: string, data: any) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

// Hook générique pour les ressources
function useResource<T>(
  fetchFn: () => Promise<T[]>,
  createFn: (data: any) => Promise<T>,
  updateFn: (id: string, data: any) => Promise<T>,
  deleteFn: (id: string) => Promise<void>
): UseResourceReturn<T> {
  const [state, setState] = useState<ResourceState<T>>({
    data: [],
    loading: true,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const data = await fetchFn();
      
      if (!signal.aborted) {
        setState({ data, loading: false, error: null });
      }
    } catch (error) {
      if (!signal.aborted) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      }
    }
  }, [fetchFn]);

  const create = useCallback(async (data: any): Promise<T> => {
    try {
      const newItem = await createFn(data);
      setState(prev => ({ ...prev, data: [...prev.data, newItem] }));
      return newItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création';
      throw new Error(errorMessage);
    }
  }, [createFn]);

  const update = useCallback(async (id: string, data: any): Promise<T> => {
    try {
      const updatedItem = await updateFn(id, data);
      setState(prev => ({
        ...prev,
        data: prev.data.map(item => (item as any).id === id ? updatedItem : item)
      }));
      return updatedItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
      throw new Error(errorMessage);
    }
  }, [updateFn]);

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteFn(id);
      setState(prev => ({
        ...prev,
        data: prev.data.filter(item => (item as any).id !== id)
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      throw new Error(errorMessage);
    }
  }, [deleteFn]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
    create,
    update,
    remove
  };
}

// Hook for authentication
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fonction pour traiter une session avec AbortController
  const handleSession = useCallback(async (session: Session | null) => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    if (session?.user) {
      try {
        console.log('Récupération du profil utilisateur pour:', session.user.email);
        const currentUser = await SupabaseService.getCurrentUser();
        
        if (!signal.aborted) {
          setUser(currentUser);
          setLoading(false);
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error('Erreur lors de la récupération du profil utilisateur:', error);
          setUser(null);
          setLoading(false);
        }
      }
    } else {
      if (!signal.aborted) {
        setUser(null);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Récupérer la session initiale au montage
    const getInitialSession = async () => {
      try {
        console.log('Récupération de la session initiale...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur lors de la récupération de la session initiale:', error);
          setUser(null);
          setLoading(false);
          return;
        }

        await handleSession(session);
      } catch (error) {
        console.error('Erreur lors de la récupération de la session initiale:', error);
        setUser(null);
        setLoading(false);
      }
    };

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);

        switch (event) {
          case 'SIGNED_IN':
            console.log('Utilisateur connecté');
            await handleSession(session);
            break;
            
          case 'SIGNED_OUT':
            console.log('Utilisateur déconnecté');
            setUser(null);
            setLoading(false);
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('Token rafraîchi');
            await handleSession(session);
            break;
            
          default:
            break;
        }
      }
    );

    // Récupérer la session initiale
    getInitialSession();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const data = await SupabaseService.signIn(email, password);
      // L'état sera mis à jour par onAuthStateChange
      return data;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      throw new Error(errorMessage);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, userData: { nom: string; prenom: string; fonction?: string; departement?: string; role?: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR' }) => {
    try {
      setLoading(true);
      const data = await SupabaseService.signUp(email, password, userData);
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'inscription';
      throw new Error(errorMessage);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await SupabaseService.signOut();
      // Forcer la mise à jour de l'état immédiatement
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Forcer la déconnexion même en cas d'erreur
      setUser(null);
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut
  };
}

// Hook for departments
export function useDepartments() {
  const fetchDepartments = useCallback(() => SupabaseService.getDepartments(), []);
  const createDepartment = useCallback((data: { nom: string }) => SupabaseService.createDepartment(data.nom), []);
  const updateDepartment = useCallback((id: string, data: { nom: string }) => SupabaseService.updateDepartment(id, data.nom), []);
  const deleteDepartment = useCallback((id: string) => SupabaseService.deleteDepartment(id), []);

  const { data: departments, loading, error, refetch, create, update, remove } = useResource(
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
  );

  return {
    departments,
    loading,
    error,
    createDepartment: create,
    updateDepartment: update,
    deleteDepartment: remove,
    refetch
  };
}

// Hook for users
export function useUsers() {
  const fetchUsers = useCallback(() => SupabaseService.getUsers(), []);
  const createUser = useCallback((_data: { nom: string; prenom: string; email: string; fonction?: string; departement?: string; role?: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR' }) => {
    // Simuler createUser car il n'existe pas dans SupabaseService
    throw new Error('Création d\'utilisateur non implémentée');
  }, []);
  const updateUser = useCallback((id: string, data: Record<string, any>) => SupabaseService.updateUser(id, data), []);
  const deleteUser = useCallback((id: string) => SupabaseService.deleteUser(id), []);

  const { data: users, loading, error, refetch, create, update, remove } = useResource(
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  );

  return {
    users,
    loading,
    error,
    createUser: create,
    updateUser: update,
    deleteUser: remove,
    refetch
  };
}

// Hook for projects
export function useProjects() {
  const fetchProjects = useCallback(() => SupabaseService.getProjects(), []);
  const createProject = useCallback(async (data: { 
    nom: string; 
    type_projet?: string; 
    description?: string; 
    responsable_id?: string; 
    budget_initial?: number; 
    devise?: string; 
    date_debut?: Date; 
    date_fin?: Date; 
    statut?: string;
    membres?: string[]; // IDs des membres à assigner
  }) => {
    const project = await SupabaseService.createProject(data);
    
    // Si des membres sont spécifiés, les ajouter au projet
    if (data.membres && data.membres.length > 0) {
      for (const userId of data.membres) {
        try {
          await SupabaseService.addProjectMember({
            projet_id: project.id,
            user_id: userId,
            role: 'membre',
            added_by: data.responsable_id || ''
          });
        } catch (error) {
          console.error('Erreur lors de l\'ajout du membre au projet:', error);
        }
      }
    }
    
    return project;
  }, []);
  
  const updateProject = useCallback(async (id: string, data: Record<string, any>) => {
    // Filtrer les données pour ne garder que les champs de la table projets
    const { taches, membres, ...projectData } = data;
    
    const project = await SupabaseService.updateProject(id, projectData);
    
    // Si des membres sont spécifiés dans la mise à jour, gérer les changements
    if (membres !== undefined) {
      try {
        // Récupérer les membres actuels
        const currentMembers = await SupabaseService.getProjectMembers(id);
        const currentMemberIds = currentMembers.map(m => m.user_id);
        const newMemberIds = membres || [];
        
        // Supprimer les membres qui ne sont plus dans la liste
        for (const member of currentMembers) {
          if (!newMemberIds.includes(member.user_id)) {
            await SupabaseService.deleteProjectMember(member.id);
          }
        }
        
        // Ajouter les nouveaux membres
        for (const userId of newMemberIds) {
          if (!currentMemberIds.includes(userId)) {
            await SupabaseService.addProjectMember({
              projet_id: id,
              user_id: userId,
              role: 'membre',
              added_by: data.responsable_id || ''
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour des membres du projet:', error);
      }
    }
    
    return project;
  }, []);
  
  const deleteProject = useCallback(async (id: string) => {
    // Supprimer d'abord tous les membres du projet
    try {
      const members = await SupabaseService.getProjectMembers(id);
      for (const member of members) {
        await SupabaseService.deleteProjectMember(member.id);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des membres du projet:', error);
    }
    
    // Puis supprimer le projet
    await SupabaseService.deleteProject(id);
  }, []);

  const { data: projects, loading, error, refetch, create, update, remove } = useResource(
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  );

  return {
    projects,
    loading,
    error,
    createProject: create,
    updateProject: update,
    deleteProject: remove,
    refetch
  };
}

// Hook for project members
export function useProjectMembers(projetId: string | null) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!projetId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      setLoading(true);
      setError(null);
      const data = await SupabaseService.getProjectMembers(projetId);
      
      if (!signal.aborted) {
        setMembers(data);
        setLoading(false);
      }
    } catch (error) {
      if (!signal.aborted) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des membres';
        setError(errorMessage);
        setLoading(false);
      }
    }
  }, [projetId]);

  const addMember = useCallback(async (data: CreateProjectMemberData): Promise<ProjectMember> => {
    try {
      const newMember = await SupabaseService.addProjectMember(data);
      setMembers(prev => [...prev, newMember]);
      return newMember;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du membre';
      throw new Error(errorMessage);
    }
  }, []);

  const updateMember = useCallback(async (id: string, data: UpdateProjectMemberData): Promise<ProjectMember> => {
    try {
      const updatedMember = await SupabaseService.updateProjectMember(id, data);
      setMembers(prev => prev.map(member => member.id === id ? updatedMember : member));
      return updatedMember;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du membre';
      throw new Error(errorMessage);
    }
  }, []);

  const removeMember = useCallback(async (id: string): Promise<void> => {
    try {
      await SupabaseService.deleteProjectMember(id);
      setMembers(prev => prev.filter(member => member.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression du membre';
      throw new Error(errorMessage);
    }
  }, []);

  useEffect(() => {
    fetchMembers();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    addMember,
    updateMember,
    removeMember,
    refetch: fetchMembers
  };
}