// Production readiness checks
export interface ProductionCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class ProductionReadiness {
  static runAllChecks(): ProductionCheck[] {
    const checks: ProductionCheck[] = [];

    checks.push(this.checkEnvironmentVariables());
    checks.push(this.checkBrowserCompatibility());
    checks.push(this.checkPerformance());
    checks.push(this.checkAccessibility());
    checks.push(this.checkSecurity());
    checks.push(this.checkDataIntegrity());
    checks.push(this.checkErrorHandling());

    return checks;
  }

  private static checkEnvironmentVariables(): ProductionCheck {
    const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missing = requiredVars.filter(varName => !import.meta.env[varName]);

    if (missing.length > 0) {
      return {
        name: 'Environment Variables',
        status: 'fail',
        message: `Variables d'environnement manquantes: ${missing.join(', ')}`,
        details: { missing }
      };
    }

    // Check if using default/placeholder values
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (url === 'your_supabase_project_url' || key === 'your_supabase_anon_key' || !url?.trim() || !key?.trim()) {
      return {
        name: 'Environment Variables',
        status: 'warning',
        message: 'Variables d\'environnement utilisent des valeurs par défaut',
        details: { url, key: key?.substring(0, 20) + '...' }
      };
    }

    // Validate URL format
    if (!url.includes('supabase.co') && !url.includes('localhost')) {
      return {
        name: 'Environment Variables',
        status: 'fail',
        message: 'URL Supabase invalide',
        details: { url }
      };
    }

    // Validate key format (should be a JWT)
    if (!key.startsWith('eyJ')) {
      return {
        name: 'Environment Variables',
        status: 'warning',
        message: 'Format de clé Supabase suspect',
        details: { keyPrefix: key.substring(0, 10) + '...' }
      };
    }

    return {
      name: 'Environment Variables',
      status: 'pass',
      message: 'Toutes les variables d\'environnement sont configurées'
    };
  }

  private static checkBrowserCompatibility(): ProductionCheck {
    const features = {
      'localStorage': typeof Storage !== 'undefined',
      'fetch': typeof fetch !== 'undefined',
      'Promise': typeof Promise !== 'undefined',
      'URLSearchParams': typeof URLSearchParams !== 'undefined',
      'IntersectionObserver': typeof IntersectionObserver !== 'undefined'
    };

    const unsupported = Object.entries(features)
      .filter(([, supported]) => !supported)
      .map(([feature]) => feature);

    if (unsupported.length > 0) {
      return {
        name: 'Browser Compatibility',
        status: 'fail',
        message: `Fonctionnalités non supportées: ${unsupported.join(', ')}`,
        details: { unsupported }
      };
    }

    return {
      name: 'Browser Compatibility',
      status: 'pass',
      message: 'Toutes les fonctionnalités requises sont supportées'
    };
  }

  private static checkPerformance(): ProductionCheck {
    const bundleSize = document.querySelectorAll('script[src]').length;
    const imageCount = document.querySelectorAll('img').length;
    const cssFiles = document.querySelectorAll('link[rel="stylesheet"]').length;

    if (bundleSize > 10) {
      return {
        name: 'Performance',
        status: 'warning',
        message: `Nombre élevé de scripts (${bundleSize})`,
        details: { bundleSize, imageCount, cssFiles }
      };
    }

    return {
      name: 'Performance',
      status: 'pass',
      message: 'Métriques de performance acceptables',
      details: { bundleSize, imageCount, cssFiles }
    };
  }

  private static checkAccessibility(): ProductionCheck {
    const issues: string[] = [];

    // Check for images without alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images sans attribut alt`);
    }

    // Check for buttons without accessible names
    const buttonsWithoutText = document.querySelectorAll('button:empty:not([aria-label]):not([aria-labelledby])');
    if (buttonsWithoutText.length > 0) {
      issues.push(`${buttonsWithoutText.length} boutons sans nom accessible`);
    }

    // Check for form inputs without labels
    const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const unlabeledInputs = Array.from(inputsWithoutLabels).filter(input => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    });

    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length} champs sans label`);
    }

    if (issues.length > 0) {
      return {
        name: 'Accessibility',
        status: 'warning',
        message: `Problèmes d'accessibilité détectés: ${issues.join(', ')}`,
        details: { issues }
      };
    }

    return {
      name: 'Accessibility',
      status: 'pass',
      message: 'Aucun problème d\'accessibilité majeur détecté'
    };
  }

  private static checkSecurity(): ProductionCheck {
    const issues: string[] = [];

    // Check if running on HTTPS in production
    if (import.meta.env.PROD && location.protocol !== 'https:') {
      issues.push('Application non servie en HTTPS');
    }

    // Check for exposed sensitive data
    const scripts = Array.from(document.querySelectorAll('script'));
    const hasExposedSecrets = scripts.some(script => 
      script.textContent?.includes('password') || 
      script.textContent?.includes('secret') ||
      script.textContent?.includes('private_key')
    );

    if (hasExposedSecrets) {
      issues.push('Données sensibles potentiellement exposées');
    }

    if (issues.length > 0) {
      return {
        name: 'Security',
        status: 'fail',
        message: `Problèmes de sécurité: ${issues.join(', ')}`,
        details: { issues }
      };
    }

    return {
      name: 'Security',
      status: 'pass',
      message: 'Aucun problème de sécurité majeur détecté'
    };
  }

  private static checkDataIntegrity(): ProductionCheck {
    try {
      // Test localStorage functionality
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved !== 'test') {
        return {
          name: 'Data Integrity',
          status: 'fail',
          message: 'Problème avec le stockage local'
        };
      }

      // Test JSON serialization
      const testObject = { test: true, date: new Date() };
      const serialized = JSON.stringify(testObject);
      const deserialized = JSON.parse(serialized);

      if (!deserialized.test) {
        return {
          name: 'Data Integrity',
          status: 'fail',
          message: 'Problème avec la sérialisation JSON'
        };
      }

      return {
        name: 'Data Integrity',
        status: 'pass',
        message: 'Intégrité des données vérifiée'
      };
    } catch (error) {
      return {
        name: 'Data Integrity',
        status: 'fail',
        message: 'Erreur lors de la vérification des données',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private static checkErrorHandling(): ProductionCheck {
    const hasErrorBoundary = document.querySelector('[data-error-boundary]') !== null;
    const hasGlobalErrorHandler = typeof window.onerror === 'function' && window.onerror !== null;

    if (!hasErrorBoundary && !hasGlobalErrorHandler) {
      return {
        name: 'Error Handling',
        status: 'warning',
        message: 'Aucun gestionnaire d\'erreur global détecté'
      };
    }

    if (!hasErrorBoundary) {
      return {
        name: 'Error Handling',
        status: 'warning',
        message: 'Error Boundary non détecté'
      };
    }

    if (!hasGlobalErrorHandler) {
      return {
        name: 'Error Handling',
        status: 'warning',
        message: 'Gestionnaire d\'erreur global non détecté'
      };
    }
    return {
      name: 'Error Handling',
      status: 'pass',
      message: 'Gestion d\'erreur configurée (Error Boundary + gestionnaire global)'
    };
  }

  static generateReport(): {
    overall: 'ready' | 'needs_attention' | 'not_ready';
    checks: ProductionCheck[];
    summary: string;
  } {
    const checks = this.runAllChecks();
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;

    let overall: 'ready' | 'needs_attention' | 'not_ready';
    let summary: string;

    if (failCount > 0) {
      overall = 'not_ready';
      summary = `${failCount} problème(s) critique(s) à résoudre avant la mise en production`;
    } else if (warningCount > 0) {
      overall = 'needs_attention';
      summary = `${warningCount} avertissement(s) à examiner`;
    } else {
      overall = 'ready';
      summary = 'Application prête pour la production';
    }

    return { overall, checks, summary };
  }
}