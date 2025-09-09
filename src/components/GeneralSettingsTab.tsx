import React, { useState } from 'react';
import { Save, Info, Bell, Globe, Clock, Users, Mail } from 'lucide-react';
import { AuthUser } from '../types';
import { PermissionService } from '../utils/permissions';

interface GeneralSettingsTabProps {
  currentUser: AuthUser;
}

const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({
  currentUser
}) => {
  const [settings, setSettings] = useState({
    appName: 'Plateforme de Gestion de Projets',
    defaultLanguage: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    defaultProjectDuration: '30',
    maxFileSize: '10',
    allowedFileTypes: 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,txt',
    emailNotifications: true,
    browserNotifications: false,
    weeklyReports: true,
    autoAssignManager: false,
    // SMTP Settings
    smtpHost: '',
    smtpPort: '587',
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
    smtpFromEmail: '',
    smtpFromName: 'Plateforme de Gestion de Projets'
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    localStorage.setItem('general_settings', JSON.stringify(settings));
    setHasChanges(false);
    setSuccess('Paramètres sauvegardés avec succès');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      appName: 'Plateforme de Gestion de Projets',
      defaultLanguage: 'fr',
      timezone: 'Europe/Paris',
      dateFormat: 'DD/MM/YYYY',
      defaultProjectDuration: '30',
      maxFileSize: '10',
      allowedFileTypes: 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,txt',
      emailNotifications: true,
      browserNotifications: false,
      weeklyReports: true,
      autoAssignManager: false,
      // SMTP Settings
      smtpHost: '',
      smtpPort: '587',
      smtpSecure: false,
      smtpUser: '',
      smtpPassword: '',
      smtpFromEmail: '',
      smtpFromName: 'Plateforme de Gestion de Projets'
    });
    setHasChanges(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Paramètres généraux</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configuration globale de l'application
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-green-600 mt-0.5">✓</div>
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Application Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Application</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'application
              </label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => handleInputChange('appName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langue par défaut
              </label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuseau horaire
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format de date
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Project Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Projets</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée par défaut (jours)
              </label>
              <input
                type="number"
                min="1"
                value={settings.defaultProjectDuration}
                onChange={(e) => handleInputChange('defaultProjectDuration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille max fichiers (MB)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.maxFileSize}
                onChange={(e) => handleInputChange('maxFileSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Types de fichiers autorisés
              </label>
              <input
                type="text"
                value={settings.allowedFileTypes}
                onChange={(e) => handleInputChange('allowedFileTypes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="pdf,doc,docx,xls,xlsx,jpg,jpeg,png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Extensions séparées par des virgules
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoAssignManager"
                  checked={settings.autoAssignManager}
                  onChange={(e) => handleInputChange('autoAssignManager', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoAssignManager" className="text-sm text-gray-700">
                  Assigner automatiquement le responsable aux nouvelles tâches
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Bell className="text-orange-600" size={20} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="text-sm text-gray-700">
                Notifications par email
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="browserNotifications"
                checked={settings.browserNotifications}
                onChange={(e) => handleInputChange('browserNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="browserNotifications" className="text-sm text-gray-700">
                Notifications navigateur
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="weeklyReports"
                checked={settings.weeklyReports}
                onChange={(e) => handleInputChange('weeklyReports', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="weeklyReports" className="text-sm text-gray-700">
                Rapports hebdomadaires automatiques
              </label>
            </div>
          </div>
        </div>

        {/* SMTP Email Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="text-purple-600" size={20} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Configuration SMTP</h3>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="text-blue-600 mt-0.5" size={20} />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Configuration du serveur SMTP</p>
                  <p>Configurez les paramètres de votre serveur SMTP pour l'envoi automatique d'emails (notifications, rapports, alertes).</p>
                </div>
              </div>
            </div>

            {/* Types de notifications */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
                <Bell className="text-gray-600" size={18} />
                <span>Types de notifications par email</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notifications de projets */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-2">
                    📋 Notifications de projets
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_project_assigned"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_project_assigned', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_project_assigned" className="text-sm text-gray-700">
                        <span className="font-medium">Projet assigné</span> - Quand un utilisateur est assigné à un nouveau projet
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_project_deadline"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_project_deadline', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_project_deadline" className="text-sm text-gray-700">
                        <span className="font-medium">Échéance proche</span> - Projet arrivant à échéance (configurable)
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_project_overdue"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_project_overdue', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_project_overdue" className="text-sm text-gray-700">
                        <span className="font-medium text-red-600">Projet en retard</span> - Projet ayant dépassé sa date de fin
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_project_completed"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_project_completed', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_project_completed" className="text-sm text-gray-700">
                        <span className="font-medium text-green-600">Projet terminé</span> - Toutes les tâches sont clôturées
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notifications de tâches */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-2">
                    ✅ Notifications de tâches
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_task_assigned"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_task_assigned', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_task_assigned" className="text-sm text-gray-700">
                        <span className="font-medium">Nouvelle tâche assignée</span> - Assignation à une tâche
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_task_status_changed"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_task_status_changed', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_task_status_changed" className="text-sm text-gray-700">
                        <span className="font-medium">Changement de statut</span> - Tâche débutée, en cours, terminée
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_task_overdue"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_task_overdue', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_task_overdue" className="text-sm text-gray-700">
                        <span className="font-medium text-red-600">Tâche en retard</span> - Tâche dépassant sa date de réalisation
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_task_due_soon"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_task_due_soon', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_task_due_soon" className="text-sm text-gray-700">
                        <span className="font-medium text-orange-600">Échéance proche</span> - Tâche à réaliser dans les 3 jours
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notifications de commentaires */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-2">
                    💬 Notifications de commentaires
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_new_comment"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_new_comment', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_new_comment" className="text-sm text-gray-700">
                        <span className="font-medium">Nouveau commentaire</span> - Sur une tâche assignée
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_comment_mention"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_comment_mention', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_comment_mention" className="text-sm text-gray-700">
                        <span className="font-medium">Mention dans commentaire</span> - Quand vous êtes mentionné (@nom)
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_comment_reply"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_comment_reply', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_comment_reply" className="text-sm text-gray-700">
                        <span className="font-medium">Réponse à commentaire</span> - Réponse à votre commentaire
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notifications budgétaires */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-2">
                    💰 Notifications budgétaires
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_budget_warning"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_budget_warning', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_budget_warning" className="text-sm text-gray-700">
                        <span className="font-medium text-orange-600">Seuil budgétaire</span> - 70% du budget consommé
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_budget_critical"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_budget_critical', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_budget_critical" className="text-sm text-gray-700">
                        <span className="font-medium text-red-600">Budget critique</span> - 90% du budget consommé
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_budget_exceeded"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_budget_exceeded', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_budget_exceeded" className="text-sm text-gray-700">
                        <span className="font-medium text-red-600">Budget dépassé</span> - Budget du projet dépassé
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notifications d'équipe */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-2">
                    👥 Notifications d'équipe
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_new_member"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_new_member', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_new_member" className="text-sm text-gray-700">
                        <span className="font-medium">Nouveau membre</span> - Ajout d'un membre à l'équipe
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_role_changed"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_role_changed', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_role_changed" className="text-sm text-gray-700">
                        <span className="font-medium">Changement de rôle</span> - Modification des permissions d'un utilisateur
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_department_changed"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_department_changed', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_department_changed" className="text-sm text-gray-700">
                        <span className="font-medium">Changement de département</span> - Réassignation départementale
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notifications de fichiers */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-2">
                    📎 Notifications de fichiers
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_file_uploaded"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_file_uploaded', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_file_uploaded" className="text-sm text-gray-700">
                        <span className="font-medium">Nouveau fichier</span> - Ajout de pièce jointe sur vos projets/tâches
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_file_shared"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_file_shared', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_file_shared" className="text-sm text-gray-700">
                        <span className="font-medium">Fichier partagé</span> - Fichier partagé spécifiquement avec vous
                      </label>
                    </div>
                  </div>
                </div>

                {/* Rapports automatiques */}
                <div className="space-y-4">
                  <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-300 pb-2">
                    📊 Rapports automatiques
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_weekly_report"
                        checked={settings.weeklyReports}
                        onChange={(e) => handleInputChange('notif_weekly_report', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_weekly_report" className="text-sm text-gray-700">
                        <span className="font-medium">Rapport hebdomadaire</span> - Résumé des activités de la semaine
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_monthly_report"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_monthly_report', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_monthly_report" className="text-sm text-gray-700">
                        <span className="font-medium">Rapport mensuel</span> - Bilan mensuel des performances
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="notif_project_summary"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('notif_project_summary', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notif_project_summary" className="text-sm text-gray-700">
                        <span className="font-medium">Résumé de projet</span> - Rapport de fin de projet
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration des horaires d'envoi */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h5 className="text-sm font-semibold text-gray-800 mb-4">⏰ Horaires d'envoi</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure des rapports quotidiens
                    </label>
                    <input
                      type="time"
                      value="08:00"
                      onChange={(e) => handleInputChange('dailyReportTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jour des rapports hebdomadaires
                    </label>
                    <select
                      value="monday"
                      onChange={(e) => handleInputChange('weeklyReportDay', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="monday">Lundi</option>
                      <option value="tuesday">Mardi</option>
                      <option value="wednesday">Mercredi</option>
                      <option value="thursday">Jeudi</option>
                      <option value="friday">Vendredi</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jour des rapports mensuels
                    </label>
                    <select
                      value="1"
                      onChange={(e) => handleInputChange('monthlyReportDay', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="1">1er du mois</option>
                      <option value="15">15 du mois</option>
                      <option value="last">Dernier jour du mois</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serveur SMTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port SMTP
                </label>
                <select
                  value={settings.smtpPort}
                  onChange={(e) => handleInputChange('smtpPort', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="25">25 (Non sécurisé)</option>
                  <option value="587">587 (STARTTLS)</option>
                  <option value="465">465 (SSL/TLS)</option>
                  <option value="2525">2525 (Alternative)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur SMTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.smtpUser}
                  onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="votre.email@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe SMTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={settings.smtpPassword}
                  onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email expéditeur <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={settings.smtpFromEmail}
                  onChange={(e) => handleInputChange('smtpFromEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="noreply@votre-entreprise.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'expéditeur
                </label>
                <input
                  type="text"
                  value={settings.smtpFromName}
                  onChange={(e) => handleInputChange('smtpFromName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Plateforme de Gestion de Projets"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="smtpSecure"
                checked={settings.smtpSecure}
                onChange={(e) => handleInputChange('smtpSecure', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="smtpSecure" className="text-sm text-gray-700">
                Utiliser une connexion sécurisée (SSL/TLS)
              </label>
            </div>

            {/* Test Email Button */}
            <div className="pt-4 border-t">
              <button
                onClick={() => {
                  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword || !settings.smtpFromEmail) {
                    alert('Veuillez remplir tous les champs obligatoires avant de tester');
                    return;
                  }
                  alert('Test d\'email envoyé ! (Fonctionnalité de démonstration)');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Mail size={16} />
                <span>Tester la configuration</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Envoie un email de test pour vérifier la configuration SMTP
              </p>
            </div>

            {/* Common SMTP Providers */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Configurations courantes :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="font-medium text-gray-700">Gmail :</div>
                  <div className="text-gray-600">
                    <div>Serveur : smtp.gmail.com</div>
                    <div>Port : 587 (STARTTLS)</div>
                    <div>Sécurisé : Non</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-gray-700">Outlook :</div>
                  <div className="text-gray-600">
                    <div>Serveur : smtp-mail.outlook.com</div>
                    <div>Port : 587 (STARTTLS)</div>
                    <div>Sécurisé : Non</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-gray-700">Yahoo :</div>
                  <div className="text-gray-600">
                    <div>Serveur : smtp.mail.yahoo.com</div>
                    <div>Port : 587 ou 465</div>
                    <div>Sécurisé : Oui (pour 465)</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-gray-700">SendGrid :</div>
                  <div className="text-gray-600">
                    <div>Serveur : smtp.sendgrid.net</div>
                    <div>Port : 587</div>
                    <div>Utilisateur : apikey</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Save size={16} />
            <span>Sauvegarder</span>
          </button>
        </div>
      )}

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="text-blue-600 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">À propos des paramètres généraux :</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Ces paramètres s'appliquent à toute l'application</li>
              <li>Seuls les Super Admin peuvent modifier ces paramètres</li>
              <li>Les changements prennent effet immédiatement</li>
              <li>Certains paramètres peuvent nécessiter un rechargement de la page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsTab;