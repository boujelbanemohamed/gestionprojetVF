import React, { useState, useEffect } from 'react';
import { Shield, User, Search, Check, X, AlertTriangle, Save, Crown, UserCheck } from 'lucide-react';
import { AuthUser, User as UserType } from '../types';
import { PermissionsService } from '../services/permissionsService';

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
  is_system?: boolean;
}

interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted: boolean;
  granted_by: string;
  granted_at: Date;
}

interface PermissionsSettingsProps {
  currentUser: AuthUser;
}

const PermissionsSettings: React.FC<PermissionsSettingsProps> = ({
  currentUser
}) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResource, setFilterResource] = useState<string>('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions(selectedUser.id);
    }
  }, [selectedUser]);

  const loadData = () => {
    // In a real app, this would load from API
    // For now, we'll use mock data
    const mockUsers: UserType[] = [
      {
        id: '1',
        nom: 'Dupont',
        prenom: 'Marie',
        fonction: 'Chef de projet',
        departement: 'IT',
        email: 'marie.dupont@example.com',
        role: 'SUPER_ADMIN',
        created_at: new Date('2024-01-15')
      },
      {
        id: '2',
        nom: 'Martin',
        prenom: 'Pierre',
        fonction: 'Développeur Senior',
        departement: 'IT',
        email: 'pierre.martin@example.com',
        role: 'ADMIN',
        created_at: new Date('2024-01-16')
      },
      {
        id: '3',
        nom: 'Lemoine',
        prenom: 'Sophie',
        fonction: 'Designer UX/UI',
        departement: 'Design',
        email: 'sophie.lemoine@example.com',
        role: 'UTILISATEUR',
        created_at: new Date('2024-01-17')
      }
    ];

    setUsers(mockUsers);
    setPermissions(PermissionsService.getAllPermissions());
  };

  const loadUserPermissions = (userId: string) => {
    const userPerms = PermissionsService.getUserPermissions(userId);
    setUserPermissions(userPerms);
    setPendingChanges(new Map());
    setHasChanges(false);
  };

  const handlePermissionToggle = (permissionId: string, granted: boolean) => {
    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(permissionId, granted);
    setPendingChanges(newPendingChanges);
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    if (!selectedUser) return;

    pendingChanges.forEach((granted, permissionId) => {
      if (granted) {
        PermissionsService.grantPermission(selectedUser.id, permissionId, currentUser.id);
      } else {
        PermissionsService.revokePermission(selectedUser.id, permissionId, currentUser.id);
      }
    });

    loadUserPermissions(selectedUser.id);
    setHasChanges(false);
    setPendingChanges(new Map());
  };

  const handleCancelChanges = () => {
    setPendingChanges(new Map());
    setHasChanges(false);
  };

  const isPermissionGranted = (permissionId: string): boolean => {
    if (!selectedUser) return false;

    // Check pending changes first
    if (pendingChanges.has(permissionId)) {
      return pendingChanges.get(permissionId)!;
    }

    // Check role-based permissions
    const hasRolePermission = PermissionsService.hasPermission(
      selectedUser as AuthUser, 
      permissions.find(p => p.id === permissionId)?.resource || '',
      permissions.find(p => p.id === permissionId)?.action || ''
    );

    if (hasRolePermission) return true;

    // Check custom user permissions
    const userPermission = userPermissions.find(up => up.permission_id === permissionId);
    return userPermission?.granted || false;
  };

  const isPermissionFromRole = (permissionId: string): boolean => {
    if (!selectedUser) return false;

    const permission = permissions.find(p => p.id === permissionId);
    if (!permission) return false;

    return PermissionsService.hasPermission(
      selectedUser as AuthUser,
      permission.resource,
      permission.action
    );
  };

  const filteredUsers = users.filter(user =>
    user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = permissions.filter(permission =>
    filterResource === 'all' || permission.resource === filterResource
  );

  const resources = Array.from(new Set(permissions.map(p => p.resource))).sort();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            <Crown size={12} />
            <span>Super Admin</span>
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <Shield size={12} />
            <span>Admin</span>
          </span>
        );
      case 'UTILISATEUR':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <UserCheck size={12} />
            <span>Utilisateur</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            <User size={12} />
            <span>{role}</span>
          </span>
        );
    }
  };

  const getResourceDisplayName = (resource: string): string => {
    const resourceNames: Record<string, string> = {
      'dashboard': 'Tableau de bord',
      'projects': 'Projets',
      'tasks': 'Tâches',
      'members': 'Membres',
      'departments': 'Départements',
      'performance': 'Performance',
      'budget': 'Budget',
      'settings': 'Paramètres',
      'comments': 'Commentaires',
      'attachments': 'Pièces jointes'
    };
    
    return resourceNames[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Droits d'accès</h2>
        <p className="text-sm text-gray-600 mt-1">
          Gérez les permissions spécifiques des utilisateurs au-delà de leurs rôles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users List */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Utilisateurs</h3>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               aria-label="Rechercher un utilisateur pour gérer ses permissions"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedUser?.id === user.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.prenom.charAt(0)}{user.nom.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900">
                      {user.prenom} {user.nom}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      {getRoleBadge(user.role)}
                      <span className="text-xs text-gray-500">
                        {user.departement}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Management */}
        <div className="space-y-4">
          {selectedUser ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Permissions de {selectedUser.prenom} {selectedUser.nom}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Rôle : {getRoleBadge(selectedUser.role)}
                  </p>
                </div>
                {hasChanges && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancelChanges}
                      className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-1"
                    >
                      <Save size={14} />
                      <span>Sauvegarder</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Resource Filter */}
              <div>
                <select
                  value={filterResource}
                  onChange={(e) => setFilterResource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Toutes les ressources</option>
                  {resources.map(resource => (
                    <option key={resource} value={resource}>
                      {getResourceDisplayName(resource)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Permissions List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPermissions.map((permission) => {
                  const isGranted = isPermissionGranted(permission.id);
                  const isFromRole = isPermissionFromRole(permission.id);
                  const hasPendingChange = pendingChanges.has(permission.id);
                  
                  return (
                    <div
                      key={permission.id}
                      className={`p-4 rounded-lg border transition-all ${
                        hasPendingChange ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isGranted ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {isGranted ? (
                                <Check className="text-green-600" size={16} />
                              ) : (
                                <X className="text-gray-400" size={16} />
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {permission.description}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {getResourceDisplayName(permission.resource)}.{permission.action}
                                {isFromRole && (
                                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                    Par rôle
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {hasPendingChange && (
                            <span className="text-xs text-orange-600 font-medium">
                              Modifié
                            </span>
                          )}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={(e) => handlePermissionToggle(permission.id, e.target.checked)}
                              disabled={isFromRole && !hasPendingChange}
                              className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              isGranted ? 'bg-blue-600' : 'bg-gray-300'
                            } ${isFromRole && !hasPendingChange ? 'opacity-50' : ''}`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                isGranted ? 'translate-x-5' : 'translate-x-0'
                              } mt-0.5 ml-0.5`} />
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasChanges && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="text-orange-600 mt-0.5" size={20} />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium">Modifications en attente</p>
                      <p className="mt-1">
                        Vous avez des modifications non sauvegardées. Cliquez sur "Sauvegarder" pour les appliquer.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Shield className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionnez un utilisateur
              </h3>
              <p className="text-gray-500">
                Choisissez un utilisateur dans la liste pour gérer ses permissions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">À propos des droits d'accès :</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Les permissions par rôle sont automatiques et ne peuvent pas être révoquées ici</li>
              <li>Vous pouvez accorder des permissions supplémentaires au-delà du rôle</li>
              <li>Les permissions personnalisées prennent le dessus sur les restrictions de rôle</li>
              <li>Seuls les Super Admin peuvent gérer les permissions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsSettings;