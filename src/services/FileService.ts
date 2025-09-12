import { supabase } from './supabase';
import { ProjectAttachment, TaskAttachment } from '../types';
import { handleError, withErrorHandling } from '../utils/errorHandler';
import { mapDateFields, mapDateFieldsArray } from '../utils/dateMapper';
import { TABLES } from '../constants/tables';

export class FileService {
  /**
   * Uploader un fichier pour un projet
   */
  static async uploadProjectFile(
    projectId: string,
    file: File,
    uploadedBy: string,
    description?: string
  ): Promise<ProjectAttachment> {
    return withErrorHandling('FileService.uploadProjectFile', async () => {
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `project-attachments/${projectId}/${fileName}`;

      // Uploader le fichier vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      // Enregistrer les métadonnées en base
      const { data, error } = await supabase
        .from(TABLES.PROJECT_ATTACHMENTS)
        .insert({
          projet_id: projectId,
          nom_fichier: file.name,
          chemin_fichier: filePath,
          url_fichier: publicUrl,
          taille_fichier: file.size,
          type_mime: file.type,
          description: description || null,
          uploaded_by: uploadedBy
        })
        .select()
        .single();

      if (error) throw error;

      const mappedAttachment = mapDateFields(data, ['uploaded_at']);
      return {
        id: mappedAttachment.id,
        projet_id: mappedAttachment.projet_id,
        nom_fichier: mappedAttachment.nom_fichier,
        chemin_fichier: mappedAttachment.chemin_fichier,
        url_fichier: mappedAttachment.url_fichier,
        taille_fichier: mappedAttachment.taille_fichier,
        type_mime: mappedAttachment.type_mime,
        description: mappedAttachment.description,
        uploaded_by: mappedAttachment.uploaded_by,
        uploaded_at: mappedAttachment.uploaded_at
      };
    });
  }

  /**
   * Uploader un fichier pour une tâche
   */
  static async uploadTaskFile(
    taskId: string,
    file: File,
    uploadedBy: string,
    description?: string
  ): Promise<TaskAttachment> {
    return withErrorHandling('FileService.uploadTaskFile', async () => {
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `task-attachments/${taskId}/${fileName}`;

      // Uploader le fichier vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('task-files')
        .getPublicUrl(filePath);

      // Enregistrer les métadonnées en base
      const { data, error } = await supabase
        .from(TABLES.TASK_ATTACHMENTS)
        .insert({
          tache_id: taskId,
          nom_fichier: file.name,
          chemin_fichier: filePath,
          url_fichier: publicUrl,
          taille_fichier: file.size,
          type_mime: file.type,
          description: description || null,
          uploaded_by: uploadedBy
        })
        .select()
        .single();

      if (error) throw error;

      const mappedAttachment = mapDateFields(data, ['uploaded_at']);
      return {
        id: mappedAttachment.id,
        tache_id: mappedAttachment.tache_id,
        nom_fichier: mappedAttachment.nom_fichier,
        chemin_fichier: mappedAttachment.chemin_fichier,
        url_fichier: mappedAttachment.url_fichier,
        taille_fichier: mappedAttachment.taille_fichier,
        type_mime: mappedAttachment.type_mime,
        description: mappedAttachment.description,
        uploaded_by: mappedAttachment.uploaded_by,
        uploaded_at: mappedAttachment.uploaded_at
      };
    });
  }

  /**
   * Récupérer les fichiers d'un projet
   */
  static async getProjectFiles(projectId: string): Promise<ProjectAttachment[]> {
    return withErrorHandling('FileService.getProjectFiles', async () => {
      const { data, error } = await supabase
        .from(TABLES.PROJECT_ATTACHMENTS)
        .select('*')
        .eq('projet_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      return mapDateFieldsArray(data, ['uploaded_at']).map(attachment => ({
        id: attachment.id,
        projet_id: attachment.projet_id,
        nom_fichier: attachment.nom_fichier,
        chemin_fichier: attachment.chemin_fichier,
        url_fichier: attachment.url_fichier,
        taille_fichier: attachment.taille_fichier,
        type_mime: attachment.type_mime,
        description: attachment.description,
        uploaded_by: attachment.uploaded_by,
        uploaded_at: attachment.uploaded_at
      }));
    });
  }

  /**
   * Récupérer les fichiers d'une tâche
   */
  static async getTaskFiles(taskId: string): Promise<TaskAttachment[]> {
    return withErrorHandling('FileService.getTaskFiles', async () => {
      const { data, error } = await supabase
        .from(TABLES.TASK_ATTACHMENTS)
        .select('*')
        .eq('tache_id', taskId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      return mapDateFieldsArray(data, ['uploaded_at']).map(attachment => ({
        id: attachment.id,
        tache_id: attachment.tache_id,
        nom_fichier: attachment.nom_fichier,
        chemin_fichier: attachment.chemin_fichier,
        url_fichier: attachment.url_fichier,
        taille_fichier: attachment.taille_fichier,
        type_mime: attachment.type_mime,
        description: attachment.description,
        uploaded_by: attachment.uploaded_by,
        uploaded_at: attachment.uploaded_at
      }));
    });
  }

  /**
   * Supprimer un fichier de projet
   */
  static async deleteProjectFile(attachmentId: string): Promise<void> {
    return withErrorHandling('FileService.deleteProjectFile', async () => {
      // Récupérer les métadonnées du fichier
      const { data: attachment, error: fetchError } = await supabase
        .from(TABLES.PROJECT_ATTACHMENTS)
        .select('chemin_fichier')
        .eq('id', attachmentId)
        .single();

      if (fetchError) throw fetchError;

      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([attachment.chemin_fichier]);

      if (storageError) {
        console.warn('Erreur lors de la suppression du fichier du storage:', storageError);
        // Continuer même si la suppression du storage échoue
      }

      // Supprimer les métadonnées de la base
      const { error: deleteError } = await supabase
        .from(TABLES.PROJECT_ATTACHMENTS)
        .delete()
        .eq('id', attachmentId);

      if (deleteError) throw deleteError;
    });
  }

  /**
   * Supprimer un fichier de tâche
   */
  static async deleteTaskFile(attachmentId: string): Promise<void> {
    return withErrorHandling('FileService.deleteTaskFile', async () => {
      // Récupérer les métadonnées du fichier
      const { data: attachment, error: fetchError } = await supabase
        .from(TABLES.TASK_ATTACHMENTS)
        .select('chemin_fichier')
        .eq('id', attachmentId)
        .single();

      if (fetchError) throw fetchError;

      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from('task-files')
        .remove([attachment.chemin_fichier]);

      if (storageError) {
        console.warn('Erreur lors de la suppression du fichier du storage:', storageError);
        // Continuer même si la suppression du storage échoue
      }

      // Supprimer les métadonnées de la base
      const { error: deleteError } = await supabase
        .from(TABLES.TASK_ATTACHMENTS)
        .delete()
        .eq('id', attachmentId);

      if (deleteError) throw deleteError;
    });
  }

  /**
   * Télécharger un fichier
   */
  static async downloadFile(url: string, filename: string): Promise<void> {
    return withErrorHandling('FileService.downloadFile', async () => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  /**
   * Formater la taille d'un fichier
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtenir l'icône d'un type de fichier
   */
  static getFileIcon(type: string): string {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('zip') || type.includes('archive')) return '📦';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    return '📎';
  }
}
