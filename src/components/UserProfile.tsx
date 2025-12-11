import { useState } from 'react';
import { ArrowLeft, User, Globe, Bell, Check, Palette, Send, Unlink, Download, Upload, Smartphone, BellRing } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { CURRENCIES, Subscription } from '../lib/supabase';
import { getTelegramDeepLink, sendWelcomeMessage, sendTestMessage } from '../lib/telegram';
import { usePushNotifications } from '../hooks/usePushNotifications';
import ExportImportModal from './ExportImportModal';

type UserProfileProps = {
  onBack: () => void;
  subscriptions?: Subscription[];
  onSubscriptionsUpdate?: () => void;
};

export default function UserProfile({ onBack, subscriptions = [], onSubscriptionsUpdate }: UserProfileProps) {
  const { user } = useAuth();
  const { preferences, updatePreferences, connectTelegram, disconnectTelegram, t } = usePreferences();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [telegramConnecting, setTelegramConnecting] = useState(false);
  const [telegramTestSent, setTelegramTestSent] = useState(false);
  const [showExportImportModal, setShowExportImportModal] = useState(false);
  
  // Push notifications
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    requestPermission: requestPushPermission,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    sendTestNotification,
  } = usePushNotifications();
  const [formData, setFormData] = useState({
    displayName: preferences.displayName,
    language: preferences.language,
    defaultCurrency: preferences.defaultCurrency,
    dateFormat: preferences.dateFormat,
    theme: preferences.theme,
    emailNotifications: preferences.emailNotifications,
    telegramNotifications: preferences.telegramNotifications,
  });

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    await updatePreferences({
      displayName: formData.displayName,
      language: formData.language as 'en' | 'id',
      defaultCurrency: formData.defaultCurrency,
      dateFormat: formData.dateFormat as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD',
      theme: formData.theme as 'light' | 'dark' | 'system',
      emailNotifications: formData.emailNotifications,
      telegramNotifications: formData.telegramNotifications,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  ];

  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  ];

  const handleConnectTelegram = () => {
    if (!user?.id) return;
    
    // Open Telegram with deep link containing user_id
    const telegramUrl = getTelegramDeepLink(user.id);
    window.open(telegramUrl, '_blank');
    setTelegramConnecting(true);
    
    // Start polling for connection status
    const pollInterval = setInterval(async () => {
      // Reload preferences to check if telegram was connected via webhook
      window.location.reload();
    }, 5000);

    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setTelegramConnecting(false);
    }, 120000);
  };

  const handleDisconnectTelegram = async () => {
    await disconnectTelegram();
    setFormData(prev => ({ ...prev, telegramNotifications: false }));
  };

  const handleSendTestMessage = async () => {
    if (preferences.telegramChatId) {
      const success = await sendTestMessage(preferences.telegramChatId, preferences.language);
      if (success) {
        setTelegramTestSent(true);
        setTimeout(() => setTelegramTestSent(false), 3000);
      }
    }
  };

  // For demo: manual chat ID input (in production, use bot webhook)
  const [manualChatId, setManualChatId] = useState('');
  const handleManualConnect = async () => {
    if (manualChatId.trim()) {
      setTelegramConnecting(true);
      const success = await connectTelegram(manualChatId.trim());
      if (success) {
        await sendWelcomeMessage(manualChatId.trim(), preferences.displayName, preferences.language);
        setFormData(prev => ({ ...prev, telegramNotifications: true }));
      }
      setTelegramConnecting(false);
      setManualChatId('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label={t('common.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t('profile.title')}</h1>
              <p className="text-sm text-slate-500">{t('profile.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('profile.personalInfo')}
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('profile.email')}
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('profile.displayName')}
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  placeholder="Your name"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('profile.preferences')}
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {t('profile.language')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setFormData({ ...formData, language: lang.code as 'en' | 'id' })}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        formData.language === lang.code
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className={`font-medium ${
                        formData.language === lang.code ? 'text-teal-700' : 'text-slate-700'
                      }`}>
                        {lang.name}
                      </span>
                      {formData.language === lang.code && (
                        <Check className="w-5 h-5 text-teal-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('profile.defaultCurrency')}
                </label>
                <select
                  value={formData.defaultCurrency}
                  onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('profile.dateFormat')}
                </label>
                <select
                  value={formData.dateFormat}
                  onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                >
                  {dateFormats.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Palette className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('profile.theme')}
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3">
                {['light', 'dark', 'system'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setFormData({ ...formData, theme: theme as 'light' | 'dark' | 'system' })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      formData.theme === theme
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="mb-2">
                      {theme === 'light' && (
                        <div className="w-8 h-8 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 bg-yellow-400 rounded-full" />
                        </div>
                      )}
                      {theme === 'dark' && (
                        <div className="w-8 h-8 mx-auto bg-slate-800 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-slate-400 rounded-full" />
                        </div>
                      )}
                      {theme === 'system' && (
                        <div className="w-8 h-8 mx-auto bg-gradient-to-br from-yellow-100 to-slate-800 rounded-full" />
                      )}
                    </div>
                    <span className={`text-sm font-medium capitalize ${
                      formData.theme === theme ? 'text-teal-700' : 'text-slate-700'
                    }`}>
                      {t(`profile.theme${theme.charAt(0).toUpperCase() + theme.slice(1)}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('profile.notifications')}
                </h2>
              </div>
            </div>
            <div className="p-6">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-slate-900">{t('profile.emailNotifications')}</p>
                  <p className="text-sm text-slate-500">{t('profile.emailNotificationsDesc')}</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.emailNotifications}
                    onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setFormData({ ...formData, emailNotifications: !formData.emailNotifications })}
                    className={`w-14 h-8 rounded-full transition-colors cursor-pointer ${
                      formData.emailNotifications ? 'bg-teal-500' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${
                      formData.emailNotifications ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Telegram Integration Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t('profile.telegram')}
                  </h2>
                  <p className="text-sm text-slate-500">{t('profile.telegramDesc')}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {preferences.telegramChatId ? (
                <>
                  {/* Connected State */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">{t('profile.telegramConnected')}</p>
                        <p className="text-sm text-green-600">
                          {t('profile.telegramConnectedAt')}: {preferences.telegramConnectedAt 
                            ? new Date(preferences.telegramConnectedAt).toLocaleDateString() 
                            : '-'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDisconnectTelegram}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Unlink className="w-4 h-4" />
                      {t('profile.telegramDisconnect')}
                    </button>
                  </div>

                  {/* Telegram Notifications Toggle */}
                  <label className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-900">{t('profile.telegramNotifications')}</p>
                      <p className="text-sm text-slate-500">{t('profile.telegramNotificationsDesc')}</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.telegramNotifications}
                        onChange={(e) => setFormData({ ...formData, telegramNotifications: e.target.checked })}
                        className="sr-only"
                      />
                      <div
                        onClick={() => setFormData({ ...formData, telegramNotifications: !formData.telegramNotifications })}
                        className={`w-14 h-8 rounded-full transition-colors cursor-pointer ${
                          formData.telegramNotifications ? 'bg-teal-500' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${
                          formData.telegramNotifications ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </div>
                    </div>
                  </label>

                  {/* Send Test Message */}
                  <button
                    onClick={handleSendTestMessage}
                    disabled={telegramTestSent}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {telegramTestSent ? (
                      <>
                        <Check className="w-5 h-5" />
                        {t('profile.telegramTestSent')}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t('profile.telegramSendTest')}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Not Connected - Instructions */}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="font-medium text-blue-800 mb-2">📱 {t('profile.telegramHowTo')}</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>{t('profile.telegramStep1')}</li>
                      <li>{t('profile.telegramStep2')}</li>
                      <li>{t('profile.telegramStep3')}</li>
                      <li>{t('profile.telegramStep4')}</li>
                    </ul>
                  </div>

                  {/* Connect Button */}
                  <button
                    onClick={handleConnectTelegram}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                  >
                    <Send className="w-5 h-5" />
                    {t('profile.telegramConnect')}
                  </button>
                  <p className="text-center text-sm text-slate-500">{t('profile.telegramVerifyNote')}</p>

                  {/* Manual Chat ID Input (for demo/testing) */}
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">Chat ID (dari @userinfobot):</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualChatId}
                        onChange={(e) => setManualChatId(e.target.value)}
                        placeholder="Masukkan Chat ID"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={handleManualConnect}
                        disabled={!manualChatId.trim() || telegramConnecting}
                        className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {telegramConnecting ? '...' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Push Notifications Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Push Notifications</h2>
                  <p className="text-sm text-slate-500">Get reminders on your device (Android & iOS)</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {!pushSupported ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800">
                    Push notifications are not supported in your browser. Try using Chrome or Safari.
                  </p>
                </div>
              ) : (
                <>
                  {/* Permission Status */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        pushPermission === 'granted' ? 'bg-green-500' : 
                        pushPermission === 'denied' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <div>
                        <p className="font-medium text-slate-900">Permission Status</p>
                        <p className="text-sm text-slate-500 capitalize">{pushPermission}</p>
                      </div>
                    </div>
                    {pushPermission === 'default' && (
                      <button
                        onClick={requestPushPermission}
                        disabled={pushLoading}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        Allow
                      </button>
                    )}
                  </div>

                  {/* Push Toggle */}
                  {pushPermission === 'granted' && (
                    <label className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-medium text-slate-900">Push Notifications</p>
                        <p className="text-sm text-slate-500">
                          {pushSubscribed ? 'Enabled - You will receive reminders' : 'Disabled'}
                        </p>
                      </div>
                      <div
                        onClick={() => pushSubscribed ? unsubscribePush() : subscribePush()}
                        className={`w-14 h-8 rounded-full transition-colors cursor-pointer ${
                          pushSubscribed ? 'bg-teal-500' : 'bg-slate-300'
                        } ${pushLoading ? 'opacity-50' : ''}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${
                          pushSubscribed ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </div>
                    </label>
                  )}

                  {/* Test Notification */}
                  {pushPermission === 'granted' && pushSubscribed && (
                    <button
                      onClick={sendTestNotification}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors"
                    >
                      <BellRing className="w-5 h-5" />
                      Send Test Notification
                    </button>
                  )}

                  {/* Denied Help */}
                  {pushPermission === 'denied' && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                      <p className="text-sm font-medium text-red-800 mb-2">Notifications Blocked</p>
                      <p className="text-xs text-red-700">
                        To enable notifications, click the lock icon in your browser's address bar and allow notifications.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Export/Import Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Data Management</h2>
                  <p className="text-sm text-slate-500">Export or import your subscription data</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowExportImportModal(true)}
                  className="flex items-center justify-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium">Export Data</span>
                </button>
                <button
                  onClick={() => setShowExportImportModal(true)}
                  className="flex items-center justify-center gap-3 p-4 bg-teal-50 text-teal-700 rounded-xl hover:bg-teal-100 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Import Data</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Export your subscriptions as JSON or CSV, or import from a backup file.
              </p>
            </div>
          </section>

          <div className="flex items-center justify-end gap-4 pt-4">
            {saved && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">{t('profile.saved')}</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('profile.saving')}
                </>
              ) : (
                t('profile.save')
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Export/Import Modal */}
      <ExportImportModal
        isOpen={showExportImportModal}
        onClose={() => setShowExportImportModal(false)}
        onSuccess={() => {
          setShowExportImportModal(false);
          onSubscriptionsUpdate?.();
        }}
        subscriptions={subscriptions}
      />
    </div>
  );
}
