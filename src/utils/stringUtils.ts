/**
 * Utilitaires pour la manipulation sécurisée des chaînes de caractères
 */

/**
 * Obtient le premier caractère d'une chaîne de manière sécurisée
 * @param str - La chaîne de caractères
 * @param fallback - Caractère de remplacement si la chaîne est vide ou undefined
 * @returns Le premier caractère ou le caractère de remplacement
 */
export function getFirstChar(str: string | undefined | null, fallback: string = ''): string {
  if (!str || typeof str !== 'string') {
    return fallback;
  }
  return str.charAt(0);
}

/**
 * Obtient les initiales d'un utilisateur de manière sécurisée
 * @param prenom - Le prénom de l'utilisateur
 * @param nom - Le nom de l'utilisateur
 * @returns Les initiales (ex: "JD" pour "John Doe")
 */
export function getUserInitials(prenom: string | undefined | null, nom: string | undefined | null): string {
  const firstChar = getFirstChar(prenom, '');
  const lastChar = getFirstChar(nom, '');
  return firstChar + lastChar;
}

/**
 * Capitalise la première lettre d'une chaîne de manière sécurisée
 * @param str - La chaîne de caractères
 * @returns La chaîne avec la première lettre en majuscule
 */
export function capitalizeFirst(str: string | undefined | null): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Vérifie si une chaîne est vide ou undefined/null
 * @param str - La chaîne de caractères
 * @returns true si la chaîne est vide, undefined ou null
 */
export function isEmpty(str: string | undefined | null): boolean {
  return !str || str.trim() === '';
}

/**
 * Obtient une valeur par défaut si la chaîne est vide
 * @param str - La chaîne de caractères
 * @param defaultValue - La valeur par défaut
 * @returns La chaîne originale ou la valeur par défaut
 */
export function getDefaultIfEmpty(str: string | undefined | null, defaultValue: string): string {
  return isEmpty(str) ? defaultValue : str!;
}
