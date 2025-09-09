// Analytics and metrics tracking
export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

export class Analytics {
  private static events: AnalyticsEvent[] = [];
  private static sessionId = Date.now().toString();

  static track(event: string, properties: Record<string, any> = {}, userId?: string): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      timestamp: new Date(),
      userId
    };

    this.events.push(analyticsEvent);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics:', event, properties);
    }
  }

  static getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  static getEventsByType(eventType: string): AnalyticsEvent[] {
    return this.events.filter(e => e.event === eventType);
  }

  static getEventsByUser(userId: string): AnalyticsEvent[] {
    return this.events.filter(e => e.userId === userId);
  }

  static getSessionStats(): {
    totalEvents: number;
    uniqueEvents: number;
    sessionDuration: number;
    mostCommonEvents: { event: string; count: number }[];
  } {
    const eventCounts = new Map<string, number>();
    
    this.events.forEach(event => {
      eventCounts.set(event.event, (eventCounts.get(event.event) || 0) + 1);
    });

    const mostCommonEvents = Array.from(eventCounts.entries())
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const sessionStart = this.events.length > 0 ? this.events[0].timestamp : new Date();
    const sessionDuration = Date.now() - sessionStart.getTime();

    return {
      totalEvents: this.events.length,
      uniqueEvents: eventCounts.size,
      sessionDuration,
      mostCommonEvents
    };
  }

  // Predefined tracking methods
  static trackProjectCreated(projectName: string, userId: string): void {
    this.track('project_created', { projectName }, userId);
  }

  static trackTaskCompleted(taskName: string, projectName: string, userId: string): void {
    this.track('task_completed', { taskName, projectName }, userId);
  }

  static trackUserLogin(userId: string, role: string): void {
    this.track('user_login', { role }, userId);
  }

  static trackPageView(page: string, userId?: string): void {
    this.track('page_view', { page }, userId);
  }

  static trackFeatureUsed(feature: string, userId?: string): void {
    this.track('feature_used', { feature }, userId);
  }

  static trackExport(type: 'excel' | 'pdf', entity: string, userId?: string): void {
    this.track('export', { type, entity }, userId);
  }

  static trackSearch(query: string, results: number, userId?: string): void {
    this.track('search', { query, results }, userId);
  }
}