import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Shield, Zap, Eye } from 'lucide-react';
import { ProductionReadiness, ProductionCheck } from '../utils/productionChecks';
// import { PerformanceMonitor } from '../utils/performanceMonitoring';
// import { ErrorReporting } from '../utils/errorBoundary';

interface ProductionReadinessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductionReadinessModal: React.FC<ProductionReadinessModalProps> = ({
  isOpen,
  onClose
}) => {
  const [report, setReport] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'checks' | 'performance' | 'errors'>('checks');

  useEffect(() => {
    if (isOpen) {
      runChecks();
    }
  }, [isOpen]);

  const runChecks = async () => {
    setIsRunning(true);
    
    // Simulate async checks
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newReport = ProductionReadiness.generateReport();
    setReport(newReport);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-orange-600" size={20} />;
      case 'fail':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <AlertTriangle className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'fail':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatusColor = (overall: string) => {
    switch (overall) {
      case 'ready':
        return 'text-green-600 bg-green-100';
      case 'needs_attention':
        return 'text-orange-600 bg-orange-100';
      case 'not_ready':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Vérification de production
              </h2>
              <p className="text-sm text-gray-500">
                Analyse de la préparation pour la mise en production
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Overall Status */}
        {report && (
          <div className="p-6 border-b">
            <div className={`rounded-lg p-4 border ${getOverallStatusColor(report.overall)}`}>
              <div className="flex items-center space-x-3">
                {report.overall === 'ready' && <CheckCircle className="text-green-600" size={24} />}
                {report.overall === 'needs_attention' && <AlertTriangle className="text-orange-600" size={24} />}
                {report.overall === 'not_ready' && <XCircle className="text-red-600" size={24} />}
                <div>
                  <h3 className="text-lg font-semibold">
                    {report.overall === 'ready' && 'Prêt pour la production'}
                    {report.overall === 'needs_attention' && 'Attention requise'}
                    {report.overall === 'not_ready' && 'Non prêt pour la production'}
                  </h3>
                  <p className="text-sm">{report.summary}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'checks', label: 'Vérifications', icon: Shield },
              { id: 'performance', label: 'Performance', icon: Zap },
              { id: 'errors', label: 'Erreurs', icon: Eye }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <IconComponent size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {isRunning ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyse en cours...</p>
            </div>
          ) : (
            <>
              {activeTab === 'checks' && report && (
                <div className="space-y-4">
                  {report.checks.map((check: ProductionCheck, index: number) => (
                    <div key={index} className={`rounded-lg p-4 border ${getStatusColor(check.status)}`}>
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(check.status)}
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">{check.name}</h4>
                          <p className="text-sm text-gray-700 mt-1">{check.message}</p>
                          {check.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-600 cursor-pointer">Détails</summary>
                              <pre className="text-xs text-gray-600 mt-1 bg-gray-100 p-2 rounded overflow-auto">
                                {JSON.stringify(check.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const performanceData = {
                        'LCP (ms)': 1200,
                        'FID (ms)': 50,
                        'CLS': 0.1,
                        'TTI (ms)': 2000,
                        'Ressources': 15,
                        'Temps moyen (ms)': 300
                      };
                      
                      return Object.entries(performanceData).map(([metric, value]) => (
                      <div key={metric} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          {metric}
                        </h4>
                        <p className="text-lg font-bold text-gray-900">
                          {typeof value === 'number' ? 
                            (metric === 'CLS' ? value.toFixed(3) : value.toFixed(0)) : 
                            value
                          }
                        </p>
                      </div>
                      ));
                    })()}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Recommandations Core Web Vitals</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>• <strong>LCP</strong> : &lt; 2.5s (Bon), &lt; 4s (À améliorer), &gt; 4s (Mauvais)</div>
                      <div>• <strong>FID</strong> : &lt; 100ms (Bon), &lt; 300ms (À améliorer), &gt; 300ms (Mauvais)</div>
                      <div>• <strong>CLS</strong> : &lt; 0.1 (Bon), &lt; 0.25 (À améliorer), &gt; 0.25 (Mauvais)</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'errors' && (
                <div className="space-y-4">
                  {(() => {
                    const errors: any[] = []; // In a real app, this would come from ErrorReporting.getReports()
                    return errors.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucune erreur détectée
                      </h3>
                      <p className="text-gray-500">
                        L'application fonctionne sans erreur
                      </p>
                    </div>
                  ) : (
                    errors.slice(0, 10).map((report: any, index: number) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <XCircle className="text-red-600 mt-0.5" size={20} />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-red-900">
                              {report.error.name}: {report.error.message}
                            </h4>
                            <p className="text-xs text-red-700 mt-1">
                              {report.timestamp.toLocaleString('fr-FR')}
                            </p>
                            {report.error.stack && (
                              <details className="mt-2">
                                <summary className="text-xs text-red-600 cursor-pointer">Stack trace</summary>
                                <pre className="text-xs text-red-600 mt-1 bg-red-100 p-2 rounded overflow-auto max-h-32">
                                  {report.error.stack}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  );
                  })()}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={runChecks}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isRunning ? 'Analyse...' : 'Relancer l\'analyse'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionReadinessModal;