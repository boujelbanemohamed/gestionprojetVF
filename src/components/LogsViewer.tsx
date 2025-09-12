import React, { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, Filter, Search, AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: string;
  stack?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
}

interface LogsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Collecter les logs depuis la console
  const collectLogs = () => {
    setIsLoading(true);
    
    // Simuler la collecte de logs depuis différentes sources
    const collectedLogs: LogEntry[] = [];
    
    // Logs d'erreur JavaScript
    const errorLogs = window.console.error ? [] : [];
    
    // Logs de performance
    if (window.performance && window.performance.getEntriesByType) {
      const perfEntries = window.performance.getEntriesByType('navigation');
      perfEntries.forEach(entry => {
        collectedLogs.push({
          id: `perf-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          level: 'info',
          message: `Page load time: ${entry.duration.toFixed(2)}ms`,
          context: 'performance'
        });
      });
    }
    
    // Logs d'erreur réseau (simulés)
    const networkErrors = [
      {
        id: `network-${Date.now()}-1`,
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        level: 'error' as const,
        message: 'Failed to fetch project members: 400 Bad Request',
        context: 'network',
        url: '/api/project-members'
      },
      {
        id: `network-${Date.now()}-2`,
        timestamp: new Date(Date.now() - 180000), // 3 minutes ago
        level: 'error' as const,
        message: 'Supabase query failed: column users_1.departement does not exist',
        context: 'database',
        url: '/api/projects'
      }
    ];
    
    // Logs d'application
    const appLogs = [
      {
        id: `app-${Date.now()}-1`,
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        level: 'info' as const,
        message: 'User logged in successfully',
        context: 'auth',
        userId: 'current-user-id'
      },
      {
        id: `app-${Date.now()}-2`,
        timestamp: new Date(Date.now() - 240000), // 4 minutes ago
        level: 'warn' as const,
        message: 'Project data not found for ID: 815ce7ad-5bec-4307-b9b8-6fbd1bdc885c',
        context: 'project-detail'
      },
      {
        id: `app-${Date.now()}-3`,
        timestamp: new Date(Date.now() - 120000), // 2 minutes ago
        level: 'error' as const,
        message: 'ErrorBoundary caught error: Cannot read property of undefined',
        context: 'error-boundary',
        stack: 'TypeError: Cannot read property of undefined\n    at ProjectDetail.tsx:123:45'
      }
    ];
    
    const allLogs = [...collectedLogs, ...networkErrors, ...appLogs];
    setLogs(allLogs);
    setFilteredLogs(allLogs);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      collectLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isOpen) {
      interval = setInterval(collectLogs, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isOpen]);

  useEffect(() => {
    let filtered = logs;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.context?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }
    
    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warn':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'debug':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const exportLogs = () => {
    const logData = filteredLogs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      message: log.message,
      context: log.context,
      userId: log.userId,
      url: log.url
    }));
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tous les logs ?')) {
      setLogs([]);
      setFilteredLogs([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Logs de l'application</h2>
              <p className="text-sm text-gray-500">Surveillance en temps réel des erreurs et événements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher dans les logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les niveaux</option>
              <option value="error">Erreurs</option>
              <option value="warn">Avertissements</option>
              <option value="info">Informations</option>
              <option value="debug">Debug</option>
            </select>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={collectLogs}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  autoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Auto-refresh</span>
              </button>

              <button
                onClick={exportLogs}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>

              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Effacer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-auto p-6">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun log trouvé</h3>
              <p className="text-gray-500">
                {searchTerm || levelFilter !== 'all' 
                  ? 'Aucun log ne correspond à vos critères de recherche'
                  : 'Aucun log disponible pour le moment'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {log.message}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {log.context && (
                          <span className="px-2 py-1 bg-gray-200 rounded">
                            {log.context}
                          </span>
                        )}
                        {log.userId && (
                          <span>User: {log.userId}</span>
                        )}
                        {log.url && (
                          <span>URL: {log.url}</span>
                        )}
                      </div>
                      
                      {log.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                            Voir la stack trace
                          </summary>
                          <pre className="mt-2 text-xs text-gray-700 bg-gray-100 p-2 rounded overflow-auto">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} affiché{filteredLogs.length !== 1 ? 's' : ''}
              {searchTerm || levelFilter !== 'all' ? ' (filtrés)' : ''}
            </span>
            <span>
              Dernière mise à jour: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;
