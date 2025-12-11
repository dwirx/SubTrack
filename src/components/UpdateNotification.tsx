import React, { useEffect, useState } from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { RefreshCw, X } from 'lucide-react';

export function UpdateNotification() {
  const { needRefresh, offlineReady, updateServiceWorker } = useServiceWorker();
  const [showOfflineReady, setShowOfflineReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show offline ready notification briefly
  useEffect(() => {
    if (offlineReady) {
      setShowOfflineReady(true);
      const timer = setTimeout(() => {
        setShowOfflineReady(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady]);

  const handleUpdate = async () => {
    await updateServiceWorker();
    window.location.reload();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Show offline ready toast
  if (showOfflineReady && !needRefresh) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
        <div className="bg-green-600 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Ready for offline use</p>
              <p className="text-xs opacity-90">App cached successfully</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show update available notification
  if (needRefresh && !dismissed) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">
                Update Available
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                A new version is ready. Refresh to get the latest features.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Now
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
