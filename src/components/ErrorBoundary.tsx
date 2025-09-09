import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
// import { ErrorReporting } from '../utils/errorBoundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });
    
    // Log error to our error reporting system
    // ErrorReporting.captureError(error, errorInfo);
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" data-error-boundary="true">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="p-3 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Oups ! Une erreur est survenue
            </h1>
            
            <p className="text-gray-600 mb-6">
              Une erreur inattendue s'est produite. Nous nous excusons pour la gêne occasionnée.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Détails de l'erreur :</h3>
                <pre className="text-xs text-gray-700 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.message}
                  {this.state.error.stack && '\n\n' + this.state.error.stack}
                </pre>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw size={16} />
                <span>Réessayer</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <Home size={16} />
                <span>Accueil</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Si le problème persiste, veuillez contacter l'administrateur.
            </p>
          </div>
        </div>
      );
    }

    return <div data-error-boundary="wrapper">{this.props.children}</div>;
  }
}

export default ErrorBoundary;