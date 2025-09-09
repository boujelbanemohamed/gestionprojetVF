import React, { useEffect, useState } from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsProps {
  onCreateProject: () => void;
  onCreateTask: () => void;
  onCreateMember: () => void;
  onSearch: () => void;
  onNavigateHome: () => void;
  onOpenProfile: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onCreateProject,
  onCreateTask,
  onCreateMember,
  onSearch,
  onNavigateHome,
  onOpenProfile
}) => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;

      // Global shortcuts
      if (cmdKey) {
        switch (event.key.toLowerCase()) {
          case 'k':
            event.preventDefault();
            onSearch();
            break;
          case 'n':
            event.preventDefault();
            onCreateProject();
            break;
          case 't':
            event.preventDefault();
            onCreateTask();
            break;
          case 'u':
            event.preventDefault();
            onCreateMember();
            break;
          case ',':
            event.preventDefault();
            onOpenProfile();
            break;
          case '/':
            event.preventDefault();
            setShowHelp(true);
            break;
        }
      }

      // Simple shortcuts
      switch (event.key) {
        case 'h':
          if (!cmdKey) {
            event.preventDefault();
            onNavigateHome();
          }
          break;
        case '?':
          event.preventDefault();
          setShowHelp(true);
          break;
        case 'Escape':
          setShowHelp(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdSymbol = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { key: `${cmdSymbol} + K`, description: 'Recherche globale' },
    { key: `${cmdSymbol} + N`, description: 'Nouveau projet' },
    { key: `${cmdSymbol} + T`, description: 'Nouvelle tâche' },
    { key: `${cmdSymbol} + U`, description: 'Nouveau membre' },
    { key: `${cmdSymbol} + ,`, description: 'Profil utilisateur' },
    { key: 'H', description: 'Retour à l\'accueil' },
    { key: '?', description: 'Afficher cette aide' },
    { key: 'Échap', description: 'Fermer les modales' }
  ];

  return (
    <>
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Keyboard className="text-blue-600" size={20} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Raccourcis clavier
                </h2>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {shortcut.key.split(' + ').map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && <span className="text-gray-400">+</span>}
                          <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Command className="text-blue-600 mt-0.5" size={16} />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Astuce :</p>
                    <p>Utilisez ces raccourcis pour naviguer plus rapidement dans l'application.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcuts;