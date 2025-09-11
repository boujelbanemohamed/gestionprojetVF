import React, { useState, useEffect } from 'react';
import { X, Save, Plus, User, Building, Briefcase, FileText, PlayCircle, CheckCircle, Upload, Trash2, Download, Paperclip } from 'lucide-react';
import { Task, User as UserType, TaskAttachment } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Task) => void;
  task?: Task;
  projectId: string;
  availableUsers: UserType[];
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSubmit, task, projectId, availableUsers }) => {
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [scenarioExecution, setScenarioExecution] = useState('');
  const [criteresAcceptation, setCriteresAcceptation] = useState('');
  const [taskStatus, setTaskStatus] = useState<'non_debutee' | 'en_cours' | 'cloturee'>('non_debutee');
  const [taskDate, setTaskDate] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserType[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<TaskAttachment[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);

  // Mock current user for demo purposes
  const getCurrentUser = (): UserType => {
    return availableUsers[0] || {
      id: 'current-user',
      nom: 'Utilisateur',
      prenom: 'Système',
      departement: 'Administration',
      created_at: new Date()
    };
  };

  useEffect(() => {
    if (task) {
      setTaskName(task.nom);
      setTaskDescription(task.description || '');
      setScenarioExecution(task.scenario_execution || '');
      setCriteresAcceptation(task.criteres_acceptation || '');
      setTaskStatus(task.etat);
      setTaskDate(task.date_realisation ? task.date_realisation.toISOString().split('T')[0] : '');
      setSelectedUsers(task.utilisateurs);
      setExistingAttachments(task.attachments || []);
      setNewAttachments([]);
    } else {
      setTaskName('');
      setTaskDescription('');
      setScenarioExecution('');
      setCriteresAcceptation('');
      setTaskStatus('non_debutee');
      setTaskDate('');
      setSelectedUsers([]);
      setExistingAttachments([]);
      setNewAttachments([]);
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim() && taskDate) {
      try {
        const currentUser = getCurrentUser();
        
        // Convert new files to TaskAttachment objects
        const newTaskAttachments: TaskAttachment[] = newAttachments.map(file => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          nom: file.name,
          taille: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploaded_at: new Date(),
          uploaded_by: currentUser
        }));

        // Combine existing and new attachments
        const allAttachments = [...existingAttachments, ...newTaskAttachments];

        // Persistance en base de la tâche et des assignations
        let taskId: string;
        let assignedUsers: UserType[] = [];
        
        if (!task) {
          const { SupabaseService } = await import('../services/supabaseService');
          const created = await SupabaseService.createTask({
            nom: taskName.trim(),
            description: taskDescription.trim() || undefined,
            scenario_execution: scenarioExecution.trim() || undefined,
            criteres_acceptation: criteresAcceptation.trim() || undefined,
            etat: taskStatus,
            date_realisation: new Date(taskDate),
            projet_id: projectId
          });
          taskId = created.id;
          if (selectedUsers.length > 0) {
            console.log('Assigning users to new task:', selectedUsers.map(u => ({ id: u.id, nom: u.nom })));
            const currentUser = getCurrentUser();
            await SupabaseService.assignUsersToTask(created.id, selectedUsers.map(u => u.id), currentUser.id);
            // Récupérer les utilisateurs assignés depuis la base de données
            assignedUsers = await SupabaseService.getTaskUsers(created.id);
            console.log('Retrieved assigned users for new task:', assignedUsers.map(u => ({ id: u.id, nom: u.nom })));
          }
        } else {
          // Édition: mettre à jour la tâche et réécrire les assignations
          const { SupabaseService } = await import('../services/supabaseService');
          await SupabaseService.updateTask(task.id, {
            nom: taskName.trim(),
            description: taskDescription.trim() || undefined,
            scenario_execution: scenarioExecution.trim() || undefined,
            criteres_acceptation: criteresAcceptation.trim() || undefined,
            etat: taskStatus,
            date_realisation: new Date(taskDate)
          });
          taskId = task.id;
          console.log('Assigning users to existing task:', selectedUsers.map(u => ({ id: u.id, nom: u.nom })));
          const currentUser = getCurrentUser();
          await SupabaseService.assignUsersToTask(task.id, selectedUsers.map(u => u.id), currentUser.id);
          // Récupérer les utilisateurs assignés depuis la base de données
          assignedUsers = await SupabaseService.getTaskUsers(task.id);
          console.log('Retrieved assigned users for existing task:', assignedUsers.map(u => ({ id: u.id, nom: u.nom })));
        }

        // Créer un objet Task complet avec l'ID de la base de données et les utilisateurs assignés
        const completeTask: Task = {
          id: taskId,
          nom: taskName.trim(),
          description: taskDescription.trim() || undefined,
          scenario_execution: scenarioExecution.trim() || undefined,
          criteres_acceptation: criteresAcceptation.trim() || undefined,
          etat: taskStatus,
          date_realisation: new Date(taskDate),
          projet_id: projectId,
          utilisateurs: assignedUsers,
          attachments: allAttachments.length > 0 ? allAttachments : undefined,
          commentaires: task?.commentaires || [],
          history: task?.history || []
        };

        console.log('Complete task object being passed to onSubmit:', {
          id: completeTask.id,
          nom: completeTask.nom,
          utilisateurs: completeTask.utilisateurs.map(u => ({ id: u.id, nom: u.nom }))
        });

        try {
          onSubmit(completeTask);
          onClose();
        } catch (onSubmitError) {
          console.error('Error in onSubmit callback:', onSubmitError);
          throw onSubmitError; // Re-throw to be caught by outer catch
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la tâche:', error);
        alert('Erreur lors de la sauvegarde de la tâche');
      }
    }
  };

  const toggleUser = (user: UserType) => {
    setSelectedUsers(prev => 
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
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

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`Le fichier "${file.name}" est trop volumineux (max 10MB)`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`Le type de fichier "${file.name}" n'est pas autorisé`);
        return false;
      }
      return true;
    });

    setNewAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeExistingAttachment = (attachmentId: string) => {
    const attachmentToRemove = existingAttachments.find(att => att.id === attachmentId);
    if (!attachmentToRemove) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le fichier "${attachmentToRemove.nom}" ?\n\nCette action est irréversible.`;
    
    if (window.confirm(confirmMessage)) {
      // Clean up object URL to prevent memory leaks
      if (attachmentToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachmentToRemove.url);
      }
      
      setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
    }
  };

  const removeNewAttachment = (index: number) => {
    const fileToRemove = newAttachments[index];
    const confirmMessage = `Êtes-vous sûr de vouloir retirer le fichier "${fileToRemove.name}" de la sélection ?`;
    
    if (window.confirm(confirmMessage)) {
      setNewAttachments(prev => prev.filter((_, i) => i !== index));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    return '📎';
  };

  const downloadAttachment = (attachment: TaskAttachment) => {
    // In a real app, this would download from the server
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.nom;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const totalAttachments = existingAttachments.length + newAttachments.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {task ? <Save className="text-blue-600" size={20} /> : <Plus className="text-blue-600" size={20} />}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {task ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <FileText size={20} className="text-gray-600" />
              <span>Informations générales</span>
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la tâche <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="taskName"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: Développer l'interface utilisateur"
                  required
                />
              </div>

              <div>
                <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700 mb-2">
                  État
                </label>
                <select
                  id="taskStatus"
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="non_debutee">Non débutée</option>
                  <option value="en_cours">En cours</option>
                  <option value="cloturee">Clôturée</option>
                </select>
              </div>

              <div>
                <label htmlFor="taskDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Date de réalisation <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="taskDate"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <FileText size={20} className="text-blue-600" />
              <span>Description</span>
            </h3>
            
            <div>
              <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Description détaillée de la tâche
              </label>
              <textarea
                id="taskDescription"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Décrivez en détail ce qui doit être accompli dans cette tâche..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {taskDescription.length}/1000 caractères
              </p>
            </div>
          </div>

          {/* Scenario d'execution */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <PlayCircle size={20} className="text-green-600" />
              <span>Scénario d'exécution</span>
            </h3>
            
            <div>
              <label htmlFor="scenarioExecution" className="block text-sm font-medium text-gray-700 mb-2">
                Étapes et procédures à suivre
              </label>
              <textarea
                id="scenarioExecution"
                value={scenarioExecution}
                onChange={(e) => setScenarioExecution(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Décrivez les étapes à suivre pour réaliser cette tâche :&#10;1. Première étape...&#10;2. Deuxième étape...&#10;3. Troisième étape..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {scenarioExecution.length}/2000 caractères
              </p>
            </div>
          </div>

          {/* Criteres d'acceptation */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <CheckCircle size={20} className="text-purple-600" />
              <span>Critères d'acceptation</span>
            </h3>
            
            <div>
              <label htmlFor="criteresAcceptation" className="block text-sm font-medium text-gray-700 mb-2">
                Conditions de validation de la tâche
              </label>
              <textarea
                id="criteresAcceptation"
                value={criteresAcceptation}
                onChange={(e) => setCriteresAcceptation(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Définissez les critères qui permettront de valider que la tâche est terminée :&#10;- Critère 1...&#10;- Critère 2...&#10;- Critère 3..."
                maxLength={1500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {criteresAcceptation.length}/1500 caractères
              </p>
            </div>
          </div>

          {/* Pièces jointes */}
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Paperclip size={20} className="text-orange-600" />
              <span>Pièces jointes ({totalAttachments})</span>
            </h3>
            
            <div className="space-y-4">
              {/* Existing Attachments */}
              {existingAttachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>Fichiers existants ({existingAttachments.length})</span>
                    {task && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                        Cliquez sur la corbeille pour supprimer
                      </span>
                    )}
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {existingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-200 group hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(attachment.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.nom}
                            </p>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span>{formatFileSize(attachment.taille)}</span>
                              <span>par {attachment.uploaded_by.prenom} {attachment.uploaded_by.nom}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => downloadAttachment(attachment)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Télécharger le fichier"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExistingAttachment(attachment.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group-hover:opacity-100 opacity-70"
                            title="Supprimer définitivement ce fichier"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                <input
                  type="file"
                  id="taskFileUpload"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                />
                <label
                  htmlFor="taskFileUpload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Upload className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Cliquez pour ajouter des fichiers
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, Word, Excel, Images, Texte (max 10MB par fichier)
                    </p>
                  </div>
                </label>
              </div>

              {/* New Attachments */}
              {newAttachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>Nouveaux fichiers ({newAttachments.length})</span>
                    <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded-full">
                      Seront ajoutés lors de la sauvegarde
                    </span>
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {newAttachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-green-50 rounded-lg p-3 border border-green-200 group hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(file.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • Nouveau fichier
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewAttachment(index)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group-hover:opacity-100 opacity-70"
                          title="Retirer de la sélection"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachment Guidelines */}
              {totalAttachments > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="text-yellow-600 mt-0.5">⚠️</div>
                    <div className="text-xs text-yellow-800">
                      <p className="font-medium mb-1">Important :</p>
                      <ul className="space-y-1">
                        <li>• La suppression d'un fichier existant est définitive</li>
                        <li>• Les nouveaux fichiers ne seront ajoutés qu'après sauvegarde</li>
                        <li>• Assurez-vous d'avoir les bonnes autorisations avant de supprimer</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Users */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <User size={20} className="text-gray-600" />
              <span>Personnes assignées ({selectedUsers.length} sélectionnée{selectedUsers.length > 1 ? 's' : ''})</span>
            </h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
              {availableUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="mx-auto mb-2" size={32} />
                  <p>Aucun membre disponible</p>
                  <p className="text-sm">Créez d'abord des membres dans la gestion des membres</p>
                </div>
              ) : (
                availableUsers.map(user => (
                  <label key={user.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedUsers.some(u => u.id === user.id)}
                      onChange={() => toggleUser(user)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.prenom.charAt(0)}{user.nom.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {user.prenom} {user.nom}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <div className="flex items-center space-x-1">
                          <Building size={12} />
                          <span>{user.departement}</span>
                        </div>
                        {user.fonction && (
                          <div className="flex items-center space-x-1">
                            <Briefcase size={12} />
                            <span>{user.fonction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedUsers.length === 0 && availableUsers.length > 0 && (
              <p className="text-sm text-red-600 mt-2">Veuillez sélectionner au moins une personne</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!taskName.trim() || !taskDate || availableUsers.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {task ? <Save size={18} /> : <Plus size={18} />}
              <span>{task ? 'Modifier' : 'Créer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;