import { useEffect, useState } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getLastSyncTimestamp, formatLastSync } from '../lib/offlineManager';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [lastSync, setLastSync] = useState<string>('');
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const loadLastSync = async () => {
      const timestamp = await getLastSyncTimestamp();
      setLastSync(formatLastSync(timestamp));
    };
    loadLastSync();

    // Refresh every minute
    const interval = setInterval(loadLastSync, 60000);
    return () => clearInterval(interval);
  }, []);

  // Show reconnected message briefly
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full shadow-lg">
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-medium">Back online! Syncing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="flex items-center gap-3 px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg">
        <WifiOff className="w-4 h-4" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">You're offline</span>
          <span className="text-xs opacity-90">Last synced: {lastSync}</span>
        </div>
      </div>
    </div>
  );
}
