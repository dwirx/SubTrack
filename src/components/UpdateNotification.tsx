import { useState, useEffect } from 'react';
import { RefreshCw, X, Download } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

export function UpdateNotification() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const updateServiceWorker = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
        // Auto-hide offline ready message after 5 seconds
        setTimeout(() => setOfflineReady(false), 5000);
      },
      onRegistered(registration) {
        console.log('SW registered:', registration);
      },
      onRegisterError(error) {
        console.error('SW registration error:', error);
      },
    });

    setUpdateSW(() => updateServiceWorker);
  }, []);

  const handleUpdate = async () => {
    if (updateSW) {
      await updateSW(true);
    }
  };

  const handleClose = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  // Show offline ready notification
  if (offlineReady) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-up">
        <div className="bg-teal-600 text-white rounded-xl shadow-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Siap Offline</p>
            <p className="text-xs text-white/80">App bisa digunakan tanpa internet</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Show update available notification
  if (needRefresh) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Update Tersedia</p>
                <p className="text-xs text-white/80">Versi baru siap diinstall</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 py-2 px-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Nanti
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 py-2 px-3 text-sm font-semibold bg-white text-teal-600 rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
