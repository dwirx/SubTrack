import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Bell, BellOff, BellRing, Smartphone, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface NotificationSettingsProps {
  onClose?: () => void;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <BellOff className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Notifications Not Supported</h3>
            <p className="text-xs text-amber-700">
              Your browser doesn't support push notifications. Try using Chrome or Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Push Notifications</h2>
            <p className="text-white/80 text-sm">Get reminders for upcoming payments</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : permission === 'denied' ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Bell className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">Permission Status</p>
              <p className="text-xs text-gray-500 capitalize">{permission}</p>
            </div>
          </div>
          {permission === 'default' && (
            <button
              onClick={requestPermission}
              disabled={isLoading}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Allow'}
            </button>
          )}
        </div>

        {/* Subscription Toggle */}
        {permission === 'granted' && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                <p className="text-xs text-gray-500">
                  {isSubscribed ? 'Enabled - You will receive reminders' : 'Disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              disabled={isLoading}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isSubscribed ? 'bg-green-500' : 'bg-gray-300'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  isSubscribed ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}

        {/* Test Notification */}
        {permission === 'granted' && isSubscribed && (
          <button
            onClick={sendTestNotification}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <BellRing className="w-5 h-5" />
            <span className="font-medium">Send Test Notification</span>
          </button>
        )}

        {/* Denied Permission Help */}
        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-red-900 mb-2">Notifications Blocked</h4>
            <p className="text-xs text-red-700 mb-3">
              You've blocked notifications. To enable them:
            </p>
            <ol className="text-xs text-red-700 space-y-1 list-decimal list-inside">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Notifications" in the permissions</li>
              <li>Change it to "Allow"</li>
              <li>Refresh the page</li>
            </ol>
          </div>
        )}

        {/* Features */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">What you'll get:</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              Payment reminders before due dates
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              Trial expiration alerts
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              Price change notifications
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
