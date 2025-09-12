// String utility functions

/**
 * Get user initials from first and last name
 * @param prenom First name
 * @param nom Last name
 * @returns Initials string (e.g., "JD" for "John Doe")
 */
export const getUserInitials = (prenom: string, nom: string): string => {
  const firstInitial = prenom ? prenom.charAt(0).toUpperCase() : '';
  const lastInitial = nom ? nom.charAt(0).toUpperCase() : '';
  return firstInitial + lastInitial;
};

/**
 * Get first character of a string
 * @param str String to get first character from
 * @returns First character in uppercase
 */
export const getFirstChar = (str: string): string => {
  return str ? str.charAt(0).toUpperCase() : '';
};

/**
 * Capitalize first letter of a string
 * @param str String to capitalize
 * @returns String with first letter capitalized
 */
export const capitalize = (str: string): string => {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
};

/**
 * Format a string to title case
 * @param str String to format
 * @returns String in title case
 */
export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Truncate a string to a specified length
 * @param str String to truncate
 * @param length Maximum length
 * @param suffix Suffix to add if truncated (default: '...')
 * @returns Truncated string
 */
export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + suffix;
};

/**
 * Remove extra whitespace and normalize string
 * @param str String to normalize
 * @returns Normalized string
 */
export const normalizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Check if a string is empty or only whitespace
 * @param str String to check
 * @returns True if string is empty or only whitespace
 */
export const isEmpty = (str: string): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * Generate a slug from a string
 * @param str String to convert to slug
 * @returns URL-friendly slug
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
