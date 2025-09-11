import { useState, useEffect, useCallback } from 'react';
import { PerformanceService, UserPerformanceData, DepartmentPerformanceData, ProjectPerformanceData } from '../services/performanceService';
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

  const refreshData = useCallback(async () => {
    if (projects.length === 0 || users.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Actualisation des données de performance...');
      const startTime = Date.now();

      const data = await PerformanceService.getAllPerformanceData(projects, users);

      setUserPerformance(data.userPerformance);
      setDepartmentPerformance(data.departmentPerformance);
      setProjectPerformance(data.projectPerformance);
      setLastUpdated(new Date());

      const endTime = Date.now();
      console.log(`✅ Données de performance actualisées en ${endTime - startTime}ms`);

    } catch (err) {
      console.error('❌ Erreur lors de l\'actualisation des données de performance:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [projects, users]);

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
