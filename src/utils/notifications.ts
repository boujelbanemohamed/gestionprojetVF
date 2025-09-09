// Advanced notification system
export interface NotificationConfig {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  actions?: NotificationAction[];
  persistent?: boolean;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface Notification extends NotificationConfig {
  id: string;
  timestamp: Date;
  read: boolean;
}

export class NotificationService {
  private static notifications: Notification[] = [];
  private static listeners: ((notifications: Notification[]) => void)[] = [];

  static show(config: NotificationConfig): string {
    const notification: Notification = {
      ...config,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
      duration: config.duration || (config.persistent ? 0 : 5000)
    };

    this.notifications.unshift(notification);
    this.notifyListeners();

    // Auto remove if not persistent
    if (!config.persistent && notification.duration! > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  static remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  static markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  static markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  static getAll(): Notification[] {
    return [...this.notifications];
  }

  static getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  static clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  static subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Convenience methods
  static success(title: string, message: string, actions?: NotificationAction[]): string {
    return this.show({ title, message, type: 'success', actions });
  }

  static error(title: string, message: string, persistent: boolean = false): string {
    return this.show({ title, message, type: 'error', persistent });
  }

  static warning(title: string, message: string, actions?: NotificationAction[]): string {
    return this.show({ title, message, type: 'warning', actions });
  }

  static info(title: string, message: string): string {
    return this.show({ title, message, type: 'info' });
  }

  // Project-specific notifications
  static projectDeadlineApproaching(projectName: string, daysLeft: number): string {
    return this.warning(
      'Échéance proche',
      `Le projet "${projectName}" se termine dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
      [
        {
          label: 'Voir le projet',
          action: () => {/* Navigate to project */},
          style: 'primary'
        }
      ]
    );
  }

  static projectOverdue(projectName: string, daysOverdue: number): string {
    return this.error(
      'Projet en retard',
      `Le projet "${projectName}" a dépassé sa date de fin de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`,
      true
    );
  }

  static taskAssigned(taskName: string, projectName: string): string {
    return this.info(
      'Nouvelle tâche assignée',
      `Vous avez été assigné à la tâche "${taskName}" dans le projet "${projectName}"`
    );
  }

  static budgetWarning(projectName: string, percentage: number): string {
    return this.warning(
      'Alerte budgétaire',
      `Le projet "${projectName}" a consommé ${percentage}% de son budget`,
      [
        {
          label: 'Voir le budget',
          action: () => {/* Navigate to budget */},
          style: 'primary'
        }
      ]
    );
  }
}