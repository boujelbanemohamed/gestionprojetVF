import { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabase';
import { AuthUser, User, Department, Project } from '../types';

// Hook for authentication
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;
    
    // Timeout de sécurité pour éviter les chargements infinis
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Timeout d\'authentification - arrêt du chargement');
        setLoading(false);
      }
    }, 10000); // 10 secondes max

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        // Annuler le timeout car on a une réponse
        clearTimeout(timeoutId);
        
        if (!isMounted) return; // Éviter les mises à jour si le composant est démonté
        
        if (event === 'INITIAL_SESSION') {
          // Gérer la session initiale
          if (session?.user) {
            try {
              const currentUser = await SupabaseService.getCurrentUser();
              if (isMounted) {
                setUser(currentUser);
                setLoading(false);
              }
            } catch (error) {
              console.error('Erreur lors de la récupération de l\'utilisateur initial:', error);
              if (isMounted) {
                setUser(null);
                setLoading(false);
              }
            }
          } else {
            if (isMounted) {
              setUser(null);
              setLoading(false);
            }
          }
        } else if (event === 'SIGNED_IN') {
          // Utilisateur connecté
          try {
            const currentUser = await SupabaseService.getCurrentUser();
            if (isMounted) {
              setUser(currentUser);
              setLoading(false);
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du profil utilisateur:', error);
            if (isMounted) {
              setUser(null);
              setLoading(false);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Utilisateur déconnecté
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Token rafraîchi
          if (session?.user) {
            try {
              const currentUser = await SupabaseService.getCurrentUser();
              if (isMounted) {
                setUser(currentUser);
                setLoading(false);
              }
            } catch (error) {
              console.error('Erreur lors du rafraîchissement du profil utilisateur:', error);
              if (isMounted) {
                setUser(null);
                setLoading(false);
              }
            }
          } else if (isMounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // Supprimer la dépendance loading

  const signIn = async (email: string, password: string) => {
    try {
      // S'assurer que l'état de chargement est correct
      setLoading(true);
      
      const data = await SupabaseService.signIn(email, password);
      
      // L'état sera mis à jour par onAuthStateChange
      return data;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setLoading(false); // Arrêter le chargement en cas d'erreur
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const data = await SupabaseService.signUp(email, password, userData);
    return data;
  };

  const signOut = async () => {
    try {
      await SupabaseService.signOut();
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Forcer la déconnexion même en cas d'erreur
      setUser(null);
      setLoading(false);
    }
  };

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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDepartments = async () => {
    try {
      console.log('[useDepartments] Début du chargement des départements...');
      setLoading(true);
      const data = await SupabaseService.getDepartments();
      console.log('[useDepartments] Départements chargés:', data);
      setDepartments(data);
      setError(null);
    } catch (err) {
      console.error('[useDepartments] Erreur lors du chargement des départements:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const createDepartment = async (nom: string) => {
    try {
      const newDept = await SupabaseService.createDepartment(nom);
      setDepartments(prev => [...prev, newDept]);
      return newDept;
    } catch (err) {
      throw err;
    }
  };

  const updateDepartment = async (id: string, nom: string) => {
    try {
      const updatedDept = await SupabaseService.updateDepartment(id, nom);
      setDepartments(prev => prev.map(d => d.id === id ? updatedDept : d));
      return updatedDept;
    } catch (err) {
      throw err;
    }
  };

  const deleteDepartment = async (id: string) => {
    try {
      await SupabaseService.deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    departments,
    loading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refetch: loadDepartments
  };
}

// Hook for users
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      console.log('[useUsers] Début du chargement des utilisateurs...');
      setLoading(true);
      const data = await SupabaseService.getUsers();
      console.log('[useUsers] Utilisateurs chargés:', data);
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('[useUsers] Erreur lors du chargement des utilisateurs:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUser = async (id: string, userData: any) => {
    try {
      const updatedUser = await SupabaseService.updateUser(id, userData);
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      return updatedUser;
    } catch (err) {
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await SupabaseService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    updateUser,
    deleteUser,
    refetch: loadUsers
  };
}

// Hook for projects
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      console.log('[useProjects] Début du chargement des projets...');
      setLoading(true);
      const data = await SupabaseService.getProjects();
      console.log('[useProjects] Projets chargés:', data);
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error('[useProjects] Erreur lors du chargement des projets:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const createProject = async (projectData: any) => {
    try {
      const newProject = await SupabaseService.createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err) {
      throw err;
    }
  };

  const updateProject = async (id: string, projectData: any) => {
    try {
      const updatedProject = await SupabaseService.updateProject(id, projectData);
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await SupabaseService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: loadProjects
  };
}