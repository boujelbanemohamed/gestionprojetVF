import { useState, useEffect, useCallback, useRef } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabase';
import { AuthUser } from '../types';
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
      await SupabaseService.signOut();
      // L'état sera mis à jour par onAuthStateChange
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
  const createProject = useCallback((data: { nom: string; type_projet?: string; description?: string; responsable_id?: string; budget_initial?: number; devise?: string; date_debut?: Date; date_fin?: Date; statut?: string }) => SupabaseService.createProject(data), []);
  const updateProject = useCallback((id: string, data: Record<string, any>) => SupabaseService.updateProject(id, data), []);
  const deleteProject = useCallback((id: string) => SupabaseService.deleteProject(id), []);

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