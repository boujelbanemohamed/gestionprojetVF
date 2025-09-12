import React, { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, Filter, Search, AlertTriangle, Info, XCircle, CheckCircle } from 'lucide-react';
import { LogsService, LogEntry, LogStats } from '../services/logsService';

// Utiliser l'interface LogEntry du service

interface LogsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);

  // Charger les logs depuis la base de données
  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const [logsData, statsData] = await Promise.all([
        LogsService.getLogs(levelFilter === 'all' ? undefined : levelFilter, contextFilter === 'all' ? undefined : contextFilter),
        LogsService.getLogsStats()
      ]);
      
      setLogs(logsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Rechercher dans les logs
  const searchLogs = async () => {
    if (!searchTerm.trim()) {
      loadLogs();
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await LogsService.searchLogs(
        searchTerm,
        levelFilter === 'all' ? undefined : levelFilter,
        contextFilter === 'all' ? undefined : contextFilter
      );
      setLogs(searchResults);
    } catch (error) {
      console.error('Erreur lors de la recherche des logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && isOpen) {
      interval = setInterval(loadLogs, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isOpen]);

  useEffect(() => {
    setFilteredLogs(logs);
  }, [logs]);

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
      timestamp: log.created_at.toISOString(),
      level: log.level,
      message: log.message,
      context: log.context,
      user_id: log.user_id,
      url: log.url,
      user_agent: log.user_agent,
      stack_trace: log.stack_trace,
      metadata: log.metadata
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

  const deleteSelectedLogs = async () => {
    if (selectedLogs.length === 0) {
      alert('Aucun log sélectionné');
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedLogs.length} log(s) ?`)) {
      const success = await LogsService.deleteLogs(selectedLogs);
      if (success) {
        setSelectedLogs([]);
        loadLogs(); // Recharger les logs
      } else {
        alert('Erreur lors de la suppression des logs');
      }
    }
  };

  const clearAllLogs = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tous les logs ? Cette action est irréversible.')) {
      const success = await LogsService.cleanupOldLogs();
      if (success) {
        loadLogs(); // Recharger les logs
      } else {
        alert('Erreur lors du nettoyage des logs');
      }
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

            {/* Context Filter */}
            <select
              value={contextFilter}
              onChange={(e) => setContextFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les contextes</option>
              <option value="application">Application</option>
              <option value="auth">Authentification</option>
              <option value="database">Base de données</option>
              <option value="network">Réseau</option>
              <option value="error-boundary">Error Boundary</option>
              <option value="performance">Performance</option>
            </select>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={loadLogs}
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
                onClick={deleteSelectedLogs}
                disabled={selectedLogs.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer sélectionnés</span>
              </button>

              <button
                onClick={clearAllLogs}
                className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Nettoyer anciens</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total_logs}</div>
                <div className="text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.error_count}</div>
                <div className="text-gray-500">Erreurs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.warn_count}</div>
                <div className="text-gray-500">Avertissements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.info_count}</div>
                <div className="text-gray-500">Infos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.debug_count}</div>
                <div className="text-gray-500">Debug</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.last_24h_count}</div>
                <div className="text-gray-500">24h</div>
              </div>
            </div>
          </div>
        )}

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
                    <input
                      type="checkbox"
                      checked={selectedLogs.includes(log.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLogs([...selectedLogs, log.id]);
                        } else {
                          setSelectedLogs(selectedLogs.filter(id => id !== log.id));
                        }
                      }}
                      className="mt-1"
                    />
                    {getLevelIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {log.message}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.created_at.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {log.context && (
                          <span className="px-2 py-1 bg-gray-200 rounded">
                            {log.context}
                          </span>
                        )}
                        {log.user_id && (
                          <span>User: {log.user_id}</span>
                        )}
                        {log.url && (
                          <span>URL: {log.url}</span>
                        )}
                      </div>
                      
                      {log.stack_trace && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                            Voir la stack trace
                          </summary>
                          <pre className="mt-2 text-xs text-gray-700 bg-gray-100 p-2 rounded overflow-auto">
                            {log.stack_trace}
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
