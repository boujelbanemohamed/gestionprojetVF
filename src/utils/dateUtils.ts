/**
 * Utilitaires pour la gestion des dates
 */

/**
 * Convertit une date en chaîne de caractères au format ISO (YYYY-MM-DD)
 * @param date - Date à convertir (peut être un objet Date ou une chaîne)
 * @returns Chaîne de caractères au format ISO ou undefined si la date est null/undefined
 */
export function formatDateToISOString(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  if (typeof date === 'string') {
    // Si c'est déjà une chaîne, vérifier si elle contient une date valide
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
    // Si c'est déjà au format YYYY-MM-DD, le retourner tel quel
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
  }
  
  return undefined;
}

/**
 * Convertit une chaîne de date en objet Date
 * @param dateString - Chaîne de date à convertir
 * @returns Objet Date ou null si la conversion échoue
 */
export function parseDateString(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Vérifie si une valeur est un objet Date valide
 * @param value - Valeur à vérifier
 * @returns true si c'est un objet Date valide
 */
export function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}
