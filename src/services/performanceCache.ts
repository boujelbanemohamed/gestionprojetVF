import { UserPerformanceData, DepartmentPerformanceData, ProjectPerformanceData } from './performanceService';

interface CachedPerformanceData {
  userPerformance: UserPerformanceData[];
  departmentPerformance: DepartmentPerformanceData[];
  projectPerformance: ProjectPerformanceData[];
  timestamp: number;
  projectsHash: string;
  usersHash: string;
}

class PerformanceCache {
  private static readonly CACHE_KEY = 'performance_data_cache';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Générer un hash simple pour les données d'entrée
  private static generateHash(data: any[]): string {
    return data.map(item => item.id).sort().join(',');
  }

  // Vérifier si le cache est valide
  private static isCacheValid(cached: CachedPerformanceData, projects: any[], users: any[]): boolean {
    const now = Date.now();
    const isNotExpired = (now - cached.timestamp) < this.CACHE_DURATION;
    const projectsMatch = cached.projectsHash === this.generateHash(projects);
    const usersMatch = cached.usersHash === this.generateHash(users);
    
    return isNotExpired && projectsMatch && usersMatch;
  }

  // Sauvegarder les données en cache
  static saveToCache(
    userPerformance: UserPerformanceData[],
    departmentPerformance: DepartmentPerformanceData[],
    projectPerformance: ProjectPerformanceData[],
    projects: any[],
    users: any[]
  ): void {
    try {
      const cacheData: CachedPerformanceData = {
        userPerformance,
        departmentPerformance,
        projectPerformance,
        timestamp: Date.now(),
        projectsHash: this.generateHash(projects),
        usersHash: this.generateHash(users)
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 Données de performance sauvegardées en cache');
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder le cache de performance:', error);
    }
  }

  // Récupérer les données du cache
  static getFromCache(projects: any[], users: any[]): CachedPerformanceData | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const parsedCache: CachedPerformanceData = JSON.parse(cached);
      
      if (this.isCacheValid(parsedCache, projects, users)) {
        console.log('📦 Données de performance récupérées du cache');
        return parsedCache;
      } else {
        console.log('🗑️ Cache de performance expiré ou invalide');
        this.clearCache();
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors de la récupération du cache de performance:', error);
      this.clearCache();
      return null;
    }
  }

  // Vider le cache
  static clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      console.log('🗑️ Cache de performance vidé');
    } catch (error) {
      console.warn('⚠️ Erreur lors du vidage du cache de performance:', error);
    }
  }

  // Obtenir les statistiques du cache
  static getCacheStats(): { size: number; age: number | null } {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return { size: 0, age: null };

      const parsedCache: CachedPerformanceData = JSON.parse(cached);
      const age = Date.now() - parsedCache.timestamp;
      const size = new Blob([cached]).size;

      return { size, age };
    } catch (error) {
      return { size: 0, age: null };
    }
  }
}

export default PerformanceCache;
