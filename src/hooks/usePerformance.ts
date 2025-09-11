import { useState, useEffect, useCallback } from 'react';
import { PerformanceService, UserPerformanceData, DepartmentPerformanceData, ProjectPerformanceData } from '../services/performanceService';
import PerformanceCache from '../services/performanceCache';
import { Project, User as UserType } from '../types';

interface UsePerformanceProps {
  projects: Project[];
  users: UserType[];
  refreshInterval?: number; // en millisecondes
}

interface UsePerformanceReturn {
  userPerformance: UserPerformanceData[];
  departmentPerformance: DepartmentPerformanceData[];
  projectPerformance: ProjectPerformanceData[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  lastUpdated: Date | null;
}

export const usePerformance = ({ 
  projects, 
  users, 
  refreshInterval = 30000 // 30 secondes par défaut
}: UsePerformanceProps): UsePerformanceReturn => {
  const [userPerformance, setUserPerformance] = useState<UserPerformanceData[]>([]);
  const [departmentPerformance, setDepartmentPerformance] = useState<DepartmentPerformanceData[]>([]);
  const [projectPerformance, setProjectPerformance] = useState<ProjectPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshData = useCallback(async (forceRefresh = false) => {
    if (projects.length === 0 || users.length === 0) {
      console.log('⚠️ Pas de projets ou d\'utilisateurs, arrêt du chargement');
      setLoading(false);
      return;
    }

    // Vérifier le cache d'abord (sauf si forceRefresh)
    if (!forceRefresh) {
      const cachedData = PerformanceCache.getFromCache(projects, users);
      if (cachedData) {
        console.log('📦 Utilisation des données en cache');
        setUserPerformance(cachedData.userPerformance);
        setDepartmentPerformance(cachedData.departmentPerformance);
        setProjectPerformance(cachedData.projectPerformance);
        setLastUpdated(new Date(cachedData.timestamp));
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Actualisation des données de performance...', {
        projectsCount: projects.length,
        usersCount: users.length,
        forceRefresh
      });
      const startTime = Date.now();

      const data = await PerformanceService.getAllPerformanceData(projects, users);

      console.log('📊 Données récupérées:', {
        userPerformance: data.userPerformance.length,
        departmentPerformance: data.departmentPerformance.length,
        projectPerformance: data.projectPerformance.length
      });

      // Sauvegarder en cache
      PerformanceCache.saveToCache(
        data.userPerformance,
        data.departmentPerformance,
        data.projectPerformance,
        projects,
        users
      );

      setUserPerformance(data.userPerformance);
      setDepartmentPerformance(data.departmentPerformance);
      setProjectPerformance(data.projectPerformance);
      setLastUpdated(new Date());

      const endTime = Date.now();
      console.log(`✅ Données de performance actualisées en ${endTime - startTime}ms`);

    } catch (err) {
      console.error('❌ Erreur lors de l\'actualisation des données de performance:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // En cas d'erreur, essayer de récupérer du cache
      const cachedData = PerformanceCache.getFromCache(projects, users);
      if (cachedData) {
        console.log('📦 Utilisation du cache en cas d\'erreur');
        setUserPerformance(cachedData.userPerformance);
        setDepartmentPerformance(cachedData.departmentPerformance);
        setProjectPerformance(cachedData.projectPerformance);
        setLastUpdated(new Date(cachedData.timestamp));
      } else if (userPerformance.length === 0 && departmentPerformance.length === 0 && projectPerformance.length === 0) {
        setUserPerformance([]);
        setDepartmentPerformance([]);
        setProjectPerformance([]);
      }
    } finally {
      setLoading(false);
    }
  }, [projects, users, userPerformance.length, departmentPerformance.length, projectPerformance.length]);

  // Charger les données initiales
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Actualisation automatique
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  return {
    userPerformance,
    departmentPerformance,
    projectPerformance,
    loading,
    error,
    refreshData,
    lastUpdated
  };
};
