import React from 'react';
import { Clock, Play, CheckCircle } from 'lucide-react';
import { Task } from '../types';
import KanbanTaskCard from './KanbanTaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onShowComments: (task: Task) => void;
  onShowDetails: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskClick, onShowComments, onShowDetails, onDeleteTask }) => {
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.etat === status);
  };

  const getStatusConfig = (status: string) => {
    const statusTasks = getTasksByStatus(status);
    const totalTasks = tasks.length;
    const percentage = totalTasks > 0 ? Math.round((statusTasks.length / totalTasks) * 100) : 0;
    
    switch (status) {
      case 'non_debutee':
        return {
          title: 'Non débutée',
          icon: Clock,
          color: 'bg-gray-100 border-gray-300',
          headerColor: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600',
          count: statusTasks.length,
          percentage: percentage
        };
      case 'en_cours':
        return {
          title: 'En cours',
          icon: Play,
          color: 'bg-orange-50 border-orange-200',
          headerColor: 'bg-orange-100 border-orange-300',
          iconColor: 'text-orange-600',
          count: statusTasks.length,
          percentage: percentage
        };
      case 'cloturee':
        return {
          title: 'Clôturée',
          icon: CheckCircle,
          color: 'bg-green-50 border-green-200',
          headerColor: 'bg-green-100 border-green-300',
          iconColor: 'text-green-600',
          count: statusTasks.length,
          percentage: percentage
        };
      default:
        return {
          title: 'Inconnu',
          icon: Clock,
          color: 'bg-gray-100 border-gray-300',
          headerColor: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600',
          count: 0,
          percentage: 0
        };
    }
  };

  const KanbanColumn: React.FC<{ status: string }> = ({ status }) => {
    const config = getStatusConfig(status);
    const columnTasks = getTasksByStatus(status);
    const IconComponent = config.icon;

    return (
      <div className={`flex-1 min-w-0 rounded-xl border-2 ${config.color} overflow-hidden`}>
        {/* Column Header */}
        <div className={`p-4 border-b-2 ${config.headerColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                <IconComponent className={config.iconColor} size={20} />
              </div>
              <div>
                 <h3 className="text-lg font-semibold text-gray-900">
                   {config.title}
                 </h3>
                 <div className="flex items-center space-x-3">
                   <p className="text-sm text-gray-600">{config.count} tâche{config.count > 1 ? 's' : ''}</p>
                   <span className="text-sm font-bold text-gray-700">{config.percentage}%</span>
                 </div>
              </div>
            </div>
            
            {/* Mini progress bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    status === 'non_debutee' ? 'bg-gray-500' :
                    status === 'en_cours' ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${config.percentage}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500 text-center">
                {config.count} sur {tasks.length} tâches au total
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="p-4 space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
          {columnTasks.length === 0 ? (
            <div className="text-center py-8">
              <IconComponent className="mx-auto text-gray-400 mb-3" size={32} />
              <p className="text-gray-500 text-sm">Aucune tâche</p>
            </div>
          ) : (
            columnTasks.map(task => (
              <KanbanTaskCard 
                key={task.id} 
                task={task} 
                onTaskClick={onTaskClick} 
                onShowComments={onShowComments}
                onShowDetails={onShowDetails}
                onDeleteTask={onDeleteTask}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex space-x-6 overflow-x-auto pb-4">
      <KanbanColumn status="non_debutee" />
      <KanbanColumn status="en_cours" />
      <KanbanColumn status="cloturee" />
    </div>
  );
};

export default KanbanBoard;