// Configuration du domaine pour l'application
export const DOMAIN_CONFIG = {
  // Domaine principal
  PRIMARY_DOMAIN: 'www.gestionprojetsmt.online',
  
  // Domaines alternatifs
  ALTERNATIVE_DOMAINS: ['gestionprojetsmt.online'],
  
  // URL complète
  FULL_URL: 'https://www.gestionprojetsmt.online',
  
  // Configuration CORS
  CORS_ORIGINS: [
    'https://www.gestionprojetsmt.online',
    'https://gestionprojetsmt.online'
  ],
  
  // Configuration de sécurité
  SECURITY: {
    SECURE_COOKIES: true,
    SAME_SITE_COOKIES: 'strict' as const,
    CONTENT_SECURITY_POLICY: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://gcrmagqcfdkouvxdmetq.supabase.co;"
  },
  
  // Métadonnées de l'application
  APP_METADATA: {
    name: 'Gestion Projets MT',
    description: 'Plateforme de gestion de projets pour l\'entreprise MT',
    version: '1.0.0',
    author: 'MT Entreprise',
    keywords: ['gestion projets', 'management', 'MT', 'entreprise', 'tâches', 'budget', 'équipe']
  }
};

// Fonction pour vérifier si l'URL actuelle correspond au domaine configuré
export const isCorrectDomain = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const currentHost = window.location.hostname;
  return currentHost === DOMAIN_CONFIG.PRIMARY_DOMAIN || 
         DOMAIN_CONFIG.ALTERNATIVE_DOMAINS.includes(currentHost);
};

// Fonction pour rediriger vers le domaine principal si nécessaire
export const redirectToPrimaryDomain = (): void => {
  if (typeof window === 'undefined') return;
  
  const currentHost = window.location.hostname;
  if (DOMAIN_CONFIG.ALTERNATIVE_DOMAINS.includes(currentHost)) {
    const newUrl = `https://${DOMAIN_CONFIG.PRIMARY_DOMAIN}${window.location.pathname}${window.location.search}`;
    window.location.replace(newUrl);
  }
};

export default DOMAIN_CONFIG;
