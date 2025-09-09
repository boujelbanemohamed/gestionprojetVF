import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';
import SupabaseConnectionModal from './SupabaseConnectionModal';

const SupabaseSetupButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const hasValidUrl = url && url !== 'your_supabase_project_url' && url.trim() !== '';
    const hasValidKey = key && key !== 'your_supabase_anon_key' && key.trim() !== '';
    
    setIsConnected(!!(hasValidUrl && hasValidKey));
    setIsChecking(false);
  };

  const handleConnect = (url: string, key: string) => {
    // Validation des paramètres
    if (!url || !key) {
      alert('URL et clé Supabase requises');
      return;
    }
    
    console.log('Configuration Supabase:', { 
      url, 
      keyLength: key.length,
      keyPrefix: key.substring(0, 20) + '...'
    });
    
    // Sauvegarder la configuration localement pour la session
    localStorage.setItem('supabase_config', JSON.stringify({ url, key }));
    
    setIsConnected(true);
    
    // Instructions pour la production
    const instructions = `Configuration Supabase validée !\n\nPour la production :\n1. Configurez ces variables sur votre plateforme de déploiement :\n   - VITE_SUPABASE_URL=${url}\n   - VITE_SUPABASE_ANON_KEY=${key.substring(0, 20)}...\n\n2. Exécutez le script SQL dans votre projet Supabase\n3. Déployez votre application`;
    
    alert(instructions);
  };

  if (isChecking) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        <span className="text-sm text-gray-600">Vérification...</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          isConnected
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
        }`}
      >
        {isConnected ? (
          <>
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Supabase connecté</span>
          </>
        ) : (
          <>
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Connecter Supabase</span>
          </>
        )}
      </button>

      <SupabaseConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleConnect}
      />
    </>
  );
};

export default SupabaseSetupButton;