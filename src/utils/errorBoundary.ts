// Enhanced error boundary utilities for production
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface ErrorReport {
  error: Error;
  errorInfo: ErrorInfo;
  timestamp: Date;
  userId?: string;
  userAgent: string;
  url: string;
  buildVersion?: string;
}

export class ErrorReporting {
  private static reports: ErrorReport[] = [];
  private static maxReports = 50;

  static captureError(error: Error, errorInfo: ErrorInfo, userId?: string): void {
    const report: ErrorReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as Error,
      errorInfo,
      timestamp: new Date(),
      userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown'
    };

    this.reports.unshift(report);
    
    // Keep only recent reports
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(0, this.maxReports);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error captured:', report);
    }

    // In production, you would send this to your error tracking service
    this.sendToErrorService(report);
  }

  private static sendToErrorService(report: ErrorReport): void {
    // In production, implement actual error reporting
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    if (!import.meta.env.DEV) {
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report)
      // }).catch(() => {
      //   // Silently fail if error reporting fails
      // });
    }
  }

  static getReports(): ErrorReport[] {
    return [...this.reports];
  }

  static clearReports(): void {
    this.reports = [];
  }

  static getErrorStats(): {
    totalErrors: number;
    uniqueErrors: number;
    mostCommonErrors: { message: string; count: number }[];
  } {
    const errorCounts = new Map<string, number>();
    
    this.reports.forEach(report => {
      const key = `${report.error.name}: ${report.error.message}`;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });

    const mostCommonErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: this.reports.length,
      uniqueErrors: errorCounts.size,
      mostCommonErrors
    };
  }
}