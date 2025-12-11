import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { InstallPrompt } from './components/InstallPrompt';
import { UpdateNotification } from './components/UpdateNotification';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CreditCard, Sparkles } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          {/* Logo */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/30 animate-pulse-soft">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          
          {/* Brand name */}
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              SubTrack
            </h1>
            <p className="text-slate-500 text-sm mt-1">Loading your subscriptions...</p>
          </div>
          
          {/* Loading bar */}
          <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full animate-shimmer" 
              style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingPage />;
}

function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <AppContent />
        <InstallPrompt />
        <UpdateNotification />
        <OfflineIndicator />
      </PreferencesProvider>
    </AuthProvider>
  );
}

export default App;
