// Dynamic data loading utilities for production
export interface DataSource {
  id: string;
  name: string;
  endpoint?: string;
  transformer?: (data: any) => any;
  cache?: boolean;
  ttl?: number;
}

export class DynamicDataLoader {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static async loadData<T>(source: DataSource): Promise<T> {
    // Check cache first
    if (source.cache) {
      const cached = this.getCachedData<T>(source.id);
      if (cached) {
        return cached;
      }
    }

    try {
      let data: any;

      if (source.endpoint) {
        // Load from API
        const response = await fetch(source.endpoint);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        data = await response.json();
      } else {
        // Load from localStorage or other source
        const stored = localStorage.getItem(source.id);
        data = stored ? JSON.parse(stored) : null;
      }

      // Transform data if transformer provided
      if (source.transformer && data) {
        data = source.transformer(data);
      }

      // Cache if enabled
      if (source.cache && data) {
        this.setCachedData(source.id, data, source.ttl || 300000); // 5 minutes default
      }

      return data;
    } catch (error) {
      console.error(`Failed to load data from ${source.name}:`, error);
      throw error;
    }
  }

  private static getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private static setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  static preloadData(sources: DataSource[]): Promise<void[]> {
    return Promise.all(sources.map(source => this.loadData(source)));
  }
}

// Data sources configuration
export const DATA_SOURCES: Record<string, DataSource> = {
  projects: {
    id: 'projects',
    name: 'Projects',
    cache: true,
    ttl: 300000, // 5 minutes
    transformer: (data) => {
      // Ensure dates are properly converted
      return data.map((project: any) => ({
        ...project,
        created_at: new Date(project.created_at),
        updated_at: new Date(project.updated_at),
        date_debut: project.date_debut ? new Date(project.date_debut) : undefined,
        date_fin: project.date_fin ? new Date(project.date_fin) : undefined,
        taches: project.taches.map((task: any) => ({
          ...task,
          date_realisation: new Date(task.date_realisation),
          commentaires: task.commentaires?.map((comment: any) => ({
            ...comment,
            created_at: new Date(comment.created_at)
          })) || []
        }))
      }));
    }
  },
  users: {
    id: 'users',
    name: 'Users',
    cache: true,
    ttl: 600000, // 10 minutes
    transformer: (data) => {
      return data.map((user: any) => ({
        ...user,
        created_at: new Date(user.created_at)
      }));
    }
  },
  departments: {
    id: 'departments',
    name: 'Departments',
    cache: true,
    ttl: 1800000, // 30 minutes
    transformer: (data) => {
      return data.map((dept: any) => ({
        ...dept,
        created_at: new Date(dept.created_at)
      }));
    }
  }
};