// Performance monitoring for production
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  context?: Record<string, any>;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static observers: PerformanceObserver[] = [];

  static init(): void {
    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor custom metrics
    this.observeCustomMetrics();
    
    // Monitor resource loading
    this.observeResourceTiming();
  }

  private static observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('LCP', lastEntry.startTime, {
        element: (lastEntry as any).element?.tagName
      });
    });
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.recordMetric('FID', (entry as any).processingStart - entry.startTime);
      });
    });
    
    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      this.recordMetric('CLS', clsValue);
    });
    
    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      // CLS not supported
    }
  }

  private static observeCustomMetrics(): void {
    // Time to Interactive (custom implementation)
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.recordMetric('TTI', performance.now());
      }, 0);
    });

    // Memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('Memory_Used', memory.usedJSHeapSize, {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        });
      }, 30000); // Every 30 seconds
    }
  }

  private static observeResourceTiming(): void {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          this.recordMetric('Resource_Load', resource.duration, {
            name: resource.name,
            type: resource.initiatorType,
            size: resource.transferSize
          });
        }
      });
    });
    
    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      // Resource timing not supported
    }
  }

  static recordMetric(name: string, value: number, context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      context
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`📊 Performance: ${name} = ${value.toFixed(2)}ms`, context);
    }
  }

  static getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  static getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  static getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  static getPerformanceReport(): {
    lcp: number;
    fid: number;
    cls: number;
    tti: number;
    resourceCount: number;
    averageResourceLoad: number;
  } {
    return {
      lcp: this.getAverageMetric('LCP'),
      fid: this.getAverageMetric('FID'),
      cls: this.getAverageMetric('CLS'),
      tti: this.getAverageMetric('TTI'),
      resourceCount: this.getMetricsByName('Resource_Load').length,
      averageResourceLoad: this.getAverageMetric('Resource_Load')
    };
  }

  static cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined' && typeof PerformanceObserver !== 'undefined') {
  PerformanceMonitor.init();
}