import React, { useState } from 'react';
import { ArrowLeft, Plus, User, Mail, Building, Briefcase, Search, Edit2, Trash2, Shield, Crown, UserCheck, FolderOpen, Star, Calendar, BarChart3 } from 'lucide-react';
import { User as UserType, Department, AuthUser, Project } from '../types';
import { PermissionService } from '../utils/permissions';
import CreateMemberModal from './CreateMemberModal';
import ChangeRoleModal from './ChangeRoleModal';
import MemberProjectsModal from './MemberProjectsModal';

interface MembersManagementProps {
  members: UserType[];
  departments: Department[];
  projects: Project[];
  onBack: () => void;
  onCreateMember: (member: Omit<UserType, 'id' | 'created_at'>) => void;
  onUpdateMember: (id: string, member: Omit<UserType, 'id' | 'created_at'>) => void;
  onDeleteMember: (id: string) => void;
  onManageDepartments: () => void;
  currentUser: AuthUser;
}

const MembersManagement: React.FC<MembersManagementProps> = ({
  members,
  departments,
  projects,
  onBack,
  onCreateMember,
  onUpdateMember,
  onDeleteMember,
  onManageDepartments,
  currentUser
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<UserType | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR'>('all');
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] = useState<UserType | undefined>();
  const [selectedMemberForProjects, setSelectedMemberForProjects] = useState<UserType | undefined>();
  const [isMemberProjectsModalOpen, setIsMemberProjectsModalOpen] = useState(false);

  const availableDepartments = Array.from(new Set(members.map(m => m.departement))).sort();

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.fonction && member.fonction.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = !filterDepartment || member.departement === filterDepartment;
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    
    return matchesSearch && matchesDepartment && matchesRole;
  });

  // Get projects where member is assigned
  const getMemberAssignedProjects = (memberId: string): Project[] => {
    return projects.filter(project => 
      project.taches.some(task => 
        task.utilisateurs.some(user => user.id === memberId)
      )
    );
  };

  // Get projects where member is responsible
  const getMemberResponsibleProjects = (memberId: string): Project[] => {
    return projects.filter(project => project.responsable_id === memberId);
  };

  // Get member statistics
  const getMemberStats = (memberId: string) => {
    const assignedProjects = getMemberAssignedProjects(memberId);
    const responsibleProjects = getMemberResponsibleProjects(memberId);
    
    const totalTasks = assignedProjects.reduce((sum, project) => 
      sum + project.taches.filter(task => 
        task.utilisateurs.some(user => user.id === memberId)
      ).length, 0
    );
    
    const completedTasks = assignedProjects.reduce((sum, project) => 
      sum + project.taches.filter(task => 
        task.utilisateurs.some(user => user.id === memberId) && task.etat === 'cloturee'
      ).length, 0
    );
    
    return {
      assignedProjects: assignedProjects.length,
      responsibleProjects: responsibleProjects.length,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };
  const handleDeleteMember = (member: UserType) => {
    if (!PermissionService.canManageUser(currentUser, member)) {
      alert('Vous n\'avez pas les permissions pour supprimer ce membre');
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${member.prenom} ${member.nom} ?`)) {
      onDeleteMember(member.id);
    }
  };

  const handleEditMember = (member: UserType) => {
    if (!PermissionService.canManageUser(currentUser, member)) {
      alert('Vous n\'avez pas les permissions pour modifier ce membre');
      return;
    }

    setEditingMember(member);
    setIsCreateModalOpen(true);
  };

  const handleSubmitMember = (memberData: Omit<UserType, 'id' | 'created_at'>) => {
    if (editingMember) {
      onUpdateMember(editingMember.id, memberData);
    } else {
      onCreateMember(memberData);
    }
    setEditingMember(undefined);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingMember(undefined);
  };

  const handleChangeRole = (member: UserType) => {
    if (!PermissionService.canChangeRole(currentUser)) {
      alert('Vous n\'avez pas les permissions pour modifier les rôles');
      return;
    }

    if (member.id === currentUser.id) {
      alert('Vous ne pouvez pas modifier votre propre rôle');
      return;
    }

    setMemberToChangeRole(member);
    setIsChangeRoleModalOpen(true);
  };

  const handleRoleChange = (newRole: 'SUPER_ADMIN' | 'ADMIN' | 'UTILISATEUR') => {
    if (!memberToChangeRole) return;

    const updatedMemberData = {
      nom: memberToChangeRole.nom,
      prenom: memberToChangeRole.prenom,
      fonction: memberToChangeRole.fonction,
      departement: memberToChangeRole.departement,
      email: memberToChangeRole.email,
      role: newRole
    };

    onUpdateMember(memberToChangeRole.id, updatedMemberData);
    setMemberToChangeRole(undefined);
    setIsChangeRoleModalOpen(false);
  };

  const handleShowMemberProjects = (member: UserType) => {
    setSelectedMemberForProjects(member);
    setIsMemberProjectsModalOpen(true);
  };
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Crown className="text-purple-600" size={16} />;
      case 'ADMIN':
        return <Shield className="text-blue-600" size={16} />;
      case 'UTILISATEUR':
        return <UserCheck className="text-green-600" size={16} />;
      default:
        return <User className="text-gray-600" size={16} />;
    }
  };

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

  const getRoleStats = () => {
    const superAdminCount = members.filter(m => m.role === 'SUPER_ADMIN').length;
    const adminCount = members.filter(m => m.role === 'ADMIN').length;
    const userCount = members.filter(m => m.role === 'UTILISATEUR').length;
    
    return { superAdminCount, adminCount, userCount };
  };

  const roleStats = getRoleStats();

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
                  <User className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestion des membres</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {members.length} membre{members.length > 1 ? 's' : ''} enregistré{members.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {PermissionService.hasPermission(currentUser, 'departments', 'view') && (
                <button
                  onClick={onManageDepartments}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Building size={18} />
                  <span>Gérer les départements</span>
                </button>
              )}
              {PermissionService.hasPermission(currentUser, 'members', 'create') && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Créer un membre</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Crown className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Super Admins</p>
                <p className="text-2xl font-bold text-gray-900">{roleStats.superAdminCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{roleStats.adminCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">{roleStats.userCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou fonction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Rechercher un membre"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les départements</option>
                {availableDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les rôles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="UTILISATEUR">Utilisateur</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members List */}
        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <User className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterDepartment || filterRole !== 'all' ? 'Aucun membre trouvé' : 'Aucun membre'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterDepartment || filterRole !== 'all'
                ? 'Aucun membre ne correspond à vos critères de recherche'
                : 'Commencez par créer votre premier membre'
              }
            </p>
            {!searchTerm && !filterDepartment && filterRole === 'all' && (
              <div className="space-y-4">
                {departments.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-amber-800 text-sm">
                      Vous devez d'abord créer des départements avant de pouvoir créer des membres.
                    </p>
                    {PermissionService.hasPermission(currentUser, 'departments', 'view') && (
                      <button
                        onClick={onManageDepartments}
                        className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                      >
                        Gérer les départements
                      </button>
                    )}
                  </div>
                )}
                {PermissionService.hasPermission(currentUser, 'members', 'create') && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={departments.length === 0}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Créer un membre
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Membre
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Rôle
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Département
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Projets & Performance
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMembers.map((member) => {
                    const stats = getMemberStats(member.id);
                    const assignedProjects = getMemberAssignedProjects(member.id);
                    const responsibleProjects = getMemberResponsibleProjects(member.id);
                    
                    return (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.prenom.charAt(0)}{member.nom.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.prenom} {member.nom}
                              {member.id === currentUser.id && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  Vous
                                </span>
                              )}
                            </div>
                            {member.fonction && (
                              <div className="text-sm text-gray-500">{member.fonction}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getRoleBadge(member.role)}
                          {PermissionService.canChangeRole(currentUser) && member.id !== currentUser.id && (
                            <button
                              onClick={() => handleChangeRole(member)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Modifier le rôle"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Building size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-900">{member.departement}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {/* Projects Summary */}
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <FolderOpen size={14} className="text-blue-600" />
                              <span className="text-xs text-gray-600">
                                {stats.assignedProjects} assigné{stats.assignedProjects > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star size={14} className="text-yellow-600" />
                              <span className="text-xs text-gray-600">
                                {stats.responsibleProjects} responsable{stats.responsibleProjects > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* Performance */}
                          {stats.totalTasks > 0 && (
                            <div className="flex items-center space-x-2">
                              <BarChart3 size={14} className="text-green-600" />
                              <span className="text-xs text-gray-600">
                                {stats.completedTasks}/{stats.totalTasks} tâches ({stats.completionRate}%)
                              </span>
                            </div>
                          )}
                          
                          {/* View Details Button */}
                          {(assignedProjects.length > 0 || responsibleProjects.length > 0) && (
                            <button
                              onClick={() => handleShowMemberProjects(member)}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                            >
                              Voir les détails →
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{member.email}</span>
                          </div>
                          {member.fonction && (
                            <div className="flex items-center space-x-2">
                              <Briefcase size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-500">{member.fonction}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {PermissionService.canManageUser(currentUser, member) && (
                            <>
                              <button
                                onClick={() => handleEditMember(member)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CreateMemberModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitMember}
        editingMember={editingMember}
        departments={departments}
        currentUser={currentUser}
      />

      <MemberProjectsModal
        isOpen={isMemberProjectsModalOpen}
        onClose={() => {
          setIsMemberProjectsModalOpen(false);
          setSelectedMemberForProjects(undefined);
        }}
        member={selectedMemberForProjects}
        assignedProjects={selectedMemberForProjects ? getMemberAssignedProjects(selectedMemberForProjects.id) : []}
        responsibleProjects={selectedMemberForProjects ? getMemberResponsibleProjects(selectedMemberForProjects.id) : []}
      />
      <ChangeRoleModal
        isOpen={isChangeRoleModalOpen}
        onClose={() => {
          setIsChangeRoleModalOpen(false);
          setMemberToChangeRole(undefined);
        }}
        member={memberToChangeRole}
        onConfirm={handleRoleChange}
        currentUser={currentUser}
      />
    </div>
  );
};

export default MembersManagement;