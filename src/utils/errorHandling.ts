// Comprehensive error handling system
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  context?: string;
}

export class ErrorHandler {
  private static errors: AppError[] = [];
  private static listeners: ((error: AppError) => void)[] = [];

  static logError(
    code: string,
    message: string,
    details?: any,
    context?: string
  ): void {
    const error: AppError = {
      code,
      message,
      details,
      timestamp: new Date(),
      context
    };

    this.errors.push(error);
    
    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(error));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${code}] ${message}`, details);
    }
  }

  static subscribe(listener: (error: AppError) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static getErrors(): AppError[] {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors = [];
  }

  // Common error types
  static validationError(field: string, message: string, details?: any): void {
    this.logError('VALIDATION_ERROR', `Validation failed for ${field}: ${message}`, details, 'validation');
  }

  static networkError(message: string, details?: any): void {
    this.logError('NETWORK_ERROR', message, details, 'network');
  }

  static permissionError(action: string, resource: string): void {
    this.logError('PERMISSION_ERROR', `Permission denied for ${action} on ${resource}`, null, 'permissions');
  }

  static fileError(operation: string, filename: string, details?: any): void {
    this.logError('FILE_ERROR', `File ${operation} failed for ${filename}`, details, 'files');
  }

  static dataError(operation: string, entity: string, details?: any): void {
    this.logError('DATA_ERROR', `Data ${operation} failed for ${entity}`, details, 'data');
  }
}

// Error boundary hook
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    ErrorHandler.logError(
      'COMPONENT_ERROR',
      error.message,
      { stack: error.stack },
      context
    );
  };

  return { handleError };
}

// Global error handler for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.logError(
    'UNHANDLED_PROMISE',
    event.reason?.message || 'Unhandled promise rejection',
    event.reason,
    'global'
  );
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  ErrorHandler.logError(
    'JAVASCRIPT_ERROR',
    event.message,
    {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    },
    'global'
  );
});