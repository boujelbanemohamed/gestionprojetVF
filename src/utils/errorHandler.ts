/**
 * Helper pour gérer les erreurs de manière uniforme
 */
export function handleError(context: string, error: any): never {
  console.error(`[${context}] Erreur:`, error);
  
  // Extraire le message d'erreur le plus pertinent
  let message = 'Une erreur inattendue s\'est produite';
  
  if (error?.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error?.details) {
    message = error.details;
  } else if (error?.hint) {
    message = error.hint;
  }
  
  // Ajouter le contexte pour faciliter le debugging
  const fullMessage = `[${context}] ${message}`;
  
  throw new Error(fullMessage);
}

/**
 * Wrapper pour les opérations async avec gestion d'erreur
 */
export async function withErrorHandling<T>(
  context: string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleError(context, error);
  }
}
