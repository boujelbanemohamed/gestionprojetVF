// Data synchronization and state management
export interface SyncState<T> {
  data: T;
  lastSync: Date;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
}

export class DataSync {
  private static syncStates: Map<string, SyncState<any>> = new Map();
  private static listeners: Map<string, ((state: SyncState<any>) => void)[]> = new Map();

  static setState<T>(key: string, data: T, isDirty: boolean = false): void {
    const currentState = this.syncStates.get(key);
    
    const newState: SyncState<T> = {
      data,
      lastSync: isDirty ? (currentState?.lastSync || new Date()) : new Date(),
      isDirty,
      isLoading: false,
      error: null
    };

    this.syncStates.set(key, newState);
    this.notifyListeners(key, newState);
  }

  static getState<T>(key: string): SyncState<T> | null {
    return this.syncStates.get(key) || null;
  }

  static setLoading(key: string, isLoading: boolean): void {
    const currentState = this.syncStates.get(key);
    if (currentState) {
      const newState = { ...currentState, isLoading };
      this.syncStates.set(key, newState);
      this.notifyListeners(key, newState);
    }
  }

  static setError(key: string, error: string | null): void {
    const currentState = this.syncStates.get(key);
    if (currentState) {
      const newState = { ...currentState, error, isLoading: false };
      this.syncStates.set(key, newState);
      this.notifyListeners(key, newState);
    }
  }

  static markDirty(key: string): void {
    const currentState = this.syncStates.get(key);
    if (currentState) {
      const newState = { ...currentState, isDirty: true };
      this.syncStates.set(key, newState);
      this.notifyListeners(key, newState);
    }
  }

  static subscribe<T>(
    key: string, 
    listener: (state: SyncState<T>) => void
  ): () => void {
    const keyListeners = this.listeners.get(key) || [];
    keyListeners.push(listener);
    this.listeners.set(key, keyListeners);

    return () => {
      const updatedListeners = this.listeners.get(key)?.filter(l => l !== listener) || [];
      this.listeners.set(key, updatedListeners);
    };
  }

  private static notifyListeners(key: string, state: SyncState<any>): void {
    const keyListeners = this.listeners.get(key) || [];
    keyListeners.forEach(listener => listener(state));
  }

  // Batch operations
  static batchUpdate(updates: { key: string; data: any }[]): void {
    updates.forEach(({ key, data }) => {
      this.setState(key, data, true);
    });
  }

  // Auto-sync functionality
  static startAutoSync(key: string, syncFunction: () => Promise<any>, interval: number = 30000): () => void {
    const intervalId = setInterval(async () => {
      const state = this.getState(key);
      if (state && state.isDirty) {
        try {
          this.setLoading(key, true);
          const result = await syncFunction();
          this.setState(key, result, false);
        } catch (error) {
          this.setError(key, error instanceof Error ? error.message : 'Sync failed');
        }
      }
    }, interval);

    return () => clearInterval(intervalId);
  }

  // Conflict resolution
  static resolveConflict<T>(
    key: string,
    localData: T,
    serverData: T,
    resolver: (local: T, server: T) => T
  ): void {
    const resolvedData = resolver(localData, serverData);
    this.setState(key, resolvedData, false);
  }
}

// React hook for data sync
export function useDataSync<T>(
  key: string,
  initialData: T,
  syncFunction?: () => Promise<T>
) {
  const [state, setState] = useState<SyncState<T>>(() => 
    DataSync.getState<T>(key) || {
      data: initialData,
      lastSync: new Date(),
      isDirty: false,
      isLoading: false,
      error: null
    }
  );

  useEffect(() => {
    const unsubscribe = DataSync.subscribe<T>(key, setState);
    return unsubscribe;
  }, [key]);

  const updateData = (newData: T) => {
    DataSync.setState(key, newData, true);
  };

  const sync = async () => {
    if (!syncFunction) return;

    try {
      DataSync.setLoading(key, true);
      const result = await syncFunction();
      DataSync.setState(key, result, false);
    } catch (error) {
      DataSync.setError(key, error instanceof Error ? error.message : 'Sync failed');
    }
  };

  return {
    ...state,
    updateData,
    sync,
    markDirty: () => DataSync.markDirty(key)
  };
}