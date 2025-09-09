import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { NotificationService, Notification } from '../utils/notifications';

const NotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = NotificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-orange-600" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-600" size={20} />;
      default:
        return <Info className="text-blue-600" size={20} />;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const visibleNotifications = notifications.filter(n => !n.read).slice(0, 5);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg border p-4 shadow-lg transition-all duration-300 ${getColorClasses(notification.type)}`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium">{notification.title}</h4>
              <p className="text-sm mt-1 opacity-90">{notification.message}</p>
              
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex space-x-2 mt-3">
                  {notification.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.action();
                        NotificationService.markAsRead(notification.id);
                      }}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        action.style === 'primary' ? 'bg-white bg-opacity-20 hover:bg-opacity-30' :
                        action.style === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                        'bg-white bg-opacity-10 hover:bg-opacity-20'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => NotificationService.markAsRead(notification.id)}
              className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;