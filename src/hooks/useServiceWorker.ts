import { useState, useEffect, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';

export interface UseServiceWorkerReturn {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: () => Promise<void>;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const updateServiceWorker = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegistered(registration) {
        console.log('Service Worker registered:', registration);
      },
      onRegisterError(error) {
        console.error('Service Worker registration error:', error);
      },
    });

    setUpdateSW(() => updateServiceWorker);
  }, []);

  const handleUpdate = useCallback(async () => {
    if (updateSW) {
      await updateSW();
      setNeedRefresh(false);
    }
  }, [updateSW]);

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: handleUpdate,
  };
}
