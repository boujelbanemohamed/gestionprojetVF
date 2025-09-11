import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, Clock, Target, Users, Calendar, Download, Filter, Search, User, Building, FileText, ChevronLeft, ChevronRight, Archive, RefreshCw, AlertCircle } from 'lucide-react';
import { Project, User as UserType, AuthUser } from '../types';
import { getProjectStats } from '../utils/calculations';
import { usePerformance } from '../hooks/usePerformance';
import * as XLSX from 'xlsx';

interface PerformanceDashboardProps {
  projects: Project[];
  users: UserType[];
  onBack: () => void;
  currentUser: AuthUser;
}

interface UserPerformance {
  user: UserType;
  totalTasks: number;
  notStartedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  completionRate: number;
  assignedProjects: number;
  responsibleProjects: number;
}

interface DepartmentPerformance {
  department: string;
  userCount: number;
  totalTasks: number;
  notStartedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  completionRate: number;
  projectCount: number;
}

interface ProjectPerformance {
  project: Project;
  stats: any;
  memberCount: number;
  responsibleUser?: UserType;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  projects,
  users,
  onBack,
  currentUser
}) => {
  const [activeView, setActiveView] = useState<'users' | 'departments' | 'projects'>('users');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'quarter'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Utiliser le hook de performance pour les données dynamiques
  const {
    userPerformance: dynamicUserPerformance,
    departmentPerformance: dynamicDepartmentPerformance,
    projectPerformance: dynamicProjectPerformance,
    loading: performanceLoading,
    error: performanceError,
    refreshData,
    lastUpdated
  } = usePerformance({ projects, users, refreshInterval: 60000 }); // Actualisation toutes les minutes

  // Filter tasks by date
  const getFilteredTasks = () => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (dateFilter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return projects;
    }

    return projects.map(project => ({
      ...project,
      taches: project.taches.filter(task => 
        new Date(task.date_realisation) >= startDate!
      )
    }));
  };

  const filteredProjects = getFilteredTasks();

  // Calculate user performance (utilise les données dynamiques)
  const getUserPerformance = (): UserPerformance[] => {
    if (performanceLoading || !dynamicUserPerformance.length) {
      return [];
    }

    return dynamicUserPerformance
      .filter(perf => 
        searchTerm === '' || 
        perf.user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perf.user.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (perf.user.fonction && perf.user.fonction.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .map(perf => ({
        user: perf.user,
        totalTasks: perf.totalTasks,
        notStartedTasks: perf.notStartedTasks,
        inProgressTasks: perf.inProgressTasks,
        completedTasks: perf.completedTasks,
        completionRate: perf.completionRate,
        assignedProjects: perf.assignedProjects,
        responsibleProjects: perf.responsibleProjects
      }));
  };

  // Calculate department performance (utilise les données dynamiques)
  const getDepartmentPerformance = (): DepartmentPerformance[] => {
    if (performanceLoading || !dynamicDepartmentPerformance.length) {
      return [];
    }

    return dynamicDepartmentPerformance
      .filter(dept => 
        searchTerm === '' || 
        dept.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(dept => ({
        department: dept.department,
        userCount: dept.userCount,
        totalTasks: dept.totalTasks,
        notStartedTasks: 0, // Calculé dynamiquement dans le service
        inProgressTasks: 0, // Calculé dynamiquement dans le service
        completedTasks: dept.completedTasks,
        completionRate: dept.completionRate,
        projectCount: dept.totalProjects
      }));
  };

  // Calculate project performance (utilise les données dynamiques)
  const getProjectPerformance = (): ProjectPerformance[] => {
    if (performanceLoading || !dynamicProjectPerformance.length) {
      return [];
    }

    return dynamicProjectPerformance
      .filter(proj => 
        searchTerm === '' || 
        proj.project.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proj.project.description && proj.project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .map(proj => ({
        project: proj.project,
        stats: proj.stats,
        memberCount: proj.memberCount,
        responsibleUser: proj.responsibleUser
      }));
  };

  // Fonction de rafraîchissement manuel
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const userPerformance = getUserPerformance();
  const departmentPerformance = getDepartmentPerformance();
  const projectPerformance = getProjectPerformance();

  // Pagination
  const getCurrentPageData = () => {
    let data: any[] = [];
    switch (activeView) {
      case 'users':
        data = userPerformance;
        break;
      case 'departments':
        data = departmentPerformance;
        break;
      case 'projects':
        data = projectPerformance;
        break;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    let totalItems = 0;
    switch (activeView) {
      case 'users':
        totalItems = userPerformance.length;
        break;
      case 'departments':
        totalItems = departmentPerformance.length;
        break;
      case 'projects':
        totalItems = projectPerformance.length;
        break;
    }
    return Math.ceil(totalItems / itemsPerPage);
  };

  const currentPageData = getCurrentPageData();
  const totalPages = getTotalPages();

  // Export to Excel
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // User Performance Sheet
    const userWorksheetData = [
      ['Nom', 'Prénom', 'Département', 'Fonction', 'Projets assignés', 'Projets responsables', 'Total tâches', 'Non débutées', 'En cours', 'Clôturées', 'Taux de completion (%)'],
      ...userPerformance.map(perf => [
        perf.user.nom,
        perf.user.prenom,
        perf.user.departement,
        perf.user.fonction || 'N/A',
        perf.assignedProjects,
        perf.responsibleProjects,
        perf.totalTasks,
        perf.notStartedTasks,
        perf.inProgressTasks,
        perf.completedTasks,
        perf.completionRate
      ])
    ];

    const userWorksheet = XLSX.utils.aoa_to_sheet(userWorksheetData);
    XLSX.utils.book_append_sheet(workbook, userWorksheet, 'Performance Utilisateurs');

    // Department Performance Sheet
    const deptWorksheetData = [
      ['Département', 'Nombre d\'utilisateurs', 'Nombre de projets', 'Total tâches', 'Non débutées', 'En cours', 'Clôturées', 'Taux de completion (%)'],
      ...departmentPerformance.map(dept => [
        dept.department,
        dept.userCount,
        dept.projectCount,
        dept.totalTasks,
        dept.notStartedTasks,
        dept.inProgressTasks,
        dept.completedTasks,
        dept.completionRate
      ])
    ];

    const deptWorksheet = XLSX.utils.aoa_to_sheet(deptWorksheetData);
    XLSX.utils.book_append_sheet(workbook, deptWorksheet, 'Performance Départements');

    // Project Performance Sheet
    const projWorksheetData = [
      ['Nom du projet', 'Responsable', 'Département', 'Membres', 'Total tâches', 'Non débutées', 'En cours', 'Clôturées', 'Progression (%)'],
      ...projectPerformance.map(proj => [
        proj.project.nom,
        proj.responsibleUser ? `${proj.responsibleUser.prenom} ${proj.responsibleUser.nom}` : 'N/A',
        proj.project.departement || 'N/A',
        proj.memberCount,
        proj.stats.totalTasks,
        proj.stats.notStartedTasks,
        proj.stats.inProgressTasks,
        proj.stats.completedTasks,
        proj.stats.percentage
      ])
    ];

    const projWorksheet = XLSX.utils.aoa_to_sheet(projWorksheetData);
    XLSX.utils.book_append_sheet(workbook, projWorksheet, 'Performance Projets');

    // Export
    const fileName = `Rapport_Performance_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Chart data for pie chart
  const getChartData = () => {
    let totalNotStarted = 0;
    let totalInProgress = 0;
    let totalCompleted = 0;

    switch (activeView) {
      case 'users':
        totalNotStarted = userPerformance.reduce((sum, perf) => sum + perf.notStartedTasks, 0);
        totalInProgress = userPerformance.reduce((sum, perf) => sum + perf.inProgressTasks, 0);
        totalCompleted = userPerformance.reduce((sum, perf) => sum + perf.completedTasks, 0);
        break;
      case 'departments':
        totalNotStarted = departmentPerformance.reduce((sum, dept) => sum + dept.notStartedTasks, 0);
        totalInProgress = departmentPerformance.reduce((sum, dept) => sum + dept.inProgressTasks, 0);
        totalCompleted = departmentPerformance.reduce((sum, dept) => sum + dept.completedTasks, 0);
        break;
      case 'projects':
        totalNotStarted = projectPerformance.reduce((sum, proj) => sum + proj.stats.notStartedTasks, 0);
        totalInProgress = projectPerformance.reduce((sum, proj) => sum + proj.stats.inProgressTasks, 0);
        totalCompleted = projectPerformance.reduce((sum, proj) => sum + proj.stats.completedTasks, 0);
        break;
    }

    return { totalNotStarted, totalInProgress, totalCompleted };
  };

  const chartData = getChartData();
  const totalTasks = chartData.totalNotStarted + chartData.totalInProgress + chartData.totalCompleted;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

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
               aria-label="Retour"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Tableau de bord des performances</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Analysez les performances par utilisateur, département et projet
                  </p>
                  {/* Indicateurs de statut */}
                  <div className="flex items-center space-x-4 mt-2">
                    {performanceLoading && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Chargement des données...</span>
                      </div>
                    )}
                    {performanceError && (
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle size={16} />
                        <span className="text-sm">Erreur de chargement</span>
                      </div>
                    )}
                    {lastUpdated && !performanceLoading && (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Clock size={16} />
                        <span className="text-sm">
                          Dernière mise à jour: {lastUpdated.toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || performanceLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                <span>{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Download size={18} />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* View Tabs */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setActiveView('users');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeView === 'users' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User size={16} />
                <span>Par utilisateur</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('departments');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeView === 'departments' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building size={16} />
                <span>Par département</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('projects');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeView === 'projects' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText size={16} />
                <span>Par projet</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={`Rechercher ${activeView === 'users' ? 'un utilisateur' : activeView === 'departments' ? 'un département' : 'un projet'}...`}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 aria-label={`Rechercher ${activeView === 'users' ? 'un utilisateur' : activeView === 'departments' ? 'un département' : 'un projet'}`}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400" size={16} />
                <select
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Toutes les périodes</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="quarter">Ce trimestre</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Clock className="text-gray-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Non débutées</p>
                <p className="text-2xl font-bold text-gray-900">{chartData.totalNotStarted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-gray-900">{chartData.totalInProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Clôturées</p>
                <p className="text-2xl font-bold text-gray-900">{chartData.totalCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Taux global</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalTasks > 0 ? Math.round((chartData.totalCompleted / totalTasks) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeView === 'users' ? 'Performances par utilisateur' : 
               activeView === 'departments' ? 'Performances par département' : 
               'Performances par projet'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {activeView === 'users' ? 'Analyse détaillée des performances individuelles de chaque membre' :
               activeView === 'departments' ? 'Synthèse des performances par département avec tous les membres affiliés' :
               'Répartition des tâches par état pour chaque projet avec les membres assignés'}
            </p>
          </div>

          {currentPageData.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Aucune donnée trouvée
              </h4>
              <p className="text-gray-500">
                Aucun résultat ne correspond à vos critères de recherche ou de filtrage.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {activeView === 'users' && (
                        <>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Utilisateur</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Projets</th>
                          <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Tâches par état</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Performance</th>
                        </>
                      )}
                      {activeView === 'departments' && (
                        <>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Département</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Membres</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Projets</th>
                          <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Tâches par état</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Performance</th>
                        </>
                      )}
                      {activeView === 'projects' && (
                        <>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Projet</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Responsable</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Membres</th>
                          <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">Tâches par état</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Progression</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeView === 'users' && currentPageData.map((perf: UserPerformance) => (
                      <tr key={perf.user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {perf.user.prenom.charAt(0)}{perf.user.nom.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {perf.user.prenom} {perf.user.nom}
                              </div>
                              <div className="text-sm text-gray-500">{perf.user.departement}</div>
                              {perf.user.fonction && (
                                <div className="text-xs text-gray-500">{perf.user.fonction}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900">{perf.assignedProjects} assigné{perf.assignedProjects > 1 ? 's' : ''}</div>
                            <div className="text-sm text-gray-500">{perf.responsibleProjects} responsable{perf.responsibleProjects > 1 ? 's' : ''}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <Clock size={12} className="text-gray-600" />
                                <span className="text-xs font-medium text-gray-700">Non débutées</span>
                              </div>
                              <span className="text-lg font-bold text-gray-900">{perf.notStartedTasks}</span>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-2">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <Target size={12} className="text-orange-600" />
                                <span className="text-xs font-medium text-orange-700">En cours</span>
                              </div>
                              <span className="text-lg font-bold text-orange-900">{perf.inProgressTasks}</span>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <BarChart3 size={12} className="text-green-600" />
                                <span className="text-xs font-medium text-green-700">Clôturées</span>
                              </div>
                              <span className="text-lg font-bold text-green-900">{perf.completedTasks}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">{perf.completedTasks}/{perf.totalTasks}</span>
                                <span className={`text-sm font-bold ${getProgressColor(perf.completionRate)}`}>
                                  {perf.completionRate}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(perf.completionRate)}`}
                                  style={{ width: `${perf.completionRate}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {activeView === 'departments' && currentPageData.map((dept: DepartmentPerformance) => (
                      <tr key={dept.department} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Building className="text-white" size={20} />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{dept.department}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{dept.userCount} membre{dept.userCount > 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{dept.projectCount} projet{dept.projectCount > 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <Clock size={12} className="text-gray-600" />
                                <span className="text-xs font-medium text-gray-700">Non débutées</span>
                              </div>
                              <span className="text-lg font-bold text-gray-900">{dept.notStartedTasks}</span>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-2">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <Target size={12} className="text-orange-600" />
                                <span className="text-xs font-medium text-orange-700">En cours</span>
                              </div>
                              <span className="text-lg font-bold text-orange-900">{dept.inProgressTasks}</span>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <BarChart3 size={12} className="text-green-600" />
                                <span className="text-xs font-medium text-green-700">Clôturées</span>
                              </div>
                              <span className="text-lg font-bold text-green-900">{dept.completedTasks}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">{dept.completedTasks}/{dept.totalTasks}</span>
                                <span className={`text-sm font-bold ${getProgressColor(dept.completionRate)}`}>
                                  {dept.completionRate}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(dept.completionRate)}`}
                                  style={{ width: `${dept.completionRate}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {activeView === 'projects' && currentPageData.map((proj: ProjectPerformance) => (
                      <tr key={proj.project.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <FileText className="text-white" size={20} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">{proj.project.nom}</span>
                                {proj.project.statut === 'cloture' && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center space-x-1">
                                    <Archive size={10} />
                                    <span>Clôturé</span>
                                  </span>
                                )}
                              </div>
                              {proj.project.departement && (
                                <div className="text-sm text-gray-500">{proj.project.departement}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {proj.responsibleUser ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                {proj.responsibleUser.prenom.charAt(0)}{proj.responsibleUser.nom.charAt(0)}
                              </div>
                              <span className="text-sm text-gray-900">
                                {proj.responsibleUser.prenom} {proj.responsibleUser.nom}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Non assigné</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{proj.memberCount} membre{proj.memberCount > 1 ? 's' : ''}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <Clock size={12} className="text-gray-600" />
                                <span className="text-xs font-medium text-gray-700">Non débutées</span>
                              </div>
                              <span className="text-lg font-bold text-gray-900">{proj.stats.notStartedTasks}</span>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-2">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <Target size={12} className="text-orange-600" />
                                <span className="text-xs font-medium text-orange-700">En cours</span>
                              </div>
                              <span className="text-lg font-bold text-orange-900">{proj.stats.inProgressTasks}</span>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <BarChart3 size={12} className="text-green-600" />
                                <span className="text-xs font-medium text-green-700">Clôturées</span>
                              </div>
                              <span className="text-lg font-bold text-green-900">{proj.stats.completedTasks}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">{proj.stats.completedTasks}/{proj.stats.totalTasks}</span>
                                <span className={`text-sm font-bold ${getProgressColor(proj.stats.percentage)}`}>
                                  {proj.stats.percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(proj.stats.percentage)}`}
                                  style={{ width: `${proj.stats.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Page {currentPage} sur {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                        {currentPage}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;