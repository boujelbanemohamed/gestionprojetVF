// Enhanced data validation for production readiness
export class DataValidator {
  // Validate project data
  static validateProject(project: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!project.nom || typeof project.nom !== 'string' || project.nom.trim().length === 0) {
      errors.push('Le nom du projet est obligatoire');
    }

    if (project.nom && project.nom.length > 200) {
      errors.push('Le nom du projet ne peut pas dépasser 200 caractères');
    }

    if (project.description && project.description.length > 2000) {
      errors.push('La description ne peut pas dépasser 2000 caractères');
    }

    if (project.budget_initial && (isNaN(project.budget_initial) || project.budget_initial < 0)) {
      errors.push('Le budget initial doit être un nombre positif');
    }

    if (project.date_debut && project.date_fin) {
      const startDate = new Date(project.date_debut);
      const endDate = new Date(project.date_fin);
      if (startDate > endDate) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate task data
  static validateTask(task: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!task.nom || typeof task.nom !== 'string' || task.nom.trim().length === 0) {
      errors.push('Le nom de la tâche est obligatoire');
    }

    if (task.nom && task.nom.length > 200) {
      errors.push('Le nom de la tâche ne peut pas dépasser 200 caractères');
    }

    if (!task.date_realisation) {
      errors.push('La date de réalisation est obligatoire');
    }

    if (!task.utilisateurs || !Array.isArray(task.utilisateurs) || task.utilisateurs.length === 0) {
      errors.push('Au moins un utilisateur doit être assigné à la tâche');
    }

    if (!['non_debutee', 'en_cours', 'cloturee'].includes(task.etat)) {
      errors.push('L\'état de la tâche est invalide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate user data
  static validateUser(user: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!user.nom || typeof user.nom !== 'string' || user.nom.trim().length === 0) {
      errors.push('Le nom est obligatoire');
    }

    if (!user.prenom || typeof user.prenom !== 'string' || user.prenom.trim().length === 0) {
      errors.push('Le prénom est obligatoire');
    }

    if (!user.email || typeof user.email !== 'string') {
      errors.push('L\'email est obligatoire');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.push('Format d\'email invalide');
    }

    if (!user.departement || typeof user.departement !== 'string' || user.departement.trim().length === 0) {
      errors.push('Le département est obligatoire');
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'UTILISATEUR'].includes(user.role)) {
      errors.push('Le rôle est invalide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate file upload
  static validateFile(file: File, maxSize: number = 10 * 1024 * 1024): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    if (file.size > maxSize) {
      errors.push(`Le fichier "${file.name}" est trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`Le type de fichier "${file.name}" n'est pas autorisé`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate meeting minute data
  static validateMeetingMinute(pv: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pv.titre || typeof pv.titre !== 'string' || pv.titre.trim().length === 0) {
      errors.push('Le titre du PV est obligatoire');
    }

    if (!pv.date_reunion) {
      errors.push('La date de réunion est obligatoire');
    }

    if (!pv.file && !pv.url_fichier) {
      errors.push('Le fichier PV est obligatoire');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}