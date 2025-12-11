import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Download, X, Smartphone, Zap, WifiOff } from 'lucide-react';

export function InstallPrompt() {
  const { isInstallable, promptInstall, dismissPrompt } = useInstallPrompt();

  if (!isInstallable) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold">Install SubsManager</h2>
            <p className="text-white/80 text-sm mt-1">
              Get the full app experience on your device
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Quick Access</h3>
              <p className="text-xs text-gray-500">Launch instantly from your home screen</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <WifiOff className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Works Offline</h3>
              <p className="text-xs text-gray-500">Access your subscriptions anytime, anywhere</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">No App Store Needed</h3>
              <p className="text-xs text-gray-500">Install directly from your browser</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={promptInstall}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Install App
          </button>
          <button
            onClick={dismissPrompt}
            className="w-full py-3 px-4 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
          >
            Maybe Later
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={dismissPrompt}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
