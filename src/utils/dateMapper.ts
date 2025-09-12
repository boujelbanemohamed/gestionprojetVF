/**
 * Utilitaire pour mapper automatiquement les champs de date
 */
export function mapDateFields<T extends Record<string, any>>(
  record: T,
  dateFields: string[] = ['created_at', 'updated_at', 'date_debut', 'date_fin', 'date_realisation', 'date_cloture', 'date_reouverture']
): T {
  const mapped = { ...record };
  
  dateFields.forEach(field => {
    if (mapped[field] && typeof mapped[field] === 'string') {
      mapped[field] = new Date(mapped[field]);
    }
  });
  
  return mapped;
}

/**
 * Mapper les champs de date pour un tableau d'objets
 */
export function mapDateFieldsArray<T extends Record<string, any>>(
  records: T[],
  dateFields?: string[]
): T[] {
  return records.map(record => mapDateFields(record, dateFields));
}
