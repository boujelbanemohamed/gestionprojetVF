import React, { useState } from 'react';
import { Database, ExternalLink, Copy, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

const SupabaseConnectionGuide: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const steps = [
    {
      title: "Créer un projet Supabase",
      description: "Créez votre compte et votre premier projet",
      action: "Aller sur Supabase",
      link: "https://supabase.com"
    },
    {
      title: "Configurer la base de données",
      description: "Exécutez le script SQL pour créer les tables",
      action: "Copier le script SQL",
      content: "create_complete_schema.sql"
    },
    {
      title: "Récupérer les clés API",
      description: "Copiez votre URL et votre clé anonyme",
      action: "Aller dans Settings > API"
    },
    {
      title: "Connecter l'application",
      description: "Configurez les variables d'environnement",
      action: "Tester la connexion"
    }
  ];

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const testConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      alert('Veuillez remplir l\'URL et la clé');
      return;
    }

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (response.ok || response.status === 404) {
        setIsConnected(true);
        alert('Connexion réussie ! Vous pouvez maintenant déployer votre application.');
      } else {
        alert('Erreur de connexion. Vérifiez vos paramètres.');
      }
    } catch (error) {
      alert('Erreur de connexion. Vérifiez votre URL et votre clé.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Database className="text-blue-600" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Configuration Supabase pour la Production
        </h1>
        <p className="text-gray-600">
          Suivez ces étapes pour configurer votre base de données et déployer votre application
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <span className="text-sm font-medium text-gray-700">{currentStep}/4</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;
          
          return (
            <div
              key={stepNumber}
              className={`border rounded-lg p-6 transition-all ${
                isActive ? 'border-blue-500 bg-blue-50' : 
                isCompleted ? 'border-green-500 bg-green-50' : 
                'border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                  isCompleted ? 'bg-green-600 text-white' :
                  isActive ? 'bg-blue-600 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? <CheckCircle size={16} /> : stepNumber}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {step.description}
                  </p>

                  {/* Step-specific content */}
                  {stepNumber === 1 && isActive && (
                    <div className="space-y-4">
                      <a
                        href="https://supabase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <span>Créer un projet Supabase</span>
                        <ExternalLink size={16} />
                      </a>
                      <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Instructions :</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                          <li>Créez un compte sur Supabase</li>
                          <li>Cliquez sur "New Project"</li>
                          <li>Donnez un nom à votre projet</li>
                          <li>Choisissez une région proche</li>
                          <li>Créez un mot de passe sécurisé</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {stepNumber === 2 && isActive && (
                    <div className="space-y-4">
                      <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-medium text-yellow-900 mb-2">Script SQL à exécuter :</h4>
                        <p className="text-sm text-yellow-800 mb-3">
                          Copiez le contenu du fichier <code>supabase/migrations/create_complete_schema.sql</code> 
                          et exécutez-le dans le SQL Editor de Supabase.
                        </p>
                        <button
                          onClick={() => handleCopyToClipboard('-- Voir le fichier supabase/migrations/create_complete_schema.sql')}
                          className="inline-flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                        >
                          <Copy size={14} />
                          <span>Copier le chemin</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {stepNumber === 3 && isActive && (
                    <div className="space-y-4">
                      <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-2">Récupérer vos clés :</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                          <li>Dans votre dashboard Supabase, allez dans <strong>Settings</strong></li>
                          <li>Cliquez sur <strong>API</strong></li>
                          <li>Copiez l'<strong>URL du projet</strong></li>
                          <li>Copiez la <strong>clé anon public</strong></li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {stepNumber === 4 && isActive && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL Supabase
                          </label>
                          <input
                            type="url"
                            value={supabaseUrl}
                            onChange={(e) => setSupabaseUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://votre-projet.supabase.co"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Clé anonyme
                          </label>
                          <textarea
                            value={supabaseKey}
                            onChange={(e) => setSupabaseKey(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          />
                        </div>
                        <button
                          onClick={testConnection}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Tester la connexion
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                      disabled={currentStep === 1}
                      className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Précédent
                    </button>
                    
                    <button
                      onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                      disabled={currentStep === 4}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      <span>Suivant</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Success Message */}
      {isConnected && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Connexion Supabase réussie !
              </h3>
              <p className="text-green-700 mt-1">
                Votre application est maintenant prête pour le déploiement en production.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          🚀 Prochaines étapes pour le déploiement
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span>Exécutez <code className="bg-blue-200 px-2 py-1 rounded">npm run build</code></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span>Déployez sur Netlify ou Vercel</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>Configurez les variables d'environnement sur votre plateforme</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <span>Créez votre premier compte Super Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionGuide;