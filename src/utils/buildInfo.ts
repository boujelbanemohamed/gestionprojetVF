// Build information and version management
export interface BuildInfo {
  version: string;
  buildDate: Date;
  gitCommit?: string;
  environment: 'development' | 'production' | 'staging';
  features: string[];
}

export class BuildInfoService {
  private static buildInfo: BuildInfo = {
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    buildDate: new Date(),
    gitCommit: import.meta.env.VITE_GIT_COMMIT,
    environment: import.meta.env.PROD ? 'production' : 'development',
    features: [
      'project-management',
      'task-tracking',
      'user-roles',
      'file-attachments',
      'budget-tracking',
      'meeting-minutes',
      'performance-dashboard',
      'export-functionality',
      'real-time-updates',
      'responsive-design'
    ]
  };

  static getBuildInfo(): BuildInfo {
    return { ...this.buildInfo };
  }

  static getVersion(): string {
    return this.buildInfo.version;
  }

  static getEnvironment(): string {
    return this.buildInfo.environment;
  }

  static isProduction(): boolean {
    return this.buildInfo.environment === 'production';
  }

  static isDevelopment(): boolean {
    return this.buildInfo.environment === 'development';
  }

  static hasFeature(feature: string): boolean {
    return this.buildInfo.features.includes(feature);
  }

  static getFeatures(): string[] {
    return [...this.buildInfo.features];
  }

  static addFeature(feature: string): void {
    if (!this.buildInfo.features.includes(feature)) {
      this.buildInfo.features.push(feature);
    }
  }

  static removeFeature(feature: string): void {
    this.buildInfo.features = this.buildInfo.features.filter(f => f !== feature);
  }
}

// Feature flags for dynamic functionality
export class FeatureFlags {
  private static flags: Map<string, boolean> = new Map([
    ['advanced-search', true],
    ['real-time-notifications', true],
    ['budget-tracking', true],
    ['meeting-minutes', true],
    ['performance-analytics', true],
    ['file-attachments', true],
    ['export-functionality', true],
    ['user-roles', true],
    ['department-management', true],
    ['project-templates', false], // Future feature
    ['time-tracking', false], // Future feature
    ['gantt-charts', true],
    ['kanban-boards', true]
  ]);

  static isEnabled(flag: string): boolean {
    return this.flags.get(flag) || false;
  }

  static enable(flag: string): void {
    this.flags.set(flag, true);
  }

  static disable(flag: string): void {
    this.flags.set(flag, false);
  }

  static getAllFlags(): Record<string, boolean> {
    return Object.fromEntries(this.flags);
  }

  static setFlags(flags: Record<string, boolean>): void {
    Object.entries(flags).forEach(([flag, enabled]) => {
      this.flags.set(flag, enabled);
    });
  }
}