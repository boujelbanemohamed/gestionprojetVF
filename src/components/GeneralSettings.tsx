import React, { useState } from 'react';
import { ArrowLeft, Settings, DollarSign, Shield, Cog } from 'lucide-react';
import { AuthUser } from '../types';
import { PermissionService } from '../utils/permissions';
import { Router } from '../utils/router';
import BudgetCategoriesSettings from './BudgetCategoriesSettings';
import PermissionsSettings from './PermissionsSettings';
import GeneralSettingsTab from './GeneralSettingsTab';

interface GeneralSettingsProps {
  currentUser: AuthUser;
  onBack: () => void;
}

type SettingsTab = 'general' | 'budget' | 'permissions';

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  currentUser,
  onBack
}) => {
  // Determine initial tab based on current route
  const getInitialTab = (): SettingsTab => {
    const currentRoute = Router.getCurrentRoute();
    switch (currentRoute.component) {
      case 'settings-budget':
        return 'budget';
      case 'settings-permissions':
        return 'permissions';
      case 'settings-general':
      default:
        return 'general';
    }
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(getInitialTab());

  const tabs = [
    {
      id: 'general' as const,
      label: 'Général',
      icon: Cog,
      description: 'Paramètres généraux de l\'application',
      show: PermissionService.hasPermission(currentUser, 'settings', 'view')
    },
    {
      id: 'budget' as const,
      label: 'Budget',
      icon: DollarSign,
      description: 'Gestion des catégories budgétaires',
      show: PermissionService.hasPermission(currentUser, 'budget', 'manage_categories')
    },
    {
      id: 'permissions' as const,
      label: 'Droits d\'accès',
      icon: Shield,
      description: 'Gestion des permissions utilisateurs',
      show: PermissionService.hasPermission(currentUser, 'settings', 'manage_permissions')
    }
  ].filter(tab => tab.show);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    
    // Update URL
    switch (tab) {
      case 'general':
        Router.replace('settings-general');
        break;
      case 'budget':
        Router.replace('settings-budget');
        break;
      case 'permissions':
        Router.replace('settings-permissions');
        break;
    }
  };

  const handleBack = () => {
    Router.navigate('dashboard');
    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Paramètres généraux</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Configuration et administration de l'application
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <GeneralSettingsTab currentUser={currentUser} />
            )}
            
            {activeTab === 'budget' && (
              <BudgetCategoriesSettings currentUser={currentUser} />
            )}
            
            {activeTab === 'permissions' && (
              <PermissionsSettings currentUser={currentUser} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;