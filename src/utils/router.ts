export type RouteParams = {
  projectId?: string;
  taskId?: string;
  userId?: string;
  departmentId?: string;
  categoryId?: string;
};

export type AppRoute = 
  | 'dashboard'
  | 'project-detail'
  | 'closed-projects'
  | 'members'
  | 'departments'
  | 'performance'
  | 'settings'
  | 'settings-budget'
  | 'settings-permissions'
  | 'settings-general'
  | 'meeting-minutes';

export interface RouteConfig {
  path: string;
  component: AppRoute;
  params?: RouteParams;
  title: string;
  breadcrumb?: string[];
}

export class Router {
  private static currentRoute: RouteConfig = {
    path: '/',
    component: 'dashboard',
    title: 'Tableau de bord'
  };

  private static listeners: ((route: RouteConfig) => void)[] = [];

  static subscribe(listener: (route: RouteConfig) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static getCurrentRoute(): RouteConfig {
    return this.currentRoute;
  }

  static navigate(route: AppRoute, params?: RouteParams, title?: string) {
    const routeConfig = this.buildRouteConfig(route, params, title);
    this.currentRoute = routeConfig;
    
    // Update browser URL
    const url = this.buildUrl(route, params);
    window.history.pushState({ route, params }, routeConfig.title, url);
    document.title = `${routeConfig.title} - Gestion de Projets`;
    
    // Notify listeners
    this.listeners.forEach(listener => listener(routeConfig));
  }

  static replace(route: AppRoute, params?: RouteParams, title?: string) {
    const routeConfig = this.buildRouteConfig(route, params, title);
    this.currentRoute = routeConfig;
    
    // Update browser URL
    const url = this.buildUrl(route, params);
    window.history.replaceState({ route, params }, routeConfig.title, url);
    document.title = `${routeConfig.title} - Gestion de Projets`;
    
    // Notify listeners
    this.listeners.forEach(listener => listener(routeConfig));
  }

  static back() {
    window.history.back();
  }

  static parseUrl(): { route: AppRoute; params: RouteParams } {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Parse route from path
    if (path === '/' || path === '/dashboard') {
      return { route: 'dashboard', params: {} };
    }
    
    if (path.startsWith('/project/')) {
      const projectId = path.split('/')[2];
      return { 
        route: 'project-detail', 
        params: { projectId } 
      };
    }
    
    if (path === '/members') {
      return { route: 'members', params: {} };
    }
    
    if (path === '/closed-projects') {
      return { route: 'closed-projects', params: {} };
    }
    
    if (path === '/departments') {
      return { route: 'departments', params: {} };
    }
    
    if (path === '/performance') {
      return { route: 'performance', params: {} };
    }
    
    if (path === '/settings') {
      return { route: 'settings', params: {} };
    }
    
    if (path === '/settings/budget') {
      return { route: 'settings-budget', params: {} };
    }
    
    if (path === '/settings/permissions') {
      return { route: 'settings-permissions', params: {} };
    }
    
    if (path === '/settings/general') {
      return { route: 'settings-general', params: {} };
    }
    
    if (path === '/meeting-minutes') {
      return { route: 'meeting-minutes', params: {} };
    }
    
    // Default fallback
    return { route: 'dashboard', params: {} };
  }

  static init() {
    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
      if (event.state) {
        const routeConfig = this.buildRouteConfig(event.state.route, event.state.params);
        this.currentRoute = routeConfig;
        this.listeners.forEach(listener => listener(routeConfig));
      }
    });

    // Parse initial URL
    const { route, params } = this.parseUrl();
    this.replace(route, params);
  }

  private static buildRouteConfig(route: AppRoute, params?: RouteParams, customTitle?: string): RouteConfig {
    const config: RouteConfig = {
      path: this.buildUrl(route, params),
      component: route,
      params,
      title: customTitle || this.getDefaultTitle(route, params),
      breadcrumb: this.buildBreadcrumb(route, params)
    };
    
    return config;
  }

  private static buildUrl(route: AppRoute, params?: RouteParams): string {
    switch (route) {
      case 'dashboard':
        return '/dashboard';
      case 'project-detail':
        return `/project/${params?.projectId || ''}`;
      case 'members':
        return '/members';
      case 'closed-projects':
        return '/closed-projects';
      case 'departments':
        return '/departments';
      case 'performance':
        return '/performance';
      case 'settings':
        return '/settings';
      case 'settings-budget':
        return '/settings/budget';
      case 'settings-permissions':
        return '/settings/permissions';
      case 'settings-general':
        return '/settings/general';
      case 'meeting-minutes':
        return '/meeting-minutes';
      default:
        return '/dashboard';
    }
  }

  private static getDefaultTitle(route: AppRoute, params?: RouteParams): string {
    switch (route) {
      case 'dashboard':
        return 'Tableau de bord';
      case 'project-detail':
        return 'Détail du projet';
      case 'members':
        return 'Gestion des membres';
      case 'closed-projects':
        return 'Projets clôturés';
      case 'departments':
        return 'Gestion des départements';
      case 'performance':
        return 'Tableau de performance';
      case 'settings':
        return 'Paramètres généraux';
      case 'settings-budget':
        return 'Paramètres - Budget';
      case 'settings-permissions':
        return 'Paramètres - Droits d\'accès';
      case 'settings-general':
        return 'Paramètres - Général';
      case 'meeting-minutes':
        return 'PV de Réunion';
      default:
        return 'Gestion de Projets';
    }
  }

  private static buildBreadcrumb(route: AppRoute, params?: RouteParams): string[] {
    switch (route) {
      case 'dashboard':
        return ['Accueil'];
      case 'project-detail':
        return ['Accueil', 'Projets', 'Détail'];
      case 'members':
        return ['Accueil', 'Paramètres', 'Membres'];
      case 'closed-projects':
        return ['Accueil', 'Projets clôturés'];
      case 'departments':
        return ['Accueil', 'Paramètres', 'Départements'];
      case 'performance':
        return ['Accueil', 'Performance'];
      case 'settings':
        return ['Accueil', 'Paramètres'];
      case 'settings-budget':
        return ['Accueil', 'Paramètres', 'Budget'];
      case 'settings-permissions':
        return ['Accueil', 'Paramètres', 'Droits d\'accès'];
      case 'settings-general':
        return ['Accueil', 'Paramètres', 'Général'];
      case 'meeting-minutes':
        return ['Accueil', 'PV de Réunion'];
      default:
        return ['Accueil'];
    }
  }
}