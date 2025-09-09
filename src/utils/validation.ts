// Comprehensive validation utilities
export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationSchema<T> {
  [K in keyof T]?: ValidationRule<T[K]>[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class Validator {
  static required<T>(message: string = 'Ce champ est obligatoire'): ValidationRule<T> {
    return {
      validate: (value: T) => {
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        return value !== null && value !== undefined;
      },
      message
    };
  }

  static minLength(min: number, message?: string): ValidationRule<string> {
    return {
      validate: (value: string) => value.trim().length >= min,
      message: message || `Minimum ${min} caractères requis`
    };
  }

  static maxLength(max: number, message?: string): ValidationRule<string> {
    return {
      validate: (value: string) => value.trim().length <= max,
      message: message || `Maximum ${max} caractères autorisés`
    };
  }

  static email(message: string = 'Format d\'email invalide'): ValidationRule<string> {
    return {
      validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message
    };
  }

  static numeric(message: string = 'Doit être un nombre'): ValidationRule<string> {
    return {
      validate: (value: string) => !isNaN(Number(value)) && value.trim() !== '',
      message
    };
  }

  static positive(message: string = 'Doit être un nombre positif'): ValidationRule<string> {
    return {
      validate: (value: string) => Number(value) > 0,
      message
    };
  }

  static dateAfter(compareDate: Date, message?: string): ValidationRule<string> {
    return {
      validate: (value: string) => new Date(value) > compareDate,
      message: message || `La date doit être postérieure au ${compareDate.toLocaleDateString('fr-FR')}`
    };
  }

  static custom<T>(
    validator: (value: T) => boolean,
    message: string
  ): ValidationRule<T> {
    return {
      validate: validator,
      message
    };
  }

  static validate<T extends Record<string, any>>(
    data: T,
    schema: ValidationSchema<T>
  ): ValidationResult {
    const errors: Record<string, string> = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldRules = rules as ValidationRule<any>[];

      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          errors[field] = rule.message;
          break; // Stop at first error for this field
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Specific validation schemas for the platform
export const projectValidationSchema = {
  nom: [
    Validator.required('Le nom du projet est obligatoire'),
    Validator.minLength(2, 'Le nom doit contenir au moins 2 caractères'),
    Validator.maxLength(200, 'Le nom ne peut pas dépasser 200 caractères')
  ],
  description: [
    Validator.maxLength(2000, 'La description ne peut pas dépasser 2000 caractères')
  ],
  budget_initial: [
    Validator.positive('Le budget doit être un nombre positif')
  ]
};

export const taskValidationSchema = {
  nom: [
    Validator.required('Le nom de la tâche est obligatoire'),
    Validator.minLength(2, 'Le nom doit contenir au moins 2 caractères'),
    Validator.maxLength(200, 'Le nom ne peut pas dépasser 200 caractères')
  ],
  description: [
    Validator.maxLength(2000, 'La description ne peut pas dépasser 2000 caractères')
  ],
  scenario_execution: [
    Validator.maxLength(5000, 'Le scénario ne peut pas dépasser 5000 caractères')
  ],
  criteres_acceptation: [
    Validator.maxLength(2000, 'Les critères ne peuvent pas dépasser 2000 caractères')
  ]
};

export const userValidationSchema = {
  nom: [
    Validator.required('Le nom est obligatoire'),
    Validator.minLength(2, 'Le nom doit contenir au moins 2 caractères'),
    Validator.maxLength(100, 'Le nom ne peut pas dépasser 100 caractères')
  ],
  prenom: [
    Validator.required('Le prénom est obligatoire'),
    Validator.minLength(2, 'Le prénom doit contenir au moins 2 caractères'),
    Validator.maxLength(100, 'Le prénom ne peut pas dépasser 100 caractères')
  ],
  email: [
    Validator.required('L\'email est obligatoire'),
    Validator.email()
  ],
  mot_de_passe: [
    Validator.required('Le mot de passe est obligatoire'),
    Validator.minLength(6, 'Le mot de passe doit contenir au moins 6 caractères')
  ]
};