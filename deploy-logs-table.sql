-- Script pour créer la table app_logs dans Supabase
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Création de la table des logs
CREATE TABLE IF NOT EXISTS app_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level VARCHAR(10) NOT NULL CHECK (level IN ('error', 'warn', 'info', 'debug')),
  message TEXT NOT NULL,
  context VARCHAR(100),
  stack_trace TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON app_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_app_logs_context ON app_logs(context);

-- RLS (Row Level Security)
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;

-- Politique : Seuls les super admins peuvent voir tous les logs
CREATE POLICY "Super admins can view all logs" ON app_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Politique : Les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view their own logs" ON app_logs
  FOR SELECT USING (user_id = auth.uid());

-- Politique : Seuls les super admins peuvent insérer des logs
CREATE POLICY "Super admins can insert logs" ON app_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Politique : Seuls les super admins peuvent supprimer des logs
CREATE POLICY "Super admins can delete logs" ON app_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'SUPER_ADMIN'
    )
  );

-- Fonction pour nettoyer les anciens logs (plus de 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM app_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques des logs
CREATE OR REPLACE FUNCTION get_logs_stats()
RETURNS TABLE (
  total_logs BIGINT,
  error_count BIGINT,
  warn_count BIGINT,
  info_count BIGINT,
  debug_count BIGINT,
  last_24h_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_logs,
    COUNT(*) FILTER (WHERE level = 'error') as error_count,
    COUNT(*) FILTER (WHERE level = 'warn') as warn_count,
    COUNT(*) FILTER (WHERE level = 'info') as info_count,
    COUNT(*) FILTER (WHERE level = 'debug') as debug_count,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h_count
  FROM app_logs;
END;
$$ LANGUAGE plpgsql;
