import { useState, useEffect } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { supabase } from '../services/supabase';
import { AuthUser, User, Department, Project } from '../types';

// Hook for authentication
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fonction pour traiter une session
    const handleSession = async (session: any) => {
      if (!isMounted) return;

      if (session?.user) {
        try {
          console.log('Récupération du profil utilisateur pour:', session.user.email);
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
      } else {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Récupérer la session initiale au montage
    const getInitialSession = async () => {
      try {
        console.log('Récupération de la session initiale...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur lors de la récupération de la session initiale:', error);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        await handleSession(session);
      } catch (error) {
        console.error('Erreur lors de la récupération de la session initiale:', error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!isMounted) return;

        switch (event) {
          case 'SIGNED_IN':
            console.log('Utilisateur connecté');
            await handleSession(session);
            break;
            
          case 'SIGNED_OUT':
            console.log('Utilisateur déconnecté');
            if (isMounted) {
              setUser(null);
              setLoading(false);
            }
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('Token rafraîchi');
            await handleSession(session);
            break;
            
          default:
            // Pour les autres événements, ne rien faire
            break;
        }
      }
    );

    // Récupérer la session initiale
    getInitialSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const data = await SupabaseService.signIn(email, password);
      // L'état sera mis à jour par onAuthStateChange
      return data;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setLoading(false);
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
      // L'état sera mis à jour par onAuthStateChange
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
      setLoading(true);
      const data = await SupabaseService.getDepartments();
      setDepartments(data);
      setError(null);
    } catch (err) {
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
      setLoading(true);
      const data = await SupabaseService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
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
      setLoading(true);
      const data = await SupabaseService.getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
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