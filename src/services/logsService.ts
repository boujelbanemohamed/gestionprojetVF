import { supabase } from './supabase';

export interface LogEntry {
  id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: string;
  stack_trace?: string;
  user_id?: string;
  url?: string;
  user_agent?: string;
  ip_address?: string;
  created_at: Date;
  metadata?: Record<string, any>;
}

export interface LogStats {
  total_logs: number;
  error_count: number;
  warn_count: number;
  info_count: number;
  debug_count: number;
  last_24h_count: number;
}

export class LogsService {
  /**
   * Enregistre un log en base de données
   */
  static async log(
    level: 'error' | 'warn' | 'info' | 'debug',
    message: string,
    context?: string,
    stackTrace?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const logData = {
        level,
        message,
        context: context || 'application',
        stack_trace: stackTrace,
        user_id: user?.id || null,
        url: window.location.href,
        user_agent: navigator.userAgent,
        metadata: metadata || {}
      };

      const { error } = await supabase
        .from('app_logs')
        .insert(logData);

      if (error) {
        console.error('Erreur lors de l\'enregistrement du log:', error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du log:', error);
    }
  }

  /**
   * Récupère les logs avec filtres
   */
  static async getLogs(
    level?: string,
    context?: string,
    userId?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<LogEntry[]> {
    try {
      let query = supabase
        .from('app_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (level && level !== 'all') {
        query = query.eq('level', level);
      }

      if (context) {
        query = query.eq('context', context);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des logs:', error);
        return [];
      }

      return data?.map(log => ({
        ...log,
        created_at: new Date(log.created_at)
      })) || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques des logs
   */
  static async getLogsStats(): Promise<LogStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_logs_stats');

      if (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  }

  /**
   * Supprime les logs
   */
  static async deleteLogs(logIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_logs')
        .delete()
        .in('id', logIds);

      if (error) {
        console.error('Erreur lors de la suppression des logs:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression des logs:', error);
      return false;
    }
  }

  /**
   * Nettoie les anciens logs
   */
  static async cleanupOldLogs(): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc('cleanup_old_logs');

      if (error) {
        console.error('Erreur lors du nettoyage des logs:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error);
      return false;
    }
  }

  /**
   * Recherche dans les logs
   */
  static async searchLogs(
    searchTerm: string,
    level?: string,
    context?: string,
    limit: number = 100
  ): Promise<LogEntry[]> {
    try {
      let query = supabase
        .from('app_logs')
        .select('*')
        .or(`message.ilike.%${searchTerm}%,context.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (level && level !== 'all') {
        query = query.eq('level', level);
      }

      if (context) {
        query = query.eq('context', context);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la recherche des logs:', error);
        return [];
      }

      return data?.map(log => ({
        ...log,
        created_at: new Date(log.created_at)
      })) || [];
    } catch (error) {
      console.error('Erreur lors de la recherche des logs:', error);
      return [];
    }
  }
}

// Fonctions utilitaires pour logger facilement
export const logger = {
  error: (message: string, context?: string, stackTrace?: string, metadata?: Record<string, any>) => 
    LogsService.log('error', message, context, stackTrace, metadata),
  
  warn: (message: string, context?: string, metadata?: Record<string, any>) => 
    LogsService.log('warn', message, context, undefined, metadata),
  
  info: (message: string, context?: string, metadata?: Record<string, any>) => 
    LogsService.log('info', message, context, undefined, metadata),
  
  debug: (message: string, context?: string, metadata?: Record<string, any>) => 
    LogsService.log('debug', message, context, undefined, metadata)
};
