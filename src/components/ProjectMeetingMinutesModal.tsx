import React from 'react';
import { X, FileText, Calendar, Download, Eye, Building, Plus } from 'lucide-react';
import { Project } from '../types';

interface MeetingMinute {
  id: string;
  titre: string;
  date_reunion: Date;
  description?: string;
  nom_fichier: string;
  taille_fichier: number;
  type_fichier: string;
  url_fichier: string;
  uploaded_by: any;
  projets: Project[];
  created_at: Date;
  updated_at: Date;
}

interface ProjectMeetingMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  meetingMinutes?: any[];
}

const ProjectMeetingMinutesModal: React.FC<ProjectMeetingMinutesModalProps> = ({
  isOpen,
  onClose,
  project,
  meetingMinutes = []
}) => {
  if (!isOpen) return null;

  // Get meeting minutes for this project
  const getProjectMeetingMinutes = (): MeetingMinute[] => {
    // Filter meeting minutes that are associated with this project
    return meetingMinutes.filter(pv => 
      pv.projet_ids && pv.projet_ids.includes(project.id)
    );
  };

  const projectMeetingMinutes = getProjectMeetingMinutes();

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
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    return '📎';
  };

  const handleView = (pv: MeetingMinute) => {
    // In a real app, this would open the file
    window.open(pv.url_fichier, '_blank');
  };

  const handleDownload = (pv: MeetingMinute) => {
    // In a real app, this would download the file
    if (pv.url_fichier) {
      const link = document.createElement('a');
      link.href = pv.url_fichier;
      link.download = pv.nom_fichier;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                PV de Réunion - {project.nom}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {projectMeetingMinutes.length} procès-verbal{projectMeetingMinutes.length > 1 ? 'aux' : ''} associé{projectMeetingMinutes.length > 1 ? 's' : ''} à ce projet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {projectMeetingMinutes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun PV de réunion
              </h3>
              <p className="text-gray-500 mb-4">
                Ce projet n'a pas encore de procès-verbal de réunion associé.
              </p>
              <p className="text-sm text-blue-600">
                Utilisez la page "PV de Réunion" du menu principal pour en ajouter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectMeetingMinutes
                .sort((a, b) => new Date(b.date_reunion).getTime() - new Date(a.date_reunion).getTime())
                .map((pv) => (
                  <div key={pv.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <span className="text-3xl">{getFileIcon(pv.type_fichier)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {pv.titre}
                          </h4>
                          
                          {pv.description && (
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                              {pv.description}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="text-gray-600">
                                Réunion du {pv.date_reunion.toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FileText size={16} className="text-gray-400" />
                              <span className="text-gray-600">
                                {pv.nom_fichier} ({formatFileSize(pv.taille_fichier)})
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
                            <span>Uploadé par {pv.uploaded_by.prenom} {pv.uploaded_by.nom}</span>
                            <span>•</span>
                            <span>le {pv.created_at.toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleView(pv)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualiser le PV"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(pv)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Télécharger le PV"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-4">
              Accès en lecture seule • Utilisez la page "PV de Réunion" du menu principal pour gérer les PV
            </div>
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMeetingMinutesModal;