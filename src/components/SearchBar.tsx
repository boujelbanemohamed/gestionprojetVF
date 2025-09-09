import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, User, Building, FileText } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { Project, Task, User as UserType } from '../types';

interface SearchResult {
  type: 'project' | 'task' | 'user';
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface SearchBarProps {
  projects: Project[];
  users: UserType[];
  onNavigateToProject: (projectId: string) => void;
  onNavigateToUser: (userId: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  projects,
  users,
  onNavigateToProject,
  onNavigateToUser,
  placeholder = "Rechercher projets, tâches, membres..."
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      const results = getSearchResults();
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (results[selectedIndex]) {
            results[selectedIndex].onClick();
            handleClose();
          }
          break;
        case 'Escape':
          event.preventDefault();
          handleClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex]);

  const getSearchResults = (): SearchResult[] => {
    if (!debouncedQuery.trim()) return [];

    const term = debouncedQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search projects
    projects.forEach(project => {
      if (
        project.nom.toLowerCase().includes(term) ||
        (project.description && project.description.toLowerCase().includes(term)) ||
        (project.departement && project.departement.toLowerCase().includes(term))
      ) {
        results.push({
          type: 'project',
          id: project.id,
          title: project.nom,
          subtitle: project.departement || 'Aucun département',
          icon: <FileText className="text-blue-600" size={16} />,
          onClick: () => onNavigateToProject(project.id)
        });
      }

      // Search tasks within projects
      project.taches.forEach(task => {
        if (
          task.nom.toLowerCase().includes(term) ||
          (task.description && task.description.toLowerCase().includes(term))
        ) {
          results.push({
            type: 'task',
            id: task.id,
            title: task.nom,
            subtitle: `Tâche dans ${project.nom}`,
            icon: <Clock className="text-green-600" size={16} />,
            onClick: () => onNavigateToProject(project.id)
          });
        }
      });
    });

    // Search users
    users.forEach(user => {
      if (
        user.nom.toLowerCase().includes(term) ||
        user.prenom.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.fonction && user.fonction.toLowerCase().includes(term))
      ) {
        results.push({
          type: 'user',
          id: user.id,
          title: `${user.prenom} ${user.nom}`,
          subtitle: user.fonction || user.departement,
          icon: <User className="text-purple-600" size={16} />,
          onClick: () => onNavigateToUser(user.id)
        });
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(value.trim().length > 0);
    setSelectedIndex(0);
  };

  const results = getSearchResults();

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={20} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          placeholder={placeholder}
          aria-label="Recherche globale dans l'application"
        />
        {query && (
          <button
            onClick={handleClose}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="text-gray-400 hover:text-gray-600" size={20} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => {
                result.onClick();
                handleClose();
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {result.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {result.title}
                </p>
                {result.subtitle && (
                  <p className="text-xs text-gray-500 truncate">
                    {result.subtitle}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  result.type === 'project' ? 'bg-blue-100 text-blue-800' :
                  result.type === 'task' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {result.type === 'project' ? 'Projet' :
                   result.type === 'task' ? 'Tâche' : 'Membre'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && debouncedQuery.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-8 z-50">
          <div className="text-center">
            <Search className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm text-gray-500">
              Aucun résultat pour "{debouncedQuery}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;