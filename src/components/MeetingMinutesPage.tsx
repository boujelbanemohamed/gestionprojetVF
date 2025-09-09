import React, { useState } from 'react';
import { ArrowLeft, Plus, FileText, Search, Filter, Calendar, Building, Eye, Edit2, Trash2, Download, Upload, X, Save } from 'lucide-react';
import { Project, User, AuthUser } from '../types';
import { PermissionService } from '../utils/permissions';

interface MeetingMinute {
  id: string;
  titre: string;
  date_reunion: Date;
  description?: string;
  nom_fichier: string;
  taille_fichier: number;
  type_fichier: string;
  url_fichier: string;
  uploaded_by: User;
  projets: Project[];
  created_at: Date;
  updated_at: Date;
}

interface MeetingMinutesPageProps {
  meetingMinutes: MeetingMinute[];
  projects: Project[];
  users: User[];
  currentUser: AuthUser;
  onBack: () => void;
  onCreateMeetingMinute: (data: {
    titre: string;
    date_reunion: Date;
    description?: string;
    file: File;
    projet_ids: string[];
  }) => void;
  onUpdateMeetingMinute: (id: string, data: {
    titre: string;
    date_reunion: Date;
    description?: string;
    projet_ids: string[];
  }) => void;
  onDeleteMeetingMinute: (id: string) => void;
}

const MeetingMinutesPage: React.FC<MeetingMinutesPageProps> = ({
  meetingMinutes,
  projects,
  users,
  currentUser,
  onBack,
  onCreateMeetingMinute,
  onUpdateMeetingMinute,
  onDeleteMeetingMinute
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'projects'>('date');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPV, setEditingPV] = useState<MeetingMinute | null>(null);

  // Filter and sort meeting minutes
  const filteredMeetingMinutes = meetingMinutes
    .filter(pv => {
      const matchesSearch = pv.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (pv.description && pv.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesProject = !filterProject || 
                            (pv.projets || []).some(project => project.id === filterProject);
      
      const matchesDate = !filterDate || 
                         pv.date_reunion.toISOString().split('T')[0] === filterDate;
      
      return matchesSearch && matchesProject && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.titre.localeCompare(b.titre);
        case 'projects':
          const aProjects = (a.projets || []).map(p => p.nom).join(', ');
          const bProjects = (b.projets || []).map(p => p.nom).join(', ');
          return aProjects.localeCompare(bProjects);
        case 'date':
        default:
          return new Date(b.date_reunion).getTime() - new Date(a.date_reunion).getTime();
      }
    });

  const handleEdit = (pv: MeetingMinute) => {
    if (!PermissionService.hasPermission(currentUser, 'meeting-minutes', 'edit')) {
      alert('Vous n\'avez pas les permissions pour modifier ce PV');
      return;
    }

    // Check if user can edit (creator or admin)
    if (pv.uploaded_by?.id !== currentUser.id && !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      alert('Vous ne pouvez modifier que vos propres PV');
      return;
    }

    setEditingPV(pv);
    setIsCreateModalOpen(true);
  };

  const handleDelete = (pv: MeetingMinute) => {
    if (!PermissionService.hasPermission(currentUser, 'meeting-minutes', 'delete')) {
      alert('Vous n\'avez pas les permissions pour supprimer ce PV');
      return;
    }

    // Check if user can delete (creator or admin)
    if (pv.uploaded_by?.id !== currentUser.id && !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      alert('Vous ne pouvez supprimer que vos propres PV');
      return;
    }

    const projectNames = (pv.projets || []).map(p => p.nom).join(', ');
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le PV "${pv.titre}" ?\n\n` +
                          `Ce PV est associé aux projets : ${projectNames}\n\n` +
                          `Cette action est irréversible.`;

    if (window.confirm(confirmMessage)) {
      onDeleteMeetingMinute(pv.id);
    }
  };

  const handleView = (pv: MeetingMinute) => {
    // Open file in new tab or download
    if (pv.url_fichier) {
      window.open(pv.url_fichier, '_blank');
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
    if (!type) return '📄';
    
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    return '📄';
  };

  const canCreatePV = PermissionService.hasPermission(currentUser, 'meeting-minutes', 'create');
  const canEditPV = PermissionService.hasPermission(currentUser, 'meeting-minutes', 'edit');
  const canDeletePV = PermissionService.hasPermission(currentUser, 'meeting-minutes', 'delete');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">PV de Réunion</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {meetingMinutes.length} procès-verbal{meetingMinutes.length > 1 ? 'aux' : ''} enregistré{meetingMinutes.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            {canCreatePV && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Ajouter un PV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un PV par titre ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Rechercher un PV de réunion"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400" size={20} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date">Trier par date</option>
                  <option value="title">Trier par titre</option>
                  <option value="projects">Trier par projets</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="text-gray-400" size={20} />
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les projets</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.nom}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="text-gray-400" size={20} />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Minutes List */}
        {filteredMeetingMinutes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterProject || filterDate ? 'Aucun PV trouvé' : 'Aucun PV de réunion'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterProject || filterDate
                ? 'Aucun PV ne correspond à vos critères de recherche'
                : 'Commencez par ajouter votre premier procès-verbal de réunion'
              }
            </p>
            {!searchTerm && !filterProject && !filterDate && canCreatePV && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ajouter un PV
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      PV de Réunion
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Date de Réunion
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Projets Associés
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Créé par
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMeetingMinutes.map((pv) => (
                    <tr key={pv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <span className="text-2xl">{getFileIcon(pv.type_fichier || '')}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {pv.titre}
                            </h4>
                            {pv.description && (
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {pv.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                              <span>{pv.nom_fichier || 'document.pdf'}</span>
                              <span>•</span>
                              <span>{formatFileSize(pv.taille_fichier || 0)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {pv.date_reunion.toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(pv.projets || []).length === 0 ? (
                            <span className="text-sm text-gray-500">Aucun projet</span>
                          ) : (
                            (pv.projets || []).slice(0, 2).map(project => (
                              <span
                                key={project.id}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                              >
                                {project.nom}
                              </span>
                            ))
                          )}
                          {(pv.projets || []).length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{(pv.projets || []).length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {pv.uploaded_by ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {pv.uploaded_by.prenom?.charAt(0) || 'U'}{pv.uploaded_by.nom?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm text-gray-900">
                                {pv.uploaded_by.prenom || ''} {pv.uploaded_by.nom || 'Utilisateur'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {pv.created_at?.toLocaleDateString('fr-FR') || 'Date inconnue'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Utilisateur inconnu</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleView(pv)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Visualiser le PV"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleView(pv)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Télécharger le PV"
                          >
                            <Download size={16} />
                          </button>
                          {(canEditPV && (pv.uploaded_by?.id === currentUser.id || ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role))) && (
                            <button
                              onClick={() => handleEdit(pv)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier le PV"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {(canDeletePV && (pv.uploaded_by?.id === currentUser.id || ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role))) && (
                            <button
                              onClick={() => handleDelete(pv)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer le PV"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CreateMeetingMinuteModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPV(null);
        }}
        onSubmit={(data) => {
          if (editingPV) {
            onUpdateMeetingMinute(editingPV.id, data);
          } else {
            onCreateMeetingMinute(data);
          }
          setEditingPV(null);
        }}
        projects={projects}
        editingPV={editingPV}
      />
    </div>
  );
};

// Create/Edit Modal Component
interface CreateMeetingMinuteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    titre: string;
    date_reunion: Date;
    description?: string;
    file?: File;
    projet_ids: string[];
  }) => void;
  projects: Project[];
  editingPV?: MeetingMinute | null;
}

const CreateMeetingMinuteModal: React.FC<CreateMeetingMinuteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projects,
  editingPV
}) => {
  const [formData, setFormData] = useState({
    titre: '',
    date_reunion: new Date().toISOString().split('T')[0],
    description: '',
    projet_ids: [] as string[]
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      if (editingPV) {
        setFormData({
          titre: editingPV.titre,
          date_reunion: editingPV.date_reunion.toISOString().split('T')[0],
          description: editingPV.description || '',
          projet_ids: (editingPV.projets || []).map(p => p.id)
        });
        setSelectedFile(null);
      } else {
        setFormData({
          titre: '',
          date_reunion: new Date().toISOString().split('T')[0],
          description: '',
          projet_ids: []
        });
        setSelectedFile(null);
      }
      setErrors({});
    }
  }, [isOpen, editingPV]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est obligatoire';
    }

    if (!formData.date_reunion) {
      newErrors.date_reunion = 'La date de réunion est obligatoire';
    }

    if (!editingPV && !selectedFile) {
      newErrors.file = 'Le fichier PV est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        titre: formData.titre.trim(),
        date_reunion: new Date(formData.date_reunion),
        description: formData.description.trim() || undefined,
        file: selectedFile || undefined,
        projet_ids: formData.projet_ids
      });
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 20 * 1024 * 1024; // 20MB for PV files
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      if (file.size > maxSize) {
        alert('Le fichier est trop volumineux (max 20MB)');
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        alert('Type de fichier non autorisé. Utilisez PDF, Word ou PowerPoint.');
        return;
      }

      setSelectedFile(file);
      if (errors.file) {
        setErrors(prev => ({ ...prev, file: '' }));
      }
    }
  };

  const toggleProject = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projet_ids: prev.projet_ids.includes(projectId)
        ? prev.projet_ids.filter(id => id !== projectId)
        : [...prev.projet_ids, projectId]
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    return '📎';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingPV ? 'Modifier le PV' : 'Ajouter un PV de Réunion'}
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
          {/* Titre */}
          <div>
            <label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-2">
              Titre du PV <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.titre ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Ex: Réunion de lancement projet X"
              autoFocus
            />
            {errors.titre && (
              <p className="text-red-600 text-sm mt-1">{errors.titre}</p>
            )}
          </div>

          {/* Date de réunion */}
          <div>
            <label htmlFor="date_reunion" className="block text-sm font-medium text-gray-700 mb-2">
              Date de la réunion <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date_reunion"
              value={formData.date_reunion}
              onChange={(e) => setFormData(prev => ({ ...prev, date_reunion: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.date_reunion ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.date_reunion && (
              <p className="text-red-600 text-sm mt-1">{errors.date_reunion}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="Résumé ou points clés de la réunion..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 caractères
            </p>
          </div>

          {/* Upload de fichier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fichier PV {!editingPV && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-3">
              {/* Current file (for editing) */}
              {editingPV && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getFileIcon(editingPV.type_fichier)}</span>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Fichier actuel : {editingPV.nom_fichier}
                      </p>
                      <p className="text-xs text-blue-700">
                        {formatFileSize(editingPV.taille_fichier)} • Uploadé le {editingPV.created_at.toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="pvFile"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                />
                <label
                  htmlFor="pvFile"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Upload className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {editingPV ? 'Remplacer le fichier (optionnel)' : 'Cliquez pour ajouter le fichier PV'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, Word, PowerPoint (max 20MB)
                    </p>
                  </div>
                </label>
              </div>

              {/* Selected file preview */}
              {selectedFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getFileIcon(selectedFile.type)}</span>
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-700">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {errors.file && (
              <p className="text-red-600 text-sm mt-1">{errors.file}</p>
            )}
          </div>

          {/* Sélection des projets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projets associés ({formData.projet_ids.length} sélectionné{formData.projet_ids.length > 1 ? 's' : ''})
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto bg-white">
              {projects.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Building className="mx-auto mb-2" size={24} />
                  <p className="text-sm">Aucun projet disponible</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map(project => (
                    <label
                      key={project.id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.projet_ids.includes(project.id)}
                        onChange={() => toggleProject(project.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {project.nom}
                        </div>
                        {project.departement && (
                          <div className="text-xs text-gray-500">
                            {project.departement}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sélectionnez un ou plusieurs projets à associer à ce PV
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Save size={18} />
              <span>{editingPV ? 'Modifier' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingMinutesPage;